import React from "react";
import type { GallerySourceInfo } from "../types";

interface GallerySourceSelectorProps {
  galleries: GallerySourceInfo[];
  selectedGalleryId: string;
  onSelectGallery: (id: string) => void;
}

export function GallerySourceSelector({
  galleries,
  selectedGalleryId,
  onSelectGallery
}: GallerySourceSelectorProps) {
  const activeGallery = galleries.find((g) => g.id === selectedGalleryId) || galleries[0];

  return (
    <div className="gallery-source-card warm-card">
      <div className="gallery-selector-header">
        <div className="gallery-title-area">
          <span className="gallery-label-badge">Local PC Galleries</span>
          <h3 className="gallery-selected-title">{activeGallery.name}</h3>
          <p className="gallery-selected-desc">{activeGallery.description}</p>
        </div>
        <div className="gallery-source-meta">
          <span className="gallery-path-chip font-mono text-[11px]">
            {activeGallery.drive !== "Combined" ? `${activeGallery.drive} Drive` : "Multi-Drive"}
          </span>
          <span className="gallery-path-detail font-mono text-[10px] text-[var(--muted)]">
            {activeGallery.path}
          </span>
        </div>
      </div>

      <div className="gallery-pill-row">
        {galleries.map((gal) => {
          const isSelected = gal.id === selectedGalleryId;
          const count = gal.summary.total_models.toLocaleString();
          const crops = gal.summary.total_face_crops.toLocaleString();

          return (
            <button
              key={gal.id}
              className={`gallery-source-pill ${isSelected ? "active" : ""}`}
              onClick={() => onSelectGallery(gal.id)}
            >
              <span className="gallery-pill-name">{gal.short_name}</span>
              <span className="gallery-pill-counts">
                {count} IDs · {crops} vectors
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
