const axios = require("axios");

const suggestDecisionData = async (req, res, next) => {
  try {
    const { decisionTitle, description, options } = req.body;

    if (!decisionTitle || !options || !options.length) {
      return res.status(400).json({
        message: "decisionTitle and at least one option are required",
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "GROQ_API_KEY missing" });
    }

    const prompt = `
User wants help making a decision:
Decision Name: "${decisionTitle}"
Description: "${description || "none"}"
Options: ${options.join(", ")}

Generate:
1. 4–6 meaningful evaluation criteria with weight (1-5).
2. Pros & Cons with impact score (1-5) for each option per criteria.

Return STRICTLY in this JSON format (no explanation, no markdown):

{
  "criteria": [
    { "name": "string", "weight": number }
  ],
  "evaluations": [
    {
      "optionName": "string",
      "criteriaName": "string",
      "pros": [{ "text": "string", "impactScore": number }],
      "cons": [{ "text": "string", "impactScore": number }]
    }
  ]
}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    let content = response.data?.choices?.[0]?.message?.content || "";
    content = content.trim();

    // 🔧 STEP 1: Try to extract from ```json ... ``` if present
    let jsonString = content;
    const fenceMatch =
      content.match(/```json([\s\S]*?)```/i) ||
      content.match(/```([\s\S]*?)```/i);

    if (fenceMatch && fenceMatch[1]) {
      jsonString = fenceMatch[1].trim();
    } else {
      // 🔧 STEP 2: Fallback → take first '{' to last '}'
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = content.slice(firstBrace, lastBrace + 1).trim();
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      console.error("JSON parse failed. Raw content:", content);
      return res.status(500).json({
        message: "AI response format invalid (JSON parse error)",
        raw: content,
        extracted: jsonString,
      });
    }

    return res.json({
      success: true,
      generated: parsed,
    });
  } catch (error) {
    console.error("AI suggest error:", error?.response?.data || error.message);
    next(error);
  }
};

module.exports = { suggestDecisionData };
