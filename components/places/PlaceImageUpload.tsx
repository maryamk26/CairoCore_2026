"use client";

import { useCallback, useState } from "react";

type PlaceImageUploadProps = {
  images: string[];
  onImagesChange: (urls: string[]) => void;
};

export default function PlaceImageUpload({ images, onImagesChange }: PlaceImageUploadProps) {
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        onImagesChange([...images, data]);
      };
      reader.readAsDataURL(file);
    });
  }, [images, onImagesChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFile(e.dataTransfer.files);
    },
    [handleFile]
  );

  const addImageFromUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    onImagesChange([...images, url]);
    setImageUrlInput("");
    setShowUrlInput(false);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed bg-gray-100 min-h-[320px] flex flex-col items-center justify-center p-6 transition-colors ${
        dragActive ? "border-[#8b6f47] bg-gray-50" : "border-gray-300"
      }`}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        id="place-images"
        onChange={(e) => handleFile(e.target.files)}
      />
      <label
        htmlFor="place-images"
        className="cursor-pointer flex flex-col items-center gap-2 text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </span>
        <span className="text-sm font-medium text-gray-700">Choose a file or drag and drop</span>
      </label>
      <p className="text-xs text-gray-500 mt-2 max-w-[240px]">High quality .jpg, under 20 MB.</p>
      {!showUrlInput ? (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="mt-4 px-4 py-2 rounded-full bg-gray-800 text-white text-sm font-medium hover:bg-gray-700"
        >
          Add from URL
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2 w-full max-w-xs">
          <input
            type="url"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Paste image URL"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
          <button type="button" onClick={addImageFromUrl} className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm">
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowUrlInput(false); setImageUrlInput(""); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
      {images.length > 0 && (
        <div className="mt-4 w-full flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
