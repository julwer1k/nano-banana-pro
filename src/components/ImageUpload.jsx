import { useState, useRef, useCallback } from 'react';
import useGenerationStore from '../stores/useGenerationStore';
import { readFileAsBase64, generateId } from '../utils/imageUtils';
import { MAX_REFERENCE_IMAGES } from '../utils/constants';

/**
 * ImageUpload — Drag & drop zone with thumbnail grid for reference images.
 * Supports up to 14 reference images, reordering via drag, and click-to-remove.
 */
export default function ImageUpload() {
  const { referenceImages, addReferenceImage, removeReferenceImage, reorderReferenceImages } =
    useGenerationStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(
    async (files) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const remaining = MAX_REFERENCE_IMAGES - referenceImages.length;
      const toProcess = imageFiles.slice(0, remaining);

      for (const file of toProcess) {
        try {
          const result = await readFileAsBase64(file);
          addReferenceImage({
            id: generateId(),
            ...result,
          });
        } catch (err) {
          console.error('Failed to process image:', err);
        }
      }
    },
    [referenceImages.length, addReferenceImage]
  );

  // -- Drag & Drop zone handlers --
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  // -- Reorder drag handlers --
  const handleThumbDragStart = (index) => {
    setDragIndex(index);
  };

  const handleThumbDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...referenceImages];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    reorderReferenceImages(reordered);
    setDragIndex(index);
  };

  const handleThumbDragEnd = () => {
    setDragIndex(null);
  };

  const isFull = referenceImages.length >= MAX_REFERENCE_IMAGES;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Reference Images
        </label>
        <span className="text-xs text-text-muted tabular-nums">
          {referenceImages.length}/{MAX_REFERENCE_IMAGES}
        </span>
      </div>

      {/* Thumbnails */}
      {referenceImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {referenceImages.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleThumbDragStart(index)}
              onDragOver={(e) => handleThumbDragOver(e, index)}
              onDragEnd={handleThumbDragEnd}
              className={`relative group w-14 h-14 rounded-[var(--radius-sm)] overflow-hidden
                          border-2 cursor-grab active:cursor-grabbing
                          transition-all duration-200
                          ${dragIndex === index
                            ? 'border-brand scale-95 opacity-60'
                            : 'border-border hover:border-brand/40'}`}
            >
              <img
                src={img.preview}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeReferenceImage(img.id)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100
                           flex items-center justify-center transition-opacity duration-150 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      {!isFull && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 px-4 py-3
                      border-2 border-dashed rounded-[var(--radius-md)]
                      cursor-pointer transition-all duration-200
                      ${isDraggingOver
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border hover:border-brand/30 text-text-muted hover:text-text-secondary'}`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <span className="text-xs">
            {isDraggingOver ? 'Drop images here' : 'Add reference images'}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
