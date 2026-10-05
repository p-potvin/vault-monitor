import React from "react";
import type { IdentitySummaryStats } from "../types";

interface IdentitiesKpiDeckProps {
  summary: IdentitySummaryStats;
  galleryLabel?: string;
}

export function IdentitiesKpiDeck({ summary, galleryLabel }: IdentitiesKpiDeckProps) {
  const formatNum = (val: number | undefined) =>
    new Intl.NumberFormat().format(val ?? 0);

  return (
    <div className="kpi-grid">
      <div className="kpi-card warm-card glow-cyan">
        <div className="kpi-label">
          {galleryLabel ? `${galleryLabel} Identities` : "Total Model Identities"}
        </div>
        <div className="kpi-value">{formatNum(summary.total_models)}</div>
        <div className="kpi-sub">
          <span className="badge-locked">{formatNum(summary.locked_models)} Locked</span>
          <span className="badge-soft">{formatNum(summary.soft_models)} Soft</span>
          {summary.invalid_models > 0 && (
            <span className="badge-crop">{formatNum(summary.invalid_models)} Invalid</span>
          )}
        </div>
      </div>

      <div className="kpi-card warm-card glow-purple">
        <div className="kpi-label">Stored ArcFace Vectors</div>
        <div className="kpi-value">{formatNum(summary.total_face_crops)}</div>
        <div className="kpi-sub">512-dim L2 Normalized Float32</div>
      </div>

      <div className="kpi-card warm-card glow-emerald">
        <div className="kpi-label">Exemplar Anchors</div>
        <div className="kpi-value">{formatNum(summary.exemplars_count)}</div>
        <div className="kpi-sub">Smart Medoid Consensus Ranked</div>
      </div>

      <div className="kpi-card warm-card glow-amber">
        <div className="kpi-label">Avg Quality & Norm</div>
        <div className="kpi-value">
          {summary.avg_quality_score > 0 ? summary.avg_quality_score.toFixed(3) : "—"}
        </div>
        <div className="kpi-sub">
          Feature Norm: {summary.avg_feature_norm > 0 ? summary.avg_feature_norm.toFixed(2) : "—"}
        </div>
      </div>

      <div className="kpi-card warm-card glow-rose">
        <div className="kpi-label">Processed Images</div>
        <div className="kpi-value">{formatNum(summary.total_images_processed)}</div>
        <div className="kpi-sub">
          {formatNum(summary.total_outliers_isolated)} Outliers Quarantined ({summary.total_tasks_run} Tasks)
        </div>
      </div>
    </div>
  );
}
