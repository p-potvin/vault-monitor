import React from "react";
import type { IdentityCrop, IdentityModel } from "../types";

interface GalleryModelsGridProps {
  models: (IdentityModel & { crops?: IdentityCrop[] })[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (st: string) => void;
  onInspectModel: (model: IdentityModel & { crops?: IdentityCrop[] }) => void;
  onToggleStatus: (model: IdentityModel, newStatus: "locked" | "soft") => void;
}

export function GalleryModelsGrid({
  models,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onInspectModel,
  onToggleStatus
}: GalleryModelsGridProps) {
  return (
    <div className="models-tab-container">
      <div className="filter-bar warm-card">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search gallery models..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {["all", "locked", "soft", "invalid"].map((st) => (
            <button
              key={st}
              className={`filter-pill ${statusFilter === st ? "active" : ""}`}
              onClick={() => onStatusFilterChange(st)}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>

        <span className="text-[12px] text-[var(--muted)] ml-auto font-medium">
          Showing {models.length} models
        </span>
      </div>

      <div className="models-grid">
        {models.map((model) => (
          <div key={model.id} className="model-card warm-card">
            <div className="card-top">
              <div className="card-avatar">{model.name.slice(0, 2).toUpperCase()}</div>
              <div className="card-headings">
                <h3 className="card-title truncate" title={model.name}>
                  {model.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="card-date">
                    {model.created_at ? model.created_at.slice(0, 10) : "2026-09"}
                  </span>
                  {model.gallery_name && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]">
                      {model.gallery_name}
                    </span>
                  )}
                </div>
              </div>
              <span className={`status-badge ${model.status}`}>
                {model.status.toUpperCase()}
              </span>
            </div>

            <div className="card-metrics">
              <div className="metric-box">
                <span className="m-val">{model.crop_count}</span>
                <span className="m-lbl">Stored Crops</span>
              </div>
              <div className="metric-box">
                <span className="m-val">{model.exemplar_count}</span>
                <span className="m-lbl">Exemplars</span>
              </div>
              <div className="metric-box">
                <span className="m-val">{model.threshold.toFixed(2)}</span>
                <span className="m-lbl">Threshold</span>
              </div>
            </div>

            {/* Exemplar Thumbnails */}
            {model.exemplars_preview && model.exemplars_preview.length > 0 && (
              <div className="exemplar-strips">
                <div className="strip-label">Smart Exemplars:</div>
                <div className="strip-items">
                  {model.exemplars_preview.map((ex, idx) => (
                    <div key={idx} className="exemplar-chip" title={`${ex.rel_path} (Norm: ${ex.feature_norm})`}>
                      {ex.rel_path.split("/").pop() || ex.rel_path}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-actions">
              <button className="btn-secondary" onClick={() => onInspectModel(model)}>
                Inspect Crops
              </button>
              {model.status === "soft" ? (
                <button
                  className="btn-primary"
                  onClick={() => onToggleStatus(model, "locked")}
                >
                  Lock Identity
                </button>
              ) : (
                <button
                  className="btn-outline"
                  onClick={() => onToggleStatus(model, "soft")}
                >
                  Set Soft
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
