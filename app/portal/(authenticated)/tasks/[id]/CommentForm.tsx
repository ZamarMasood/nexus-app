"use client";

import { useState, useTransition } from "react";
import { Send, User } from "lucide-react";
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
    <div className="mt-2 flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 ring-2 ring-surface self-start mt-0.5">
        <User className="h-4 w-4 text-violet-400" />
      </div>
      <div className="flex-1">
        {error && (
          <p className="mb-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">
            {error}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-surface bg-surface-card overflow-hidden focus-within:border-violet-500/40 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-[border-color,box-shadow]"
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
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-secondary-app placeholder:text-dim-app focus:outline-none"
          />
          <div className="flex items-center justify-end border-t border-surface px-3 py-2">
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(139,92,246,0.3)] hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 transition-[background-color,opacity,transform,box-shadow]"
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
