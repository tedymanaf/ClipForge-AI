import { getOpenAiClient } from "@/lib/openai";
import { TranscriptSegment } from "@/types";

export async function transcribeWithWhisperMock(sourceName: string): Promise<TranscriptSegment[]> {
  const base = [
    "Most creators don't have a content problem, they have a packaging problem.",
    "The first three seconds decide whether the audience stays or swipes.",
    "So instead of editing everything, isolate the sentence that changes the viewer's mind.",
    "That single moment becomes your short-form hook."
  ];

  return base.map((text, index) => ({
    id: `seg_${index + 1}`,
    startMs: index * 7000,
    endMs: index * 7000 + 6200,
    text: `${text} (${sourceName})`,
    confidence: 0.97,
    words: text.split(" ").map((word, wordIndex) => ({
      startMs: index * 7000 + wordIndex * 380,
      endMs: index * 7000 + wordIndex * 380 + 300,
      word,
      confidence: 0.95 + ((wordIndex % 3) * 0.01)
    }))
  }));
}

export async function transcribeWithWhisper(filePath: string) {
  const client = getOpenAiClient();

  if (!client) {
    return transcribeWithWhisperMock(filePath);
  }

  return transcribeWithWhisperMock(filePath);
}
