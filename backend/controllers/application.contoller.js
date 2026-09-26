const applicationService = require("../services/application.service");

exports.create = async (req, res) => {
  try {
    const app = await applicationService.createApplication(
      req.user._id,
      req.body
    );
    res.status(201).json(app);
  } catch (err) {
    // Duplicate job for this user: return the existing application so the
    // client can show it instead of creating a second record. Nothing is
    // modified or deleted.
    if (err.status === 409 && err.duplicate) {
      return res.status(409).json({
        message: err.message,
        duplicate: err.duplicate,
      });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const apps = await applicationService.getApplications(req.user._id);
    res.json(apps);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const app = await applicationService.updateApplication(
      req.params.id,
      req.user._id,
      req.body
    );
    res.json(app);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await applicationService.deleteApplication(
      req.params.id,
      req.user._id
    );
    res.json({ message: "Application deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.events = async (req, res) => {
  try {
    const events = await applicationService.getApplicationEvents(
      req.params.id,
      req.user._id
    );
    res.json(events);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
