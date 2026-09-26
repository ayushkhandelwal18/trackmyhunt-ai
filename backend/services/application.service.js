const mongoose = require("mongoose");
const Application = require("../models/application.models");
const ApplicationEvent = require("../models/application-event.model");
const Resume = require("../models/resume.model");
const Reminder = require("../models/reminder.model");

const INTERVIEW_TYPES = ["Technical", "HR", "Behavioral", "Managerial", "Other"];

// Normalize free text for duplicate comparison: trim, collapse inner
// whitespace, lowercase. Company-only matching is deliberately NOT used on
// its own — a company can have many different jobs.
function normalizeText(value) {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

// Normalize a job URL for duplicate comparison: trim, drop the fragment,
// drop trailing slashes, lowercase. Query strings are kept — a different
// query can point at a genuinely different posting.
function normalizeJobUrl(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed
    .split("#")[0]
    .replace(/\/+$/, "")
    .toLowerCase();
}

// Find an existing application of this user that refers to the same job:
// primarily by normalized job URL; when the incoming entry has no URL,
// fall back to normalized company + title among URL-less entries.
// Scoped to the user — one user's data never affects another's.
async function findDuplicateApplication(userId, data) {
  const candidates = await Application.find({ user: userId }).select(
    "company role applicationLink appliedDate status"
  );
  const incomingUrl = normalizeJobUrl(data.applicationLink);
  if (incomingUrl) {
    return (
      candidates.find((app) => normalizeJobUrl(app.applicationLink) === incomingUrl) ||
      null
    );
  }
  const incomingCompany = normalizeText(data.company);
  const incomingRole = normalizeText(data.role);
  return (
    candidates.find(
      (app) =>
        !normalizeJobUrl(app.applicationLink) &&
        normalizeText(app.company) === incomingCompany &&
        normalizeText(app.role) === incomingRole
    ) || null
  );
}
// Resolve a frontend-supplied resumeId to a validated ObjectId.
// Returns null when no resume is mapped. Throws when the id is invalid
// or does not belong to the authenticated user (generic message so one
// user's resume ids cannot be probed from another account).
async function resolveResumeId(userId, resumeId) {
  if (!resumeId) return null;
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    throw new Error("Selected resume not found");
  }
  const resume = await Resume.findOne({ _id: resumeId, user: userId }).select("_id");
  if (!resume) throw new Error("Selected resume not found");
  return resume._id;
}

// Clean a frontend-supplied statusDetails object: trim strings, drop empty
// values, reject invalid dates/types. Returns undefined when no usable
// detail was provided, so the field stays absent on the document.
function sanitizeStatusDetails(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;

  const cleanString = (value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  };
  const cleanDate = (value) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("Please provide a valid date.");
    return date;
  };

  const details = {};

  const interview = input.interview || {};
  const interviewClean = {
    date: cleanDate(interview.date),
    time: cleanString(interview.time),
    type: cleanString(interview.type),
    link: cleanString(interview.link),
    notes: cleanString(interview.notes),
  };
  if (interviewClean.type && !INTERVIEW_TYPES.includes(interviewClean.type)) {
    throw new Error("Invalid interview type.");
  }
  if (Object.values(interviewClean).some((v) => v !== undefined)) {
    details.interview = interviewClean;
  }

  const oa = input.oa || {};
  const oaClean = {
    date: cleanDate(oa.date),
    link: cleanString(oa.link),
    notes: cleanString(oa.notes),
  };
  if (Object.values(oaClean).some((v) => v !== undefined)) {
    details.oa = oaClean;
  }

  const rejection = input.rejection || {};
  const rejectionClean = {
    date: cleanDate(rejection.date),
    reason: cleanString(rejection.reason),
  };
  if (Object.values(rejectionClean).some((v) => v !== undefined)) {
    details.rejection = rejectionClean;
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

// Capture the state worth preserving on the timeline at event time.
function snapshotOf(app) {
  const details = app.statusDetails || {};
  const pick = (source, keys) => {
    if (!source || typeof source !== "object") return undefined;
    const out = {};
    keys.forEach((key) => {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
        out[key] = source[key];
      }
    });
    return Object.keys(out).length > 0 ? out : undefined;
  };
  return {
    status: app.status,
    resumeTitle:
      app.resumeId && typeof app.resumeId === "object" ? app.resumeId.title || undefined : undefined,
    interview: pick(details.interview, ["date", "time", "type", "link", "notes"]),
    oa: pick(details.oa, ["date", "link", "notes"]),
    rejection: pick(details.rejection, ["date", "reason"]),
  };
}

