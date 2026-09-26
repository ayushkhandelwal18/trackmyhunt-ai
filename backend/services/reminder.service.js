const mongoose = require("mongoose");
const User = require("../models/user.model");
const Application = require("../models/application.models");
const Reminder = require("../models/reminder.model");
const { sendEmailResend } = require("./mail.services");
const {
    normalizeSettings,
    isFollowupsEffective,
    isInterviewsEffective,
    isFollowupEligible,
    interviewDateTimeUTC,
    interviewFingerprint,
    isInterviewDue,
    wholeDaysAgo,
} = require("../utils/reminders");

// Default mailer: renders the local HTML templates in backend/templates/
// and delivers them with Resend. Secrets stay in server-side environment
// variables; nothing reaches the frontend.
async function defaultSendMail({ to, subject, templateFile, params }) {
    return sendEmailResend(to, subject, templateFile, params);
}

function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function appsUrl() {
    const base = (process.env.CLIENT_URL || "").replace(/\/+$/, "");
    return base ? `${base}/applications` : "/applications";
}

function formatUtcDay(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

function isDuplicateKeyError(err) {
    return err && (err.code === 11000 || (err.writeErrors || []).some((e) => e.code === 11000));
}

async function bulkUpsertMarkers(operations, logger) {
    if (!operations.length) return;
    try {
        await Reminder.bulkWrite(operations, { ordered: false });
    } catch (err) {
        // Duplicate-key failures just mean another run created the marker.
        if (!isDuplicateKeyError(err) && !(err.writeErrors || []).length) throw err;
        const nonDupes = (err.writeErrors || []).filter((e) => e.code !== 11000);
        if (nonDupes.length) {
            throw new Error(`Reminder marker write failed: ${nonDupes[0].errmsg || "unknown error"}`);
        }
        if (logger) logger.warn("[reminders] Ignored duplicate marker writes from a concurrent run.");
    }
}

// ---- Follow-up digest ------------------------------------------------------

function followupEmailHtml(userName, items, url) {
    const rows = items
        .map(
            (item) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eeeeee;">
                <div style="font-weight:600;color:#111111;">${escapeHtml(item.company)} — ${escapeHtml(item.role)}</div>
                <div style="font-size:13px;color:#666666;">Applied ${item.daysAgo} day${item.daysAgo === 1 ? "" : "s"} ago</div>
              </td>
            </tr>`
        )
        .join("");
    return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222222;">
      <h2 style="font-size:18px;">Your job applications may need a follow-up</h2>
      <p style="font-size:14px;">Hi ${escapeHtml(userName)}, these applications have been waiting a while:</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin-top:20px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">View Applications</a></p>
    </div>`;
}

async function processUserFollowups(user, settings, now, ctx) {
    const apps = await Application.find({ user: user._id, status: "Applied" })
        .select("_id company role appliedDate status")
        .lean();
    const eligible = apps.filter((app) => isFollowupEligible(app, settings, now));
    if (!eligible.length) return { sent: false };

    await bulkUpsertMarkers(
        eligible.map((app) => ({
            updateOne: {
                filter: { user: user._id, application: app._id, type: "followup" },
                update: { $setOnInsert: { user: user._id, application: app._id, type: "followup", status: "pending" } },
                upsert: true,
            },
        })),
        ctx.logger
    );

    // Re-read current state so progressed/deleted applications are excluded.
    const markers = await Reminder.find({ user: user._id, type: "followup", status: "pending" })
        .populate("application", "company role appliedDate status")
        .lean();
    const stillEligible = [];
    const staleIds = [];
    for (const marker of markers) {
        if (marker.application && isFollowupEligible(marker.application, settings, now)) {
            stillEligible.push(marker);
        } else {
            staleIds.push(marker._id);
        }
    }
    if (staleIds.length) {
        await Reminder.updateMany({ _id: { $in: staleIds } }, { $set: { status: "cancelled" } });
    }
    if (stillEligible.length < settings.minPendingApplications) return { sent: false };

    // Claim exactly the documents this run will email. A concurrent run finds
    // nothing pending and skips, so the digest can never be sent twice.
    const batchId = new mongoose.Types.ObjectId();
    await Reminder.updateMany(
        { _id: { $in: stillEligible.map((m) => m._id) }, status: "pending" },
        { $set: { status: "claimed", batchId } }
    );
    const claimed = await Reminder.find({ batchId })
        .populate("application", "company role appliedDate status")
        .lean();
    if (claimed.length < settings.minPendingApplications) {
        await Reminder.updateMany({ batchId }, { $set: { status: "pending", batchId: null } });
        return { sent: false };
    }

    const items = claimed
        .filter((m) => m.application)
        .map((m) => ({
            company: m.application.company,
            role: m.application.role,
            daysAgo: wholeDaysAgo(m.application.appliedDate, now) || 0,
        }));
    try {
        await ctx.sendMail({
            to: user.email,
            subject: `TrackMyHunt — ${claimed.length} applications to follow up`,
            templateFile: "followup-email.html",
            params: {
                user_name: user.name,
                heading: "Your job applications may need a follow-up",
                message_html: followupEmailHtml(user.name, items, appsUrl()),
                cta_url: appsUrl(),
            },
        });
    } catch (err) {
        // Provider failure: leave markers pending for a later run. Never mark sent.
        await Reminder.updateMany({ batchId }, { $set: { status: "pending", batchId: null } });
        throw err;
    }
    await Reminder.updateMany({ batchId }, { $set: { status: "sent", sentAt: now, batchId: null } });
    return { sent: true, count: claimed.length };
}

// ---- Interview reminders ---------------------------------------------------

function interviewEmailHtml(items) {
    const rows = items
        .map(
            (item) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eeeeee;">
                <div style="font-weight:600;color:#111111;">${escapeHtml(item.company)} — ${escapeHtml(item.title)}</div>
                <div style="font-size:13px;color:#666666;">${escapeHtml(item.when)}</div>
              </td>
            </tr>`
        )
        .join("");
    // Rows only: the outer interview-email.html layout already provides the
    // heading, greeting, and View Applications button.
    return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

function interviewDisplayWhen(interview) {
    const day = formatUtcDay(interview.date);
    const time = typeof interview.time === "string" && interview.time ? interview.time : "";
    return [day, time].filter(Boolean).join(" · ");
}

async function processUserInterviews(user, settings, now, ctx) {
    const apps = await Application.find({ user: user._id, status: "Interview Scheduled" })
        .select("_id company role status statusDetails")
        .lean();

    const upcoming = apps.filter((app) => {
        const interview = app.statusDetails && app.statusDetails.interview;
        if (!interview) return false;
        const at = interviewDateTimeUTC(interview.date, interview.time);
        return at && at.getTime() > now.getTime();
    });

    // Upsert a marker per current slot; remindAt follows the user's setting.
    await bulkUpsertMarkers(
        upcoming.map((app) => {
            const interview = app.statusDetails.interview;
            const at = interviewDateTimeUTC(interview.date, interview.time);
            return {
                updateOne: {
                    filter: {
                        user: user._id,
                        application: app._id,
                        type: "interview",
                        fingerprint: interviewFingerprint(interview),
                    },
                    update: {
                        $set: {
                            remindAt: new Date(at.getTime() - settings.interviewReminderHours * 60 * 60 * 1000),
                        },
                        $setOnInsert: {
                            user: user._id,
                            application: app._id,
                            type: "interview",
                            fingerprint: interviewFingerprint(interview),
                            status: "pending",
                        },
                    },
                    upsert: true,
                },
            };
        }),
        ctx.logger
    );

    // Cancel stale markers: deleted apps, moved-out statuses, reschedules.
    const pending = await Reminder.find({ user: user._id, type: "interview", status: "pending" })
        .populate("application", "status statusDetails")
        .lean();
    const staleIds = [];
    const dueIds = [];
    for (const marker of pending) {
        const current = marker.application && marker.application.statusDetails
            ? marker.application.statusDetails.interview
            : null;
        if (!marker.application || marker.application.status !== "Interview Scheduled" || !current) {
            staleIds.push(marker._id);
            continue;
        }
        if (interviewFingerprint(current) !== marker.fingerprint) {
            staleIds.push(marker._id);
            continue;
        }
        const at = interviewDateTimeUTC(current.date, current.time);
        if (!at || at.getTime() <= now.getTime()) {
            // Past or invalid — never remind, never retry.
            staleIds.push(marker._id);
            continue;
        }
        if (marker.remindAt && new Date(marker.remindAt).getTime() <= now.getTime()) {
            dueIds.push(marker._id);
        }
    }
    if (staleIds.length) {
        await Reminder.updateMany({ _id: { $in: staleIds } }, { $set: { status: "cancelled" } });
    }
    if (!dueIds.length) return { sent: false };

    // One consolidated email for every due interview.
    const batchId = new mongoose.Types.ObjectId();
    await Reminder.updateMany(
        { _id: { $in: dueIds }, status: "pending" },
        { $set: { status: "claimed", batchId } }
    );
    const claimed = await Reminder.find({ batchId })
        .populate("application", "company role status statusDetails")
        .lean();
    // Final freshness check: only still-scheduled, still-due interviews.
    const fresh = claimed.filter((m) => m.application && isInterviewDue(m.application, settings, now));
    if (!fresh.length) {
        await Reminder.updateMany({ batchId }, { $set: { status: "pending", batchId: null } });
        return { sent: false };
    }
    if (fresh.length !== claimed.length) {
        const freshIds = new Set(fresh.map((m) => String(m._id)));
        await Reminder.updateMany(
            { batchId, _id: { $nin: [...freshIds] } },
            { $set: { status: "pending", batchId: null } }
        );
    }

    const items = fresh.map((m) => {
        const interview = m.application.statusDetails.interview;
        return {
            company: m.application.company,
            title: `${interview.type || "Interview"}`,
            when: interviewDisplayWhen(interview),
        };
    });
    try {
        await ctx.sendMail({
            to: user.email,
            subject: "TrackMyHunt — Upcoming interviews",
            templateFile: "interview-email.html",
            params: {
                user_name: user.name,
                heading: "You have upcoming interviews",
                message_html: interviewEmailHtml(items),
                cta_url: appsUrl(),
            },
        });
    } catch (err) {
        await Reminder.updateMany({ batchId }, { $set: { status: "pending", batchId: null } });
        throw err;
    }
    const sentIds = fresh.map((m) => m._id);
    await Reminder.updateMany({ _id: { $in: sentIds } }, { $set: { status: "sent", sentAt: now, batchId: null } });
    return { sent: true, count: sentIds.length };
}

// ---- Cycle entry point ------------------------------------------------------
// Safe to run repeatedly and from any host: all state lives in MongoDB,
// sends only happen for atomically claimed documents, and failures always
// release their claims back to pending. Never called from API requests.
async function runReminderCycle({ now = new Date(), sendMail = defaultSendMail, logger = console } = {}) {
    const summary = { usersChecked: 0, followupEmails: 0, interviewEmails: 0, errors: 0 };
    // Only users who explicitly opted in. Add pagination here if the user
    // base outgrows single-query fetching.
    const users = await User.find({ "reminderSettings.emailReminders": true })
        .select("_id name email reminderSettings")
        .lean();
    for (const user of users) {
        summary.usersChecked += 1;
        try {
            const settings = normalizeSettings(user.reminderSettings);
            if (isFollowupsEffective(settings)) {
                const result = await processUserFollowups(user, settings, now, { sendMail, logger });
                if (result.sent) summary.followupEmails += 1;
            }
            if (isInterviewsEffective(settings)) {
                const result = await processUserInterviews(user, settings, now, { sendMail, logger });
                if (result.sent) summary.interviewEmails += 1;
            }
        } catch (err) {
            summary.errors += 1;
            if (logger) logger.error(`[reminders] Failed for user ${user._id}: ${err.message}`);
        }
    }
    if (logger) logger.log(`[reminders] Cycle done: ${JSON.stringify(summary)}`);
    return summary;
}

module.exports = {
    runReminderCycle,
    processUserFollowups,
    processUserInterviews,
    followupEmailHtml,
    interviewEmailHtml,
};
