const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = express.Router();
const { getSupabase } = require("../config/db");
const authenticateToken = require("../middleware/auth");

router.post("/suggest", authenticateToken, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    // Get the user's couple information
    const { data: userData, error: userError } = await getSupabase()
      .from("users")
      .select("couple_id")
      .eq("id", req.user.id)
      .single();

    if (userError || !userData.couple_id) {
      return res.status(400).json({ error: "User is not linked to a couple" });
    }

    // Get couple details
    const { data: coupleData, error: coupleError } = await getSupabase()
      .from("couples")
      .select("name1, name2")
      .eq("id", userData.couple_id)
      .single();

    if (coupleError || !coupleData) {
      return res.status(400).json({ error: "Could not fetch couple details" });
    }

    const { interestTags } = req.body;
    if (
      !interestTags ||
      !Array.isArray(interestTags) ||
      interestTags.length === 0
    ) {
      return res.status(400).json({
        error: "Invalid or empty interestTags. Must be a non-empty array.",
      });
    }

    console.log("Using API Key:", apiKey.substring(0, 5) + "...");
    console.log("Interest Tags:", interestTags);
    console.log("Partners:", coupleData.name1, coupleData.name2);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `U là trời, quân sư tình iu on the mic đây!

Nghe nói cặp đôi gà bông ${coupleData.name1} và ${
      coupleData.name2
    } đang cần một buổi hẹn hò "hết nước chấm" tại Hà Nội đúng hem? Với gu chung là mê ${interestTags.join(
      ", "
    )}, thì phải lên ngay một kèo vừa cháy vừa healing chứ lị.

Giờ thì hãy hiến kế một "chiến dịch" hẹn hò thật chi tiết và trình bày thật đẹp mắt theo cấu trúc sau nhé:

✨ **Tên chiến dịch:** Đặt một cái tên thật kêu, thật trendy cho buổi hẹn hò này.
📝 **Lộ trình chi tiết:** Chia kế hoạch ra thành các phần nhỏ (ví dụ: Sáng - Chiều - Tối, hoặc Giai đoạn 1 - 2 - 3) để cặp đôi dễ theo dõi. Trong mỗi phần, hãy mô tả hoạt động, địa điểm cụ thể ở Hà Nội và tại sao nó lại thú vị.
🎨 **Format xịn sò:** Dùng tiêu đề, **in đậm** cho những điểm nhấn, và các gạch đầu dòng bằng emoji 💖, 📍, ⏰... cho nó cute phô mai que.
💡 **Tip nhỏ Gắn Kết:** Cuối cùng, thêm một lời khuyên hoặc một "nhiệm vụ bí mật" nho nhỏ giúp cặp đôi 'tình bể bình' hơn sau buổi hẹn hò này.

Hãy giữ giọng văn siu cưng, rắc thêm chút thính và thật tự nhiên nhá! Bắt đầu thui!`;

    console.log("Sending prompt to Gemini:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestion = response.text();

    console.log("Received suggestion:", suggestion);

    if (!suggestion || suggestion.trim().length === 0) {
      throw new Error("Empty response from Gemini");
    }

    // Create a challenge from the suggestion
    const { data: challengeData, error: challengeError } = await getSupabase()
      .from("challenges")
      .insert([
        {
          couple_id: userData.couple_id,
          content: suggestion,
          source: "system",
          status: "pending",
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Set due date to 1 week from now
        },
      ])
      .select()
      .single();

    if (challengeError) {
      console.error("Error creating challenge:", challengeError);
      return res.status(500).json({
        error: "Failed to create challenge",
        details: challengeError.message,
      });
    }

    res.json({
      suggestion,
      challenge: challengeData,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Failed to generate suggestion",
      details: error.message,
      name: error.name,
    });
  }
});

module.exports = router;
