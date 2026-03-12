"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { submitPortalComment } from "./actions";

interface CommentFormProps {
  taskId: string;
  clientId: string;
}

export function CommentForm({ taskId, clientId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setError(null);
    startTransition(async () => {
      const result = await submitPortalComment(taskId, trimmed, clientId);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment or question for the team…"
        rows={3}
        className={[
          "w-full resize-none rounded-xl border px-4 py-3",
          "text-[14px] leading-relaxed text-slate-700 placeholder:text-slate-300",
          "bg-white focus:outline-none focus:ring-2 focus:ring-[#00b8a0] focus:ring-offset-1",
          "transition-[border-color,box-shadow]",
          error ? "border-rose-300" : "border-[#d4ede9] hover:border-[#7ab5af]",
        ].join(" ")}
        disabled={isPending}
      />

      {error && (
        <p className="text-[12px] font-medium text-rose-500">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className={[
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
            "text-[13px] font-semibold text-white",
            "transition-[background-color,opacity,transform]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0] focus-visible:ring-offset-2",
            "active:scale-[0.98]",
            isPending || !content.trim()
              ? "cursor-not-allowed bg-[#b8e0da] opacity-60"
              : "bg-[#00b8a0] hover:bg-[#00a08a] active:bg-[#008070]",
          ].join(" ")}
          style={
            !isPending && content.trim()
              ? { boxShadow: "0 2px 12px rgba(0,184,160,0.35)" }
              : undefined
          }
        >
          <Send className="h-3.5 w-3.5" />
          {isPending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}

export default CommentForm;