async function recordEvent({ userId, applicationId, type, fromStatus = null, toStatus = null, app = null }) {
  await ApplicationEvent.create({
    user: userId,
    application: applicationId,
    type,
    fromStatus,
    toStatus,
    snapshot: app ? snapshotOf(app) : undefined,
  });
}

exports.createApplication = async (userId, data) => {
  const { resumeId, statusDetails, ...rest } = data || {};
  // Block duplicates before creating: same normalized job URL, or same
  // normalized company + title when no URL is provided. User-scoped.
  const duplicate = await findDuplicateApplication(userId, data || {});
  if (duplicate) {
    const error = new Error("This job is already in your applications.");
    error.status = 409;
    error.duplicate = duplicate;
    throw error;
  }
  const created = await Application.create({
    ...rest,
    resumeId: await resolveResumeId(userId, resumeId),
    statusDetails: sanitizeStatusDetails(statusDetails),
    user: userId,
  });
  // Snapshot a populated copy for the timeline without changing the
  // response shape of the created document.
  const forSnapshot = created.toObject();
  if (forSnapshot.resumeId) {
    const resume = await Resume.findOne({ _id: forSnapshot.resumeId, user: userId })
      .select("title")
      .lean();
    forSnapshot.resumeId = resume ? { _id: resume._id, title: resume.title } : forSnapshot.resumeId;
  }
  await recordEvent({
    userId,
    applicationId: created._id,
    type: "created",
    toStatus: created.status,
    app: forSnapshot,
  });
  return created;
};

exports.getApplications = async (userId) => {
  return await Application.find({ user: userId })
    .sort({ appliedDate: -1 })
    .populate("resumeId", "title link");
};

exports.updateApplication = async (appId, userId, data) => {
  const { resumeId, statusDetails, ...rest } = data || {};
  // Only touch resume mapping / status details when the caller explicitly
  // sends the key, so clients that don't know about them can't wipe them.
  const patch = { ...rest };
  const unset = {};
  if (data && Object.prototype.hasOwnProperty.call(data, "resumeId")) {
    patch.resumeId = await resolveResumeId(userId, resumeId);
  }
  if (data && Object.prototype.hasOwnProperty.call(data, "statusDetails")) {
    const clean = sanitizeStatusDetails(statusDetails);
    if (clean === undefined) {
      unset.statusDetails = 1;
    } else {
      patch.statusDetails = clean;
    }
  }
  const update = Object.keys(unset).length > 0 ? { $set: patch, $unset: unset } : patch;
  const previous = await Application.findOne({ _id: appId, user: userId }).select("status");
  if (!previous) throw new Error("Application not found");
  const app = await Application.findOneAndUpdate(
    { _id: appId, user: userId },
    update,
    { new: true, runValidators: true }
  ).populate("resumeId", "title link");

  if (!app) throw new Error("Application not found");
  // Record history only when the status actually changed. Metadata-only
  // edits never spam the timeline, and past entries are never rewritten.
  if (previous.status !== app.status) {
    await recordEvent({
      userId,
      applicationId: app._id,
      type: "status_changed",
      fromStatus: previous.status,
      toStatus: app.status,
      app,
    });
  }
  return app;
};

exports.getApplicationEvents = async (appId, userId) => {
  // Ownership check first: another user's id yields "not found", never data.
  const app = await Application.findOne({ _id: appId, user: userId }).select("_id");
  if (!app) throw new Error("Application not found");
  return await ApplicationEvent.find({ application: appId, user: userId }).sort({ createdAt: 1, _id: 1 });
};

exports.deleteApplication = async (appId, userId) => {
  const app = await Application.findOneAndDelete({
    _id: appId,
    user: userId,
  });

  if (!app) throw new Error("Application not found");
  // Drop reminder state and history for the deleted application.
  await Reminder.deleteMany({ application: app._id });
  await ApplicationEvent.deleteMany({ application: app._id });
  return true;
};
