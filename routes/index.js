const express = require("express");
const router = express.Router();

router.use("/users", require("./users"));
router.use("/couples", require("./couples"));
router.use("/challenges", require("./challenges"));
router.use("/media", require("./media"));
router.use("/gemini", require("./gemini"));
router.use("/badges", require("./badges"));
router.use("/challengeLogs", require("./challengeLogs"));

module.exports = router;
