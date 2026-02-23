import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY
});

const MAX_RETRIES = 2;
const TIMEOUT_MS = 8000;
const MODEL = "openai/gpt-oss-120b:free";

/**
 * AI Judge Service
 * Always returns:
 * {
 *   confidence: number (0-1),
 *   reason: string
 * }
 *
 * Backend remains authority.
 */
export const aiJudgeService = async ({ topic, title, description }) => {

    if (!topic || !title) {
        return {
            confidence: 0,
            reason: "Invalid input"
        };
    }

    const prompt = `
                     You are a strict academic topic relevance judge.

                     Topic:
                     "${topic}"

                     Video Title:
                     "${title}"

                     Video Description:
                     "${(description || "").slice(0, 800)}"

                     Return ONLY valid JSON in this exact format:
                     {
                       "confidence": number between 0 and 1,
                       "reason": "short explanation"
                     }

                     No markdown.
                     No extra text.
                     No explanation outside JSON.
                  `;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let controller;
        let timeout;

        try {
            controller = new AbortController();
            timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await openrouter.chat.send(
                {
                    model: MODEL,
                    temperature: 0, // deterministic judging
                    messages: [
                        { role: "user", content: prompt }
                    ]
                },
                { signal: controller.signal }
            );

            const raw = response?.choices?.[0]?.message?.content?.trim();

            if (!raw) throw new Error("Empty AI response");

            // Extract JSON safely even if model adds noise
            const jsonMatch = raw.match(/\{[\s\S]*?\}/);
            if (!jsonMatch) throw new Error("No JSON found");

            const parsed = JSON.parse(jsonMatch[0]);

            // Strict validation
            if (typeof parsed.confidence !== "number") {
                throw new Error("Invalid confidence type");
            }

            const confidence = clampConfidence(parsed.confidence);

            return {
                confidence,
                reason: typeof parsed.reason === "string"
                    ? parsed.reason.slice(0, 300)
                    : ""
            };

        } catch (err) {

            if (attempt === MAX_RETRIES) {
                return {
                    confidence: 0,
                    reason: "AI_ERROR"
                };
            }

        } finally {
            if (timeout) clearTimeout(timeout);
        }
    }

    // Fallback (should never hit)
    return {
        confidence: 0,
        reason: "AI_ERROR"
    };
};

/**
 * Clamp score safely between 0–1
 */
function clampConfidence(value) {
    if (typeof value !== "number" || isNaN(value)) return 0;
    return Math.max(0, Math.min(1, value));
}