const User = require("../models/user.model");
const bcrypt = require("bcrypt");
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

// True only for a user-set local password. Google-created accounts carry a
// random dummy value instead of a bcrypt hash, so they fail this check.
function hasLocalPassword(user) {
    return typeof user.password === "string" && /^\$2[aby]?\$/.test(user.password);
}

exports.getPasswordStatus = async (userId) => {
    const user = await User.findById(userId).select("_id password").lean();
    if (!user) throw new Error("User not found");
    return { hasPassword: hasLocalPassword(user) };
};

exports.setPassword = async (userId, { newPassword, confirmPassword }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Only accounts without a real local password may create their first one.
    if (hasLocalPassword(user)) {
        throw new Error("Password is already set. Use change password instead.");
    }
    if (!newPassword || newPassword.length < 6) {
        throw new Error("Your password must be at least 6 characters");
    }
    if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: "Password set successfully" };
};

exports.deleteAccount = async (userId, { password }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    
    if (user.password) {
        if (!password) throw new Error("Password required to delete account");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Incorrect password");
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
