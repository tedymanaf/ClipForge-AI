import OpenAI from "openai";

export function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined
  });
}
