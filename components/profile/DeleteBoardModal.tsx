"use client";

interface DeleteBoardModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

export default function DeleteBoardModal({ onConfirm, onCancel, deleting }: DeleteBoardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200">
        <h3 className="font-cinzel text-xl font-bold text-[#5d4e37] mb-2">Delete this board?</h3>
        <p className="text-gray-600 text-sm mb-6">
          All pins will be removed from this board. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
