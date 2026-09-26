// Pure reminder helpers — no database access, so they are unit-testable
// with the built-in node:test runner and no extra dependencies.
//
// Time model: interview date values are UTC midnights and interview times
// are "HH:MM" wall-clock strings as the user typed them. The scheduler does
// all math in UTC (no DST, no server-local-timezone dependence). Because the
// product has no per-user timezone preference, the reminder email echoes the
// interview date/time exactly as stored instead of converting zones.

const FOLLOWUP_DAYS_MIN = 1;
const FOLLOWUP_DAYS_MAX = 30;
const MIN_APPS_MIN = 2;
const MIN_APPS_MAX = 20;
const INTERVIEW_HOURS_MIN = 1;
const INTERVIEW_HOURS_MAX = 72;

const DEFAULTS = {
    emailReminders: false,
    followupReminders: true,
    followupAfterDays: 7,
    minPendingApplications: 3,
    interviewReminders: true,
    interviewReminderHours: 24,
};

function toInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function clampInt(value, min, max, fallback) {
    const parsed = toInt(value, fallback);
    if (parsed < min || parsed > max) {
        throw new Error(`Value must be between ${min} and ${max}.`);
    }
    return parsed;
}

// Merge stored settings over defaults and validate every field.
// Throws on the first invalid value with a user-safe message.
function normalizeSettings(input) {
    const source = input && typeof input === "object" ? input : {};
    const merged = { ...DEFAULTS, ...source };
    return {
        emailReminders: merged.emailReminders === true,
        followupReminders: merged.followupReminders !== false,
        followupAfterDays: clampInt(
            merged.followupAfterDays,
            FOLLOWUP_DAYS_MIN,
            FOLLOWUP_DAYS_MAX,
            DEFAULTS.followupAfterDays
        ),
        minPendingApplications: clampInt(
            merged.minPendingApplications,
            MIN_APPS_MIN,
            MIN_APPS_MAX,
            DEFAULTS.minPendingApplications
        ),
        interviewReminders: merged.interviewReminders !== false,
        interviewReminderHours: clampInt(
            merged.interviewReminderHours,
            INTERVIEW_HOURS_MIN,
            INTERVIEW_HOURS_MAX,
            DEFAULTS.interviewReminderHours
        ),
    };
}

function isFollowupsEffective(settings) {
    return settings.emailReminders === true && settings.followupReminders === true;
}

function isInterviewsEffective(settings) {
    return settings.emailReminders === true && settings.interviewReminders === true;
}

// A follow-up candidate must still sit in the initial "Applied" state and be
// at least followupAfterDays old. Anything that moved forward is excluded.
function isFollowupEligible(app, settings, now = new Date()) {
    if (!app || app.status !== "Applied") return false;
    const applied = app.appliedDate ? new Date(app.appliedDate) : null;
    if (!applied || Number.isNaN(applied.getTime())) return false;
    const cutoff = new Date(now.getTime() - settings.followupAfterDays * 24 * 60 * 60 * 1000);
    return applied.getTime() <= cutoff.getTime();
}

// Combine a date with an "HH:MM" time into a UTC instant. The wall-clock
// values are always interpreted as Asia/Kolkata (IST, UTC+5:30 year-round,
// no DST) — that is how users enter them — and converted to UTC for
// storage/comparison. Missing time defaults to 09:00 IST.
const IST_OFFSET_MINUTES = 330;

function interviewDateTimeUTC(dateValue, timeValue) {
    const date = dateValue ? new Date(dateValue) : null;
    if (!date || Number.isNaN(date.getTime())) return null;
    let hours = 9;
    let minutes = 0;
    if (typeof timeValue === "string") {
        const match = timeValue.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
            hours = Math.min(23, Math.max(0, Number(match[1])));
            minutes = Math.min(59, Math.max(0, Number(match[2])));
        }
    }
    const istAsUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0);
    return new Date(istAsUtc - IST_OFFSET_MINUTES * 60 * 1000);
}

function interviewFingerprint(interview) {
    const source = interview && typeof interview === "object" ? interview : {};
    const date = source.date ? new Date(source.date) : null;
    const datePart = date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
    return [datePart, source.time || "", source.type || "", source.link || ""].join("|");
}

// Due when the reminder moment has passed but the interview is still ahead.
// Past interviews, missing dates, and far-future interviews are excluded.
function isInterviewDue(app, settings, now = new Date()) {
    if (!app || app.status !== "Interview Scheduled") return false;
    const interview = app.statusDetails && app.statusDetails.interview;
    if (!interview) return false;
    const at = interviewDateTimeUTC(interview.date, interview.time);
    if (!at) return false;
    const remindAt = new Date(at.getTime() - settings.interviewReminderHours * 60 * 60 * 1000);
    return remindAt.getTime() <= now.getTime() && at.getTime() > now.getTime();
}

function wholeDaysAgo(from, now = new Date()) {
    const date = from ? new Date(from) : null;
    if (!date || Number.isNaN(date.getTime())) return null;
    return Math.max(0, Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)));
}

module.exports = {
    DEFAULTS,
    FOLLOWUP_DAYS_MIN,
    FOLLOWUP_DAYS_MAX,
    MIN_APPS_MIN,
    MIN_APPS_MAX,
    INTERVIEW_HOURS_MIN,
    INTERVIEW_HOURS_MAX,
    normalizeSettings,
    isFollowupsEffective,
    isInterviewsEffective,
    isFollowupEligible,
    interviewDateTimeUTC,
    interviewFingerprint,
    isInterviewDue,
    wholeDaysAgo,
};
