import { ClipCandidate, MetadataBundle } from "@/types";

export function generateMetadataBundle(clip: ClipCandidate): MetadataBundle {
  const base = clip.title;
  return {
    clipId: clip.id,
    titles: {
      tiktok: [`${base} 🤯`, `kenapa bagian ini bikin retention naik`, `creator wajib lihat ini`],
      instagram: [`${base} #creatorgrowth`, `${base} dan efeknya ke reels`, `ini hook yang bikin orang nonton`],
      youtube: [base, `${base} | Viral Clip Breakdown`, `${base} That Stops Scroll`],
      square: [base, `${base} - social remix`, `${base} - creator cut`]
    },
    descriptions: {
      tiktok: "Tiga detik pertama itu segalanya. Save ide ini buat video kamu berikutnya.",
      instagram: "Kalau intro lemah, value kamu tidak sempat dilihat. Save dan share ke tim content kamu.",
      youtube: "This short highlights the exact sentence that carries the hook, value, and retention curve.",
      square: "Repurposed with ClipForge AI."
    },
    hashtags: {
      tiktok: ["#viralclip", "#creatorai", "#hook", "#contenttips", "#fyp"],
      instagram: [
        "#reelsstrategy",
        "#contentrepurposing",
        "#socialvideo",
        "#clipforgeai",
        "#contentcreator"
      ],
      youtube: ["#shorts", "#creatorgrowth", "#viralclips"],
      square: ["#content", "#socialvideo"]
    },
    tags: [
      "viral video clipping",
      "creator workflow",
      "whisper captions",
      "shorts strategy",
      "tiktok hooks"
    ],
    category: clip.contentType,
    sentiment: clip.sentiment,
    clipSeriesSuggestion:
      "Pair this clip with a follow-up breakdown and a case-study clip later in the week for stronger series momentum.",
    hookRewriteSuggestion:
      "Open with: 'Kalau intro video kamu lemah, algoritma hampir tidak kasih kesempatan kedua.'"
  };
}
