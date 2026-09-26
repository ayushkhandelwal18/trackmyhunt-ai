const mongoose = require('mongoose');
const validator = require('validator');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        minLength: [3, 'Your name must be at least 4 characters'],
    },

    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter a valid email address']
    },

    password: {
        type: String,
        minLength: [6, 'Your password must be at least 6 characters'],
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatar: {
        type: String,
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    otp: String,
    otpExpires: Date,

    reminderSettings: {
        emailReminders: {
            type: Boolean,
            default: false,
        },
        followupReminders: {
            type: Boolean,
            default: true,
        },
        followupAfterDays: {
            type: Number,
            default: 7,
        },
        minPendingApplications: {
            type: Number,
            default: 3,
        },
        interviewReminders: {
            type: Boolean,
            default: true,
        },
        interviewReminderHours: {
            type: Number,
            default: 24,
        },
    },
},
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);