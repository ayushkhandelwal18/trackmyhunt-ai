const userService = require("../services/user.service");

exports.updateProfile = async (req, res) => {
    try {
        const result = await userService.updateProfile(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const result = await userService.changePassword(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getPasswordStatus = async (req, res) => {
    try {
        const result = await userService.getPasswordStatus(req.user.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.setPassword = async (req, res) => {
    try {
        const result = await userService.setPassword(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const result = await userService.deleteAccount(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getReminderSettings = async (req, res) => {
    try {
        const settings = await userService.getReminderSettings(req.user.id);
        res.json({ settings });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateReminderSettings = async (req, res) => {
    try {
        const settings = await userService.updateReminderSettings(req.user.id, req.body);
        res.json({ settings });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
