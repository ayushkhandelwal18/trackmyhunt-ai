const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String, 
            required: true,
            enum: ["GitHub", "YouTube", "Blog", "Article", "Course", "Website", "Documentation", "LinkedIn", "Google Drive", "Google Sheets", "PDF", "Other"],
        },
        link: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
