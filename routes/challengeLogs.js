const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { getSupabase } = require("../config/db");

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { challenge_id, completed_by, completed_at, notes } = req.body;

    // Validate required fields
    if (!challenge_id) {
      return res.status(400).json({ error: "challenge_id is required" });
    }
    if (!completed_by) {
      return res.status(400).json({ error: "completed_by is required" });
    }
    if (!notes) {
      return res.status(400).json({ error: "notes is required" });
    }

    // Insert new challenge log
    const { data, error } = await getSupabase()
      .from("challenge_logs")
      .insert([
        {
          challenge_id,
          completed_by,
          completed_at,
          notes
        }
      ])
      .select();

    if (error) {
      console.error("Error creating challenge log:", error);
      return res.status(400).json({ error });
    }

    res.json({
      message: "Challenge log created successfully",
      data: data[0]
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ 
      error: "Failed to create challenge log",
      details: err.message 
    });
  }
});

// Get challenge logs by challenge ID
router.get("/challenge/:challengeId", authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params;

    const { data, error } = await getSupabase()
      .from("challenge_logs")
      .select(`
        id,
        challenge_id,
        completed_by,
        completed_at,
        notes
      `)
      .eq("challenge_id", challengeId)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching challenge logs:", error);
      return res.status(400).json({ error });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ 
      error: "Failed to fetch challenge logs",
      details: err.message 
    });
  }
});

// Get challenge logs by user ID
router.get("/user", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from("challenge_logs")
      .select(`
        id,
        challenge_id,
        completed_by,
        completed_at,
        notes
      `)
      .eq("completed_by", req.user.id)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching user challenge logs:", error);
      return res.status(400).json({ error });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ 
      error: "Failed to fetch user challenge logs",
      details: err.message 
    });
  }
});

module.exports = router;
