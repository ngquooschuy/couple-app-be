const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { getSupabase } = require("../config/db");

router.post("/", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const { data, error } = await getSupabase()
    .from("badges")
    .insert([{ name, user_id: req.user.id }]);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

module.exports = router;
