const express = require("express");
const router = express.Router();
const { getSupabase } = require("../config/db");

router.post("/", async (req, res) => {
  const { coupleId, content, source, status, dueDate } = req.body;
  const { data, error } = await getSupabase()
    .from("challenges")
    .insert([
      {
        couple_id: coupleId,
        content,
        source,
        status,
        due_date: dueDate,
      },
    ]);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

router.get("/:coupleId", async (req, res) => {
  const { coupleId } = req.params;
  const { data, error } = await getSupabase()
    .from("challenges")
    .select("*")
    .eq("couple_id", coupleId);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

// Update challenge status
router.put("/:challengeId", async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    // Update challenge status
    const { data, error } = await getSupabase()
      .from("challenges")
      .update({ status })
      .eq("id", challengeId)
      .select();

    if (error) {
      console.error("Error updating challenge:", error);
      return res.status(400).json({ error });
    }

    res.json({
      message: "Challenge updated successfully",
      data: data[0]
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ 
      error: "Failed to update challenge",
      details: err.message 
    });
  }
});

module.exports = router;
