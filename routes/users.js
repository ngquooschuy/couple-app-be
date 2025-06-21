const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSupabase } = require("../config/db");
const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  const password_hash = await bcrypt.hash(password, 10);
  const { data, error } = await getSupabase()
    .from("users")
    .insert([{ email, name, password_hash }]);
  if (error) return res.status(400).json({ error });
  res.json({ message: "User registered" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await getSupabase()
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  if (error || !data)
    return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, data.password_hash);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: data.id, email: data.email },
    process.env.JWT_SECRET
  );
  res.json({ token });
});

module.exports = router;
