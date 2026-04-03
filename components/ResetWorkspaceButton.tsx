"use client";

import { useState } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useClipForgeStore } from "@/store/useClipForgeStore";

export function ResetWorkspaceButton({
  className,
  fullWidth = false,
  title = "Reset penuh workspace",
  description = "Hapus project lokal dan bersihkan file upload lama di server prototipe."
}: {
  className?: string;
  fullWidth?: boolean;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const resetWorkspace = useClipForgeStore((state) => state.resetWorkspace);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");

  async function handleReset() {
    if (
      !window.confirm(
        "Reset penuh akan menghapus project lokal di browser ini dan membersihkan file upload lama di server prototipe. Lanjutkan?"
      )
    ) {
      return;
    }

    setWorking(true);
    setMessage("Membersihkan data lokal dan file upload lama...");
    setMessageTone("neutral");

    try {
      const response = await fetch("/api/reset-workspace", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Reset server gagal dijalankan.");
      }

      resetWorkspace();
      try {
        window.localStorage.removeItem("clipforge-ai-store");
      } catch {
        // Ignore storage cleanup failures and continue.
      }

      setMessage(payload.message || "Workspace berhasil dibersihkan.");
      setMessageTone("success");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      resetWorkspace();
      setMessage(error instanceof Error ? error.message : "Reset workspace gagal.");
      setMessageTone("error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleReset}
        disabled={working}
        className={[
          "block rounded-[24px] border border-rose-300/18 bg-rose-300/8 p-4 text-left transition hover:bg-rose-300/12 disabled:cursor-not-allowed disabled:opacity-70",
          fullWidth ? "w-full" : "",
          className ?? ""
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white">
            {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white">{title}</p>
            <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
          </div>
        </div>
      </button>

      {message ? (
        <p className={messageTone === "error" ? "text-sm text-rose-200" : messageTone === "success" ? "text-sm text-emerald-200" : "text-sm text-white/60"}>
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={working}
          className={fullWidth ? "w-full border-rose-300/20 bg-rose-300/8 hover:bg-rose-300/12" : "border-rose-300/20 bg-rose-300/8 hover:bg-rose-300/12"}
        >
          {working ? "Membersihkan..." : "Reset Sekarang"}
        </Button>
      </div>
    </div>
  );
}
