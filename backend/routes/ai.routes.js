const express = require("express");
const multer = require("multer");
const router = express.Router();
const isAuthenticatedUser = require("../middleware/auth.middleware");
const { analyze } = require("../controllers/ai.controller");

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB — matches the saved-resume extraction cap.
const PDF_ONLY_MESSAGE = "Only PDF files are accepted. Please upload a .pdf file.";

// Memory storage only: an uploaded PDF lives in RAM for the current request.
// It is never written to disk, never stored, and never served publicly.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
        const isPdfMime = file.mimetype === "application/pdf";
        const isPdfExt = /\.pdf$/i.test(file.originalname || "");
        if (isPdfMime || isPdfExt) return cb(null, true);
        const err = new Error(PDF_ONLY_MESSAGE);
        err.code = "NOT_A_PDF";
        return cb(err);
    },
});

// Direct PDF upload only: multipart (resumePdf + jobDescription).
// The analyzer never reads saved resumes; every request carries its file.
router.route("/analyze").post(isAuthenticatedUser, upload.single("resumePdf"), analyze);

// Converts upload-layer failures into clean JSON errors. Anything else
// passes through to the global error handler.
function aiUploadErrorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
            .status(413)
            .json({ message: "The uploaded PDF is larger than 5 MB. Please upload a smaller file." });
    }
    if (err && err.code === "NOT_A_PDF") {
        return res.status(400).json({ message: err.message });
    }
    return next(err);
}

router.use(aiUploadErrorHandler);

module.exports = router;
