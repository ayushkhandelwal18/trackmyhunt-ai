// Tests for the AI Analyzer resume-extraction pipeline. No network access:
// everything here is deterministic and runs offline with the built-in runner.
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
    extractResumeText,
    extractTextFromBytes,
    ResumeExtractionError,
    toFetchUrl,
    isBlockedHost,
    cleanText,
    googleDriveFileId,
    MIN_TEXT_LENGTH,
} = require("../services/resume-extract.service");

describe("resume link translation", () => {
    it("reads the file id out of a Drive /view link", () => {
        assert.equal(
            googleDriveFileId("https://drive.google.com/file/d/1dahQirpxEi1t4p09pSanL9glkp_Jk3_A/view?usp=sharing"),
            "1dahQirpxEi1t4p09pSanL9glkp_Jk3_A"
        );
    });

    it("converts a Drive view link into a direct download", () => {
        const target = toFetchUrl("https://drive.google.com/file/d/1ZvluPX5dHn7Euhi_z0C8mjqR9QeO4CEX/view?usp=drive_link");
        assert.equal(target.kind, "drive");
        assert.equal(target.url, "https://drive.google.com/uc?export=download&id=1ZvluPX5dHn7Euhi_z0C8mjqR9QeO4CEX");
    });

    it("converts a Drive open?id link into a direct download", () => {
        const target = toFetchUrl("https://drive.google.com/open?id=1u6DmCHnMQTvH3XnzFCgyNn92rVttF2J_");
        assert.equal(target.url, "https://drive.google.com/uc?export=download&id=1u6DmCHnMQTvH3XnzFCgyNn92rVttF2J_");
    });

    it("converts a Google Doc into a plain-text export", () => {
        const target = toFetchUrl("https://docs.google.com/document/d/1abcDEFghiJKLmnoPQRstuVwxyz1234567890/edit?usp=sharing");
        assert.equal(target.kind, "gdoc");
        assert.equal(
            target.url,
            "https://docs.google.com/document/d/1abcDEFghiJKLmnoPQRstuVwxyz1234567890/export?format=txt"
        );
    });

    it("passes ordinary public file links through unchanged", () => {
        const target = toFetchUrl("https://example.com/resume.pdf?x=1");
        assert.equal(target.kind, "direct");
        assert.equal(target.url, "https://example.com/resume.pdf?x=1");
    });

    it("rejects empty, malformed, and non-http links", () => {
        assert.equal(toFetchUrl(""), null);
        assert.equal(toFetchUrl("   "), null);
        assert.equal(toFetchUrl("not a url"), null);
        assert.equal(toFetchUrl("javascript:alert(1)"), null);
        assert.equal(toFetchUrl("file:///etc/passwd"), null);
        assert.equal(toFetchUrl(null), null);
    });
});

describe("SSRF host guard", () => {
    it("blocks loopback, private, link-local, and metadata hosts", () => {
        for (const host of [
            "localhost",
            "app.localhost",
            "127.0.0.1",
            "0.0.0.0",
            "10.0.0.5",
            "192.168.1.7",
            "172.16.0.1",
            "172.31.255.255",
            "169.254.169.254",
            "100.64.0.1",
            "::1",
            "fe80::1",
            "",
        ]) {
            assert.equal(isBlockedHost(host), true, `expected block for ${host}`);
        }
    });

    it("allows public hosts", () => {
        for (const host of ["drive.google.com", "example.com", "8.8.8.8", "172.32.0.1", "11.0.0.1"]) {
            assert.equal(isBlockedHost(host), false, `expected allow for ${host}`);
        }
    });
});

describe("text normalisation", () => {
    it("collapses whitespace and blank runs", () => {
        assert.equal(cleanText("Ayush   Khandelwal\r\n\r\n\r\n\r\nNode.js  "), "Ayush Khandelwal\n\nNode.js");
    });

    it("treats null/undefined as empty", () => {
        assert.equal(cleanText(null), "");
        assert.equal(cleanText(undefined), "");
    });
});

describe("byte classification", () => {
    it("rejects an HTML permission page instead of treating it as a resume", async () => {
        const html = Buffer.from("<!doctype html><html><body>You need access</body></html>");
        await assert.rejects(
            () => extractTextFromBytes(html, "text/html", "https://drive.google.com/uc?export=download&id=x"),
            (err) => {
                assert.ok(err instanceof ResumeExtractionError);
                assert.equal(err.statusCode, 422);
                assert.match(err.message, /Anyone with the link can view/);
                return true;
            }
        );
    });

    it("rejects unsupported binary types", async () => {
        const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
        await assert.rejects(
            () => extractTextFromBytes(png, "image/png", "https://example.com/resume.png"),
            (err) => err instanceof ResumeExtractionError && /Unsupported/.test(err.message)
        );
    });

    it("reads plain text responses", async () => {
        const text = Buffer.from("Ayush Khandelwal\nNode.js and React.js resume");
        const out = await extractTextFromBytes(text, "text/plain", "https://example.com/resume.txt");
        assert.match(out, /Node\.js and React\.js/);
    });
});

describe("extractResumeText", () => {
    it("throws a 422 extraction error when there is no link and no content", async () => {
        await assert.rejects(
            () => extractResumeText({ title: "Product Role", link: "", description: "" }),
            (err) => {
                assert.ok(err instanceof ResumeExtractionError);
                assert.equal(err.statusCode, 422);
                assert.ok(err.message.length > 10);
                return true;
            }
        );
    });

    it("throws rather than passing a short label through as resume content", async () => {
        await assert.rejects(
            () => extractResumeText({ title: "x", link: "", description: "Use this for React roles" }),
            (err) => err instanceof ResumeExtractionError && err.statusCode === 422
        );
    });

    it("throws for a blocked internal host", async () => {
        await assert.rejects(
            () => extractResumeText({ link: "http://127.0.0.1/secret.pdf", description: "" }),
            (err) => err instanceof ResumeExtractionError && err.statusCode === 422
        );
    });

    it("falls back to a substantial pasted description when no file can be read", async () => {
        const description = `Professional Summary\n${"Full-stack developer with Node.js, React.js, REST APIs and MongoDB experience. ".repeat(6)}`;
        assert.ok(description.length > MIN_TEXT_LENGTH);
        const text = await extractResumeText({ link: "", description });
        assert.match(text, /Node\.js/);
        assert.match(text, /React\.js/);
    });

    it("handles a completely missing record without throwing a non-422", async () => {
        await assert.rejects(
            () => extractResumeText(null),
            (err) => err instanceof ResumeExtractionError && err.statusCode === 422
        );
    });
});
