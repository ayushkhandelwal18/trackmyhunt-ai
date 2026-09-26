// Critical reminder-logic tests. Run with the built-in runner, no extra
// dependencies:  npm test   (node --test tests/)
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
    DEFAULTS,
    normalizeSettings,
    isFollowupsEffective,
    isInterviewsEffective,
    isFollowupEligible,
    interviewDateTimeUTC,
    interviewFingerprint,
    isInterviewDue,
    wholeDaysAgo,
} = require("../utils/reminders");

const NOW = new Date("2026-09-24T12:00:00.000Z");
const daysAgo = (n) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("reminder settings", () => {
    it("defaults to master OFF with sane thresholds", () => {
        assert.equal(DEFAULTS.emailReminders, false);
        assert.equal(DEFAULTS.followupAfterDays, 7);
        assert.equal(DEFAULTS.minPendingApplications, 3);
        assert.equal(DEFAULTS.interviewReminderHours, 24);
    });

    it("master OFF disables both reminder types", () => {
        const settings = normalizeSettings({ emailReminders: false });
        assert.equal(isFollowupsEffective(settings), false);
        assert.equal(isInterviewsEffective(settings), false);
    });

    it("sub-types only work when the master switch is on", () => {
        const settings = normalizeSettings({ emailReminders: true });
        assert.equal(isFollowupsEffective(settings), true);
        assert.equal(isInterviewsEffective(settings), true);
        const off = normalizeSettings({ emailReminders: true, followupReminders: false });
        assert.equal(isFollowupsEffective(off), false);
    });

    it("rejects unreasonable thresholds", () => {
        assert.throws(() => normalizeSettings({ followupAfterDays: 0 }), /between/);
        assert.throws(() => normalizeSettings({ followupAfterDays: 31 }), /between/);
        assert.throws(() => normalizeSettings({ minPendingApplications: 1 }), /between/);
        assert.throws(() => normalizeSettings({ minPendingApplications: 21 }), /between/);
        assert.throws(() => normalizeSettings({ interviewReminderHours: 0 }), /between/);
        assert.throws(() => normalizeSettings({ interviewReminderHours: 73 }), /between/);
    });

    it("fills missing fields with defaults", () => {
        const settings = normalizeSettings({});
        assert.equal(settings.followupAfterDays, 7);
        assert.equal(settings.minPendingApplications, 3);
        assert.equal(settings.interviewReminderHours, 24);
    });
});

describe("follow-up eligibility", () => {
    const settings = normalizeSettings({ emailReminders: true });

    it("includes Applied applications older than the threshold", () => {
        assert.equal(isFollowupEligible({ status: "Applied", appliedDate: daysAgo(7) }, settings, NOW), true);
        assert.equal(isFollowupEligible({ status: "Applied", appliedDate: daysAgo(9) }, settings, NOW), true);
    });

    it("excludes recent applications (7-day rule)", () => {
        assert.equal(isFollowupEligible({ status: "Applied", appliedDate: daysAgo(6) }, settings, NOW), false);
    });

    it("excludes anything that progressed beyond Applied", () => {
        for (const status of ["Resume Shortlisted", "OA Done", "Interview Scheduled", "Interview Done", "Rejected", "Other"]) {
            assert.equal(isFollowupEligible({ status, appliedDate: daysAgo(30) }, settings, NOW), false);
        }
    });

    it("excludes missing or invalid dates", () => {
        assert.equal(isFollowupEligible({ status: "Applied" }, settings, NOW), false);
        assert.equal(isFollowupEligible({ status: "Applied", appliedDate: "not-a-date" }, settings, NOW), false);
    });

    it("batches: below-threshold counts send nothing, threshold counts send one digest", () => {
        const apps = [
            { status: "Applied", appliedDate: daysAgo(7) },
            { status: "Applied", appliedDate: daysAgo(8) },
        ];
        const eligible = apps.filter((a) => isFollowupEligible(a, settings, NOW));
        assert.equal(eligible.length < settings.minPendingApplications, true);
        apps.push({ status: "Applied", appliedDate: daysAgo(9) });
        const eligibleNow = apps.filter((a) => isFollowupEligible(a, settings, NOW));
        assert.equal(eligibleNow.length >= settings.minPendingApplications, true);
    });

    it("computes whole days ago for email copy", () => {
        assert.equal(wholeDaysAgo(daysAgo(7), NOW), 7);
        assert.equal(wholeDaysAgo(daysAgo(0), NOW), 0);
    });
});

describe("interview reminders", () => {
    const settings = normalizeSettings({ emailReminders: true });
    const futureDate = new Date(NOW.getTime() + 25 * 60 * 60 * 1000);

    function scheduledApp(overrides = {}) {
        return {
            status: "Interview Scheduled",
            statusDetails: {
                interview: {
                    date: futureDate.toISOString(),
                    time: "11:00",
                    type: "Technical",
                    link: "https://meet.example.com/x",
                    ...overrides,
                },
            },
        };
    }

    it("is due inside the 24-hour window", () => {
        assert.equal(isInterviewDue(scheduledApp(), settings, NOW), true);
    });

    it("is not due far in the future", () => {
        const app = scheduledApp({ date: new Date(NOW.getTime() + 72 * 60 * 60 * 1000).toISOString() });
        assert.equal(isInterviewDue(app, settings, NOW), false);
    });

    it("excludes past interviews", () => {
        const app = scheduledApp({ date: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString() });
        assert.equal(isInterviewDue(app, settings, NOW), false);
    });

    it("excludes non-scheduled statuses (cancelled moved on)", () => {
        const app = { ...scheduledApp(), status: "Rejected" };
        assert.equal(isInterviewDue(app, settings, NOW), false);
    });

    it("fingerprint changes on reschedule so stale reminders never match", () => {
        const before = interviewFingerprint(scheduledApp().statusDetails.interview);
        const after = interviewFingerprint(
            scheduledApp({ date: new Date(NOW.getTime() + 50 * 60 * 60 * 1000).toISOString() }).statusDetails.interview
        );
        assert.notEqual(before, after);
        assert.equal(
            interviewFingerprint(scheduledApp().statusDetails.interview),
            before
        );
    });

    it("interprets wall-clock time as IST and converts to UTC", () => {
        const at = interviewDateTimeUTC("2026-09-25T00:00:00.000Z", "11:00");
        assert.equal(at.toISOString(), "2026-09-25T05:30:00.000Z");
    });

    it("handles midnight-boundary interviews", () => {
        const at = interviewDateTimeUTC("2026-09-25T00:00:00.000Z", "00:30");
        assert.equal(at.toISOString(), "2026-09-24T19:00:00.000Z");
    });

    it("computes the 24-hour reminder in IST for the reported example", () => {
        const at = interviewDateTimeUTC("2026-09-25", "13:14");
        assert.equal(at.toISOString(), "2026-09-25T07:44:00.000Z");
        const remindAt = new Date(at.getTime() - 24 * 60 * 60 * 1000);
        assert.equal(remindAt.toISOString(), "2026-09-24T07:44:00.000Z");
    });
});
