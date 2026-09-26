const crypto = require("crypto");
const aiService = require("../services/ai.service");
const { normalizeResumeText } = aiService;
const {
  extractTextFromBytes,
  ResumeExtractionError,
  MIN_TEXT_LENGTH,
} = require("../services/resume-extract.service");

// Content-based cache id for uploaded PDFs: user + normalized-text hash +
// JD + prompt version (all folded into analyzeResumeForJD's key) can never
// collide with another resume's analysis. Nothing is persisted to build it.
function buildUploadCacheId(normalizedResumeText) {
  return "upload:" + crypto.createHash("sha256").update(String(normalizedResumeText), "utf8").digest("hex");
}

function validateJobDescription(jobDescription) {
  if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
    return "Please paste a job description.";
  }
  if (jobDescription.trim().length < 50) {
    return "The job description looks too short. Please paste the full description.";
  }
  if (jobDescription.length > 20000) {
    return "The job description is too long. Please keep it under 20,000 characters.";
  }
  return null;
}

// Uploaded PDFs stay in memory only: never written to disk, never logged,
// never stored. Magic bytes are checked first so corrupt files get a clear
// error instead of a generic extraction failure.
async function extractUploadedPdfText(file) {
  const buffer = file && file.buffer;
  if (!buffer || !buffer.length) {
    throw new ResumeExtractionError("The uploaded file is empty. Please upload a valid PDF resume.");
  }
  if (buffer.slice(0, 5).toString("latin1") !== "%PDF-") {
    throw new ResumeExtractionError(
      "This file could not be read as a PDF. It may be corrupted — please try another file."
    );
  }
  const text = await extractTextFromBytes(buffer, file.mimetype, file.originalname);
  if (!text || text.length < MIN_TEXT_LENGTH) {
    throw new ResumeExtractionError(
      "We could not read enough text from this PDF. If it is a scanned image, please upload a text-based PDF."
    );
  }
  return text;
}

// POST /api/ai/analyze — direct PDF upload only. The analyzer never reads
// Resume Manager records, MongoDB resume documents, or external URLs;
// every analysis starts from the uploaded file.
exports.analyze = async (req, res) => {
  try {
    const { jobDescription } = req.body || {};

    const jdError = validateJobDescription(jobDescription);
    if (jdError) {
      return res.status(400).json({ message: jdError });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume PDF to analyze." });
    }

    // Extract, then normalize so identical content always yields identical
    // text for the cache fingerprint and the AI call below.
    let resumeText;
    try {
      resumeText = normalizeResumeText(await extractUploadedPdfText(req.file));
    } catch (err) {
      if (err instanceof ResumeExtractionError) {
        return res.status(err.statusCode || 422).json({ message: err.message });
      }
      return res
        .status(422)
        .json({ message: "We could not read this PDF. Please try another file." });
    }

    const userId = req.user.id || String(req.user._id);
    const { analysis, cached } = await aiService.analyzeResumeForJD({
      userId,
      resumeId: buildUploadCacheId(resumeText),
      resumeText,
      jobDescription: jobDescription.trim(),
    });

    return res.status(200).json({ success: true, cached, analysis });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    // Never expose raw internal errors, keys, or stack traces.
    const message =
      statusCode === 500
        ? "Something went wrong while analyzing. Please try again."
        : err.message || "Something went wrong while analyzing. Please try again.";
    return res.status(statusCode).json({ message });
  }
};

module.exports.buildUploadCacheId = buildUploadCacheId;
module.exports.extractUploadedPdfText = extractUploadedPdfText;
