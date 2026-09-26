const mongoose = require("mongoose");

// Minimal, purpose-built reminder state. One document tracks a single
// remindable unit (an application awaiting follow-up, or a specific
// scheduled interview). No company/job data is duplicated here — the
// application is re-read at send time so stale reminders are never sent.
//
// Idempotency: unique compound indexes mean concurrent scheduler runs can
// never create two records for the same unit, and sends only ever act on
// documents atomically claimed with a batchId.
const reminderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["followup", "interview"],
            index: true,
        },
        // Interview reminders only: fingerprint of the scheduled interview
        // (date|time|type|link). Rescheduling produces a new fingerprint, so
        // the old reminder can never fire for the new slot.
        fingerprint: {
            type: String,
            default: null,
        },
        // Interview reminders only: when this reminder becomes due (UTC).
        remindAt: {
            type: Date,
            default: null,
            index: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["pending", "claimed", "sent", "cancelled"],
            default: "pending",
            index: true,
        },
        // Set while a scheduler run owns this document. Only documents
        // carrying the run's batchId are emailed and marked sent.
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        sentAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// One follow-up marker per application; one interview marker per scheduled slot.
reminderSchema.index({ user: 1, application: 1, type: 1, fingerprint: 1 }, { unique: true });
// Scheduler hot paths.
reminderSchema.index({ status: 1, remindAt: 1 });
reminderSchema.index({ user: 1, status: 1, type: 1 });

module.exports = mongoose.model("Reminder", reminderSchema);
