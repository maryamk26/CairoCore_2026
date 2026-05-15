"use client";

interface PlaceDeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

export default function PlaceDeleteConfirmModal({
  onConfirm,
  onCancel,
  deleting,
}: PlaceDeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#3a3428] rounded-2xl p-6 max-w-sm w-full border border-[#5d4e37]">
        <h3 className="font-cinzel text-xl font-bold text-white mb-2">Delete this place?</h3>
        <p className="text-white/80 text-sm mb-6">
          This cannot be undone. The place will be removed permanently.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full bg-white/20 text-white font-cinzel font-medium hover:bg-white/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full bg-red-600 text-white font-cinzel font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
