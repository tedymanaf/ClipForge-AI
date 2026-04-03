import OpenAI from "openai";

export function getOpenAiClient() {
  const requestedProvider = (process.env.AI_PROVIDER || "auto").toLowerCase();
  const useGroq = requestedProvider === "groq" || (requestedProvider === "auto" && !!process.env.GROQ_API_KEY);
  const apiKey = useGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const baseURL = useGroq
    ? process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
    : process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined
  });
}
