const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/application.contoller");

router.post("/", auth, controller.create);
router.get("/", auth, controller.getAll);
router.get("/:id/events", auth, controller.events);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.remove);

module.exports = router;
