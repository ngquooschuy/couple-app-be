const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Create a new couple
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name1, name2, anniversaryDate, sharedInterests } = req.body;

    // Validate required fields
    if (!name1 || !name2) {
      return res.status(400).json({ error: "Both partner names are required" });
    }
    if (!anniversaryDate) {
      return res.status(400).json({ error: "Anniversary date is required" });
    }
    if (!sharedInterests || !Array.isArray(sharedInterests)) {
      return res.status(400).json({ error: "Shared interests must be an array" });
    }

    // Create couple
    const { data: coupleData, error: coupleError } = await getSupabase()
      .from('couples')
      .insert([{
        name1,
        name2,
        anniversary_date: anniversaryDate,
        shared_interests: sharedInterests,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (coupleError) {
      console.error("Error creating couple:", coupleError);
      return res.status(400).json({ error: coupleError });
    }

    // Update user with couple_id
    const { error: userError } = await getSupabase()
      .from('users')
      .update({ couple_id: coupleData.id })
      .eq('id', req.user.id);

    if (userError) {
      console.error("Error updating user:", userError);
      return res.status(400).json({ error: userError });
    }

    res.json({
      message: "Couple created successfully",
      data: coupleData
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ 
      error: "Failed to create couple",
      details: err.message 
    });
  }
});

// Get couple details
router.get('/:coupleId', authenticateToken, async (req, res) => {
  try {
    const { coupleId } = req.params;

    const { data, error } = await getSupabase()
      .from('couples')
      .select(`
        id,
        name1,
        name2,
        anniversary_date,
        shared_interests,
        created_by,
        created_at
      `)
      .eq('id', coupleId)
      .single();

    if (error) {
      console.error("Error fetching couple:", error);
      return res.status(400).json({ error });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ 
      error: "Failed to fetch couple",
      details: err.message 
    });
  }
});

module.exports = router;