"use client";

import { useState, useTransition } from "react";
import { Send, User } from "lucide-react";
import { submitPortalComment } from "./actions";

interface CommentFormProps {
  taskId: string;
  clientId: string;
  csrfToken: string;
}

export function CommentForm({ taskId, clientId, csrfToken }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setError(null);
    startTransition(async () => {
      const result = await submitPortalComment(taskId, trimmed, clientId, csrfToken);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
      }
    });
  }

  return (
    <div className="mt-2 flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(94,106,210,0.15)] self-start mt-0.5">
        <User className="h-3.5 w-3.5 text-[#5e6ad2]" />
      </div>
      <div className="flex-1">
        {error && (
          <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium
            bg-[rgba(229,72,77,0.12)] border border-[rgba(229,72,77,0.2)] text-[#e5484d]">
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden
            focus-within:border-[rgba(94,106,210,0.4)]
            transition-colors duration-150"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
            }}
            placeholder="Add a comment… (⌘↵ to send)"
            rows={2}
            disabled={isPending}
            className="w-full resize-none bg-transparent px-4 py-3 text-[13px] text-[#8a8a8a]
              placeholder:text-[#555] focus:outline-none"
          />
          <div className="flex items-center justify-end border-t border-[rgba(255,255,255,0.06)] px-3 py-2">
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="flex items-center gap-1.5 rounded-md bg-[#5e6ad2] px-3 py-1.5
                text-[12px] font-medium text-white
                hover:bg-[#6872e5]
                disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)]
                transition-colors duration-150"
            >
              <Send className="h-3 w-3" />
              {isPending ? "Posting…" : "Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommentForm;
