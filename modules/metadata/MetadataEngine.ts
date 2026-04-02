import { ClipCandidate, MetadataBundle } from "@/types";

export function generateMetadataBundle(clip: ClipCandidate): MetadataBundle {
  const base = clip.title;

  return {
    clipId: clip.id,
    titles: {
      tiktok: [`${base} - wajib lihat`, "kenapa bagian ini bikin retention naik", "creator wajib lihat ini"],
      instagram: [`${base} #creatorgrowth`, `${base} dan efeknya ke reels`, "ini hook yang bikin orang nonton"],
      youtube: [base, `${base} | Bedah Clip Viral`, `${base} yang bikin orang berhenti scroll`],
      square: [base, `${base} - remix sosial`, `${base} - potongan creator`]
    },
    descriptions: {
      tiktok: "Tiga detik pertama itu segalanya. Save ide ini buat video kamu berikutnya.",
      instagram: "Kalau intro lemah, value kamu tidak sempat dilihat. Save dan share ke tim content kamu.",
      youtube: "Short ini menyorot kalimat yang membawa hook, value, dan kurva retention paling kuat.",
      square: "Diolah ulang dengan ClipForge AI."
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
      "Pasangkan clip ini dengan breakdown lanjutan dan clip studi kasus di akhir minggu untuk momentum seri yang lebih kuat.",
    hookRewriteSuggestion:
      "Buka dengan: 'Kalau intro video kamu lemah, algoritma hampir tidak kasih kesempatan kedua.'"
  };
}
