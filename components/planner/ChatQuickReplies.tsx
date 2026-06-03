"use client";

interface ChatQuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export default function ChatQuickReplies({ replies, onSelect, disabled }: ChatQuickRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div className="flex gap-2.5 mb-4">
      <div className="w-9 shrink-0" aria-hidden />
      <div className="flex flex-wrap gap-2">
        {replies.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(reply)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#3a3428]/80 text-white/90 border border-[#d4af37]/35 hover:bg-[#5d4e37] hover:border-[#d4af37]/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
