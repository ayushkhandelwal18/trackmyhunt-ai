// Resume content extraction for the AI Resume & JD Analyzer.
//
// The Resume model stores only { title, link, description }. The actual
// resume document lives behind `link` — in practice a Google Drive PDF.
// The AI Analyzer must send REAL resume text to the AI service, never metadata, so
// this module downloads the document server-side and turns it into plain
// text.
//
// Contract: either return usable resume text, or throw a ResumeExtractionError.
// There is deliberately NO silent fallback that would let the model invent a
// generic analysis from a title and a link.

const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const FETCH_TIMEOUT_MS = 20000;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
// Below this the payload is almost certainly a permission page, an error page,
// or a near-empty document rather than a real resume.
const MIN_TEXT_LENGTH = 200;

const GENERIC_EXTRACTION_MESSAGE =
    "We could not read any resume content for this record. Open it in the Resume Manager and make sure the link is a public PDF or DOCX shared as \"Anyone with the link can view\".";

class ResumeExtractionError extends Error {
    constructor(message) {
        super(message);
        this.name = "ResumeExtractionError";
        this.statusCode = 422;
    }
}

function cleanText(text) {
    return String(text || "")
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

// Pull a file id out of the many shapes Google Drive links come in.
function googleDriveFileId(link) {
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
        /[?&#]id=([a-zA-Z0-9_-]{10,})/,
        /\/d\/([a-zA-Z0-9_-]{10,})/,
    ];
    for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Translate a saved resume link into something we can actually download.
 * Returns { url, kind } or null when the link is unusable.
 *   - drive.google.com/view links -> direct-download endpoint
 *   - docs.google.com/document   -> plain-text export
 *   - anything else http(s)      -> fetched as-is
 */
function toFetchUrl(rawLink) {
    const link = String(rawLink || "").trim();
    if (!link) return null;

    let parsed;
    try {
        parsed = new URL(link);
    } catch {
        return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    const host = parsed.hostname.toLowerCase();
    if (host === "drive.google.com" || host === "docs.google.com") {
        const id = googleDriveFileId(link);
        if (!id) return null;
        if (host === "docs.google.com" && /\/document\//.test(parsed.pathname)) {
            return { url: `https://docs.google.com/document/d/${id}/export?format=txt`, kind: "gdoc" };
        }
        return { url: `https://drive.google.com/uc?export=download&id=${id}`, kind: "drive" };
    }

    return { url: link, kind: "direct" };
}

// Basic SSRF guard: resume links are user-supplied, so never fetch loopback,
// private ranges, link-local, or cloud-metadata addresses.
function isBlockedHost(hostname) {
    const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
    if (!host) return true;
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
        return true;
    }
    if (host.includes(":")) return host === "::1" || host === "::" || host.startsWith("fe80:");

    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // 169.254.169.254 metadata
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
}

async function downloadDocument(url) {
    let response;
    try {
        response = await fetch(url, {
            redirect: "follow",
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: { "User-Agent": "TrackMyHunt-ResumeAnalyzer/1.0" },
        });
    } catch (err) {
        const timedOut = err && (err.name === "TimeoutError" || err.name === "AbortError");
        throw new ResumeExtractionError(
            timedOut
                ? "Reading the resume file timed out. Check that the link is public and try again."
                : "Could not download the resume file. Check that the link is publicly accessible and try again."
        );
    }

    if (!response.ok) {
        throw new ResumeExtractionError(
            "Could not download the resume file. Make sure it is shared as \"Anyone with the link can view\"."
        );
    }

    let bytes;
    try {
        bytes = Buffer.from(await response.arrayBuffer());
    } catch {
        throw new ResumeExtractionError("Could not download the resume file. Please try again.");
    }

    if (!bytes.length) {
        throw new ResumeExtractionError("The resume file came back empty. Please try again.");
    }
    if (bytes.length > MAX_FILE_BYTES) {
        throw new ResumeExtractionError("The resume file is larger than 5 MB. Please upload a smaller file.");
    }

    return { bytes, contentType: response.headers.get("content-type") || "" };
}

async function extractPdfText(bytes) {
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    try {
        const result = await parser.getText();
        return cleanText((result && result.text) || "");
    } catch {
        throw new ResumeExtractionError(
            "Could not read this PDF. If it is a scanned image, please upload a text-based (selectable) PDF."
        );
    } finally {
        await parser.destroy().catch(() => {});
    }
}

async function extractDocxText(bytes) {
    try {
        const result = await mammoth.extractRawText({ buffer: bytes });
        return cleanText((result && result.value) || "");
    } catch {
        throw new ResumeExtractionError("Could not read this document. Please re-upload the resume as a PDF or DOCX.");
    }
}

/**
 * Turn downloaded bytes into resume text. Type is decided by magic bytes
 * first (Google Drive serves everything as application/octet-stream), then
 * content-type, then URL extension.
 */
async function extractTextFromBytes(bytes, contentType = "", sourceUrl = "") {
    const head = bytes.slice(0, 512).toString("latin1");
    const isPdf = bytes.slice(0, 5).toString("latin1") === "%PDF-";
    const isZip = bytes.slice(0, 2).toString("latin1") === "PK";
    const looksHtml = /^\s*<!doctype html|^\s*<html/i.test(head);

    // A Drive permission page or login wall instead of the actual file.
    if (looksHtml && !isPdf) {
        throw new ResumeExtractionError(
            "This link returned a web page instead of the resume file. Make sure the file is shared as \"Anyone with the link can view\"."
        );
    }

    const ct = String(contentType || "").toLowerCase();
    const path = String(sourceUrl || "").toLowerCase().split("?")[0];

    if (isPdf) return extractPdfText(bytes);
    if (isZip || ct.includes("wordprocessingml") || ct.includes("officedocument.word") || path.endsWith(".docx")) {
        return extractDocxText(bytes);
    }
    if (ct.startsWith("text/") || ct.includes("charset=")) {
        return cleanText(bytes.toString("utf8"));
    }

    throw new ResumeExtractionError(
        "Unsupported resume file type. Please share the resume as a PDF or DOCX."
    );
}

/**
 * Resolve a saved resume record to plain text for analysis.
 *
 * Order of preference:
 *   1. Text extracted from the document behind resume.link (the real resume)
 *   2. A substantial resume.description the user pasted in manually
 * Otherwise throw ResumeExtractionError — never return metadata-only input.
 */
async function extractResumeText(resume) {
    const record = resume && typeof resume === "object" ? resume : {};
    const description = cleanText(record.description);

    let documentText = "";
    let extractionError = null;
    let fetchedBytes = false;

    const target = toFetchUrl(record.link);
    if (target) {
        if (isBlockedHost(new URL(target.url).hostname)) {
            extractionError = new ResumeExtractionError(GENERIC_EXTRACTION_MESSAGE);
        } else {
            try {
                const { bytes, contentType } = await downloadDocument(target.url);
                fetchedBytes = true;
                documentText = await extractTextFromBytes(bytes, contentType, target.url);
            } catch (err) {
                extractionError =
                    err instanceof ResumeExtractionError
                        ? err
                        : new ResumeExtractionError(GENERIC_EXTRACTION_MESSAGE);
            }
        }
    } else if (record.link) {
        extractionError = new ResumeExtractionError(GENERIC_EXTRACTION_MESSAGE);
    }

    if (documentText.length >= MIN_TEXT_LENGTH) {
        // The downloaded document is the source of truth. Only append the
        // description when it is long enough to be real resume content.
        return description.length >= MIN_TEXT_LENGTH
            ? `${documentText}\n\nNOTES SAVED WITH THIS RESUME:\n${description}`
            : documentText;
    }

    if (description.length >= MIN_TEXT_LENGTH) return description;

    // Distinguish "file opened but had no text" (scanned image) from
    // "we never got the file at all".
    if (fetchedBytes && !extractionError) {
        throw new ResumeExtractionError(
            "This resume file contains no extractable text. It may be a scanned image — please upload a text-based PDF or DOCX."
        );
    }

    throw extractionError || new ResumeExtractionError(GENERIC_EXTRACTION_MESSAGE);
}

module.exports = {
    extractResumeText,
    extractTextFromBytes,
    ResumeExtractionError,
    toFetchUrl,
    isBlockedHost,
    cleanText,
    googleDriveFileId,
    MIN_TEXT_LENGTH,
};
