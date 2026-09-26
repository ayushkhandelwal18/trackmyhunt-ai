const mongoose = require("mongoose");

// Persistent per-application history. One document per meaningful event:
// creation, and every status change. The snapshot preserves the state at
// event time so earlier entries survive later edits — the timeline is never
// derived from the current status alone.
//
// Snapshots are intentionally tiny (status + detail copies + resume title).
// No resume objects or duplicated application data are stored here.
const applicationEventSchema = new mongoose.Schema(
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
      enum: ["created", "status_changed"],
    },
    fromStatus: {
      type: String,
      default: null,
    },
    toStatus: {
      type: String,
      default: null,
    },
    snapshot: {
      status: { type: String },
      resumeTitle: { type: String },
      interview: {
        date: { type: Date },
        time: { type: String },
        type: { type: String },
        link: { type: String },
        notes: { type: String },
      },
      oa: {
        date: { type: Date },
        link: { type: String },
        notes: { type: String },
      },
      rejection: {
        date: { type: Date },
        reason: { type: String },
      },
    },
  },
  { timestamps: true }
);

applicationEventSchema.index({ application: 1, createdAt: 1 });

module.exports = mongoose.model("ApplicationEvent", applicationEventSchema);
