// Tests for the AI Analyzer direct-PDF input (upload-only flow).
// Offline only — no AI provider calls, no network. Run with:  npm test
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildUploadCacheId, extractUploadedPdfText } = require("../controllers/ai.controller");
const { normalizeResumeText } = require("../services/ai.service");
const {
  extractTextFromBytes,
  ResumeExtractionError,
  MIN_TEXT_LENGTH,
} = require("../services/resume-extract.service");

// Minimal one-page PDF built by hand (no fixtures, no new dependencies).
// Newlines in the text become separate text operations, like a real resume.
function minimalPdf(visibleText) {
  let y = 720;
  const stream = String(visibleText)
    .split("\n")
    .map((line) => {
      const op = `BT /F1 12 Tf 72 ${y} Td (${line}) Tj ET`;
      y -= 20;
      return op;
    })
    .join("\n");
  return Buffer.from(
    "%PDF-1.4\n" +
      "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
      "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
      `4 0 obj<</Length ${Buffer.byteLength(stream)}>>stream\n${stream}\nendstream\nendobj\n` +
      "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
      "trailer<</Root 1 0 R>>",
    "latin1"
  );
}

describe("resume text normalization (deterministic input)", () => {
  it("unifies CRLF, repeated whitespace, and blank runs", () => {
    assert.equal(
      normalizeResumeText("Ayush   Khandelwal\r\n\r\n\r\nNode.js  "),
      "Ayush Khandelwal\n\nNode.js"
    );
  });

  it("strips BOM and zero-width characters without touching content", () => {
    assert.equal(normalizeResumeText("﻿A​B​C"), "ABC");
  });

  it("normalizes Unicode compatibility forms (ligatures)", () => {
    assert.equal(normalizeResumeText("ﬁle"), "file");
  });

  it("is idempotent", () => {
    const once = normalizeResumeText("  A\r\n\r\nB  ");
    assert.equal(normalizeResumeText(once), once);
  });

  it("treats null/undefined/blank as empty", () => {
    assert.equal(normalizeResumeText(null), "");
    assert.equal(normalizeResumeText(undefined), "");
    assert.equal(normalizeResumeText("   \n  "), "");
  });
});

describe("buildUploadCacheId (no persistence needed)", () => {
  it("is stable for identical text", () => {
    assert.equal(buildUploadCacheId("same text"), buildUploadCacheId("same text"));
  });

  it("distinguishes different resumes", () => {
    const a = buildUploadCacheId("Node.js developer resume body");
    const b = buildUploadCacheId("Python data analyst resume body");
    assert.ok(a.startsWith("upload:"));
    assert.notEqual(a, b);
  });

  it("can never collide with a saved-resume id", () => {
    assert.ok(!buildUploadCacheId("x").startsWith("6ab4be37"));
  });

  it("fingerprints normalized text so identical content shares a cache entry", () => {
    const a = buildUploadCacheId(normalizeResumeText("Node.js\r\n\r\nReact  "));
    const b = buildUploadCacheId(normalizeResumeText("Node.js\n\nReact"));
    assert.equal(a, b);
  });
});

describe("uploaded PDF text extraction", () => {
  it("extracts real text from a PDF buffer", async () => {
    const text = await extractTextFromBytes(
      minimalPdf("Node.js React MongoDB resume content here"),
      "application/pdf",
      "resume.pdf"
    );
    assert.match(text, /Node\.js React MongoDB resume content here/);
  });

  it("enforces minimum readable text for uploads", async () => {
    // Short fixture extracts fine but is too thin to analyze.
    const short = await extractTextFromBytes(
      minimalPdf("tiny resume"),
      "application/pdf",
      "resume.pdf"
    );
    assert.ok(short.length < MIN_TEXT_LENGTH);
    await assert.rejects(
      () => extractUploadedPdfText({ buffer: minimalPdf("tiny resume"), mimetype: "application/pdf", originalname: "r.pdf" }),
      (err) => err instanceof ResumeExtractionError && err.statusCode === 422
    );
  });

  it("accepts a substantial uploaded PDF", async () => {
    const body = [
      "Ayush Khandelwal full stack developer from Kota Rajasthan",
      "Skills include Node.js Express React MongoDB SQL Git and AWS",
      "Built TrackMyHunt a MERN job tracking platform with OAuth",
      "Built AI-Buddy an LLM powered study assistant with Gemini API",
      "BTech ECE at IIIT Kota with eight CGPA plus open source work",
    ].join("\n");
    const text = await extractUploadedPdfText({
      buffer: minimalPdf(body),
      mimetype: "application/pdf",
      originalname: "resume.pdf",
    });
    assert.match(text, /Ayush Khandelwal/);
    assert.match(text, /TrackMyHunt/);
    assert.ok(text.length >= MIN_TEXT_LENGTH);
  });

  it("rejects empty and non-PDF uploads with clear 422 errors", async () => {
    await assert.rejects(
      () => extractUploadedPdfText({ buffer: Buffer.alloc(0), mimetype: "application/pdf", originalname: "r.pdf" }),
      (err) => err instanceof ResumeExtractionError && /empty/i.test(err.message)
    );
    await assert.rejects(
      () => extractUploadedPdfText({ buffer: Buffer.from("not a pdf at all"), mimetype: "application/pdf", originalname: "r.pdf" }),
      (err) => err instanceof ResumeExtractionError && /corrupt/i.test(err.message)
    );
  });

  it("rejects non-PDF bytes with a 422 extraction error", async () => {
    await assert.rejects(
      () => extractTextFromBytes(Buffer.from("just some text, not a pdf"), "application/pdf", "resume.pdf"),
      (err) => err instanceof ResumeExtractionError && err.statusCode === 422
    );
  });

  it("rejects HTML masquerading as a PDF", async () => {
    const html = Buffer.from("<!doctype html><html><body>login wall</body></html>");
    await assert.rejects(
      () => extractTextFromBytes(html, "application/pdf", "resume.pdf"),
      (err) => err instanceof ResumeExtractionError && err.statusCode === 422
    );
  });
});
