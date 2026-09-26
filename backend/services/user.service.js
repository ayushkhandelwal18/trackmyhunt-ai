const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const Application = require("../models/application.models");
const Opportunity = require("../models/opportunity.model");
const Skill = require("../models/skill.model");
const Resource = require("../models/resource.model");
const Note = require("../models/note.model");
const Resume = require("../models/resume.model");
const Reminder = require("../models/reminder.model");
const { normalizeSettings } = require("../utils/reminders");

exports.updateProfile = async (userId, { name }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (name) user.name = name;
    await user.save();

    return { id: user._id, name: user.name, email: user.email };
};

exports.getReminderSettings = async (userId) => {
    const user = await User.findById(userId).select("reminderSettings").lean();
    if (!user) throw new Error("User not found");
    return normalizeSettings(user.reminderSettings);
};

exports.updateReminderSettings = async (userId, input) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Server-side validation; normalizeSettings throws on unreasonable values.
    const settings = normalizeSettings(input);
    user.reminderSettings = settings;
    await user.save();

    return normalizeSettings(user.reminderSettings);
};

exports.changePassword = async (userId, { currentPassword, newPassword }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (!user.password) throw new Error("User authenticated via Google. Cannot change password.");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Incorrect current password");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: "Password updated successfully" };
};

exports.deleteAccount = async (userId, { password, googleToken }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Email/password accounts keep the existing password verification.
    // Google-created accounts carry only a random dummy value instead of a
    // bcrypt hash, so they verify with a fresh Google ID token instead.
    if (typeof user.password === "string" && /^\$2[aby]?\$/.test(user.password)) {
        if (!password) throw new Error("Password required to delete account");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Incorrect password");
    } else {
        if (!googleToken) throw new Error("Google re-authentication required to delete account");
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            throw new Error("Google verification failed. Please try again.");
        }
        const tokenEmail = String((payload && payload.email) || "").toLowerCase();
        if (!tokenEmail || tokenEmail !== String(user.email).toLowerCase()) {
            throw new Error("Google account does not match this TrackMyHunt account");
        }
        if (user.googleId && payload.sub !== user.googleId) {
            throw new Error("Google account does not match this TrackMyHunt account");
        }
    }

    
    await Promise.all([
        Application.deleteMany({ userId }),
        Opportunity.deleteMany({ userId }),
        Skill.deleteMany({ userId }),
        Resource.deleteMany({ userId }),
        Note.deleteMany({ userId }),
        Resume.deleteMany({ userId }),
        Reminder.deleteMany({ user: userId }),
        User.findByIdAndDelete(userId),
    ]);

    return { message: "Account deleted successfully" };
};
