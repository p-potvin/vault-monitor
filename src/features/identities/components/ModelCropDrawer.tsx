import React from "react";
import type { IdentityCrop, IdentityModel } from "../types";

interface ModelCropDrawerProps {
  model: (IdentityModel & { crops?: IdentityCrop[] }) | null;
  onClose: () => void;
}

export function ModelCropDrawer({ model, onClose }: ModelCropDrawerProps) {
  if (!model) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-drawer warm-card" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="flex items-center gap-2">
              <h2>{model.name}</h2>
              <span className={`status-badge ${model.status}`}>
                {model.status.toUpperCase()}
              </span>
            </div>
            {model.gallery_name && (
              <span className="text-[11px] text-[var(--muted)] font-mono">
                Source: {model.gallery_name} ({model.gallery_id})
              </span>
            )}
          </div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-metrics">
            <div>
              <strong>Threshold:</strong> {model.threshold.toFixed(2)}
            </div>
            <div>
              <strong>Total Crops:</strong> {model.crop_count || model.crops?.length || 0}
            </div>
            <div>
              <strong>Exemplars:</strong> {model.exemplar_count}
            </div>
            <div>
              <strong>Created:</strong> {model.created_at ? model.created_at.slice(0, 10) : "2026-09"}
            </div>
          </div>

          <h3>Stored Face Crops & ArcFace Vectors</h3>
          <div className="crops-list">
            {model.crops && model.crops.length > 0 ? (
              model.crops.map((crop) => (
                <div key={crop.id} className="crop-row">
                  <div className="crop-main">
                    <span className="crop-icon">{crop.is_exemplar ? "⭐" : "📷"}</span>
                    <div className="crop-name">
                      <strong className="truncate font-mono text-[12px]">{crop.rel_path}</strong>
                      <div className="crop-meta">
                        Norm: {crop.feature_norm.toFixed(2)} | Confidence: {(crop.quality_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {crop.is_exemplar ? (
                    <span className="badge-exemplar">Smart Exemplar</span>
                  ) : (
                    <span className="badge-crop">Normal Crop</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--muted)] italic p-4 text-center">
                {model.exemplars_preview && model.exemplars_preview.length > 0
                  ? "Displaying exemplar previews in model card."
                  : "No crops stored for this identity."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
