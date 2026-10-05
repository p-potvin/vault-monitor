import React, { useEffect, useRef, useState, useMemo } from "react";
import type { Embedding3DPoint } from "../types";

const CLUSTER_COLORS = [
  "#38bdf8", // Sky blue
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#8b5cf6"  // Violet
];

function getModelColor(name: string, index: number): string {
  return CLUSTER_COLORS[index % CLUSTER_COLORS.length];
}

interface EmbeddingVisualizer3DProps {
  points: Embedding3DPoint[];
  selectedModel: string | null;
  onSelectModel: (model: string | null) => void;
  fullMode?: boolean;
}

export function EmbeddingVisualizer3D({
  points,
  selectedModel,
  onSelectModel,
  fullMode = true
}: EmbeddingVisualizer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState(0.4);
  const [rotY, setRotY] = useState(0.6);
  const [zoom, setZoom] = useState(240);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<Embedding3DPoint | null>(null);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map each unique model to a distinct color
  const modelColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueModels = Array.from(new Set(points.map((p) => p.model_name)));
    uniqueModels.forEach((m, idx) => {
      map.set(m, getModelColor(m, idx));
    });
    return map;
  }, [points]);

  // 3D Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Auto-rotation
      if (autoRotate && !isDraggingRef.current) {
        setRotY((prev) => (prev + 0.0035) % (Math.PI * 2));
      }

      const cx = width / 2;
      const cy = height / 2;

      // Project points
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Draw Coordinate Axes
      const axes = [
        { x: 1.2, y: 0, z: 0, label: "PC1 (Identity)", col: "rgba(56, 189, 248, 0.4)" },
        { x: 0, y: 1.2, z: 0, label: "PC2 (Pose/Lighting)", col: "rgba(244, 63, 94, 0.4)" },
        { x: 0, y: 0, z: 1.2, label: "PC3 (Texture)", col: "rgba(16, 185, 129, 0.4)" }
      ];

      axes.forEach((axis) => {
        const x1 = axis.x * cosY + axis.z * sinY;
        const z1 = -axis.x * sinY + axis.z * cosY;
        const y2 = axis.y * cosX - z1 * sinX;

        const screenX = cx + x1 * zoom;
        const screenY = cy - y2 * zoom;

        ctx.beginPath();
        ctx.strokeStyle = axis.col;
        ctx.moveTo(cx, cy);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();

        ctx.fillStyle = axis.col;
        ctx.font = "10px sans-serif";
        ctx.fillText(axis.label, screenX + 4, screenY + 4);
      });

      // Filter and Sort Points by Z depth
      const activePoints = selectedModel
        ? points.filter((p) => p.model_name === selectedModel)
        : points;

      const projected = activePoints.map((pt) => {
        const x1 = pt.x * cosY + pt.z * sinY;
        const z1 = -pt.x * sinY + pt.z * cosY;
        const y2 = pt.y * cosX - z1 * sinX;
        const z2 = pt.y * sinX + z1 * cosX;

        const screenX = cx + x1 * zoom;
        const screenY = cy - y2 * zoom;
        return { pt, screenX, screenY, zDepth: z2 };
      });

      projected.sort((a, b) => a.zDepth - b.zDepth);

      // Render points
      projected.forEach(({ pt, screenX, screenY }) => {
        const color = modelColorMap.get(pt.model_name) || "#38bdf8";
        const isHovered = hoveredPoint?.id === pt.id;
        const radius = pt.is_exemplar ? (isHovered ? 8 : 5.5) : isHovered ? 6 : 3.5;

        // Exemplar Glow Ring
        if (pt.is_exemplar) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Main Point Circle
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#ffffff" : color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isHovered ? 14 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHovered) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(`${pt.model_name} (${pt.gallery_name || pt.gallery_id})`, screenX + 10, screenY - 6);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [points, rotX, rotY, zoom, autoRotate, hoveredPoint, selectedModel, modelColorMap]);

  // Mouse Orbit Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setRotY((prev) => prev + dx * 0.008);
      setRotX((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + dy * 0.008)));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      let closest: Embedding3DPoint | null = null;
      let minDistance = 14;

      const activePoints = selectedModel
        ? points.filter((p) => p.model_name === selectedModel)
        : points;

      activePoints.forEach((pt) => {
        const x1 = pt.x * cosY + pt.z * sinY;
        const z1 = -pt.x * sinY + pt.z * cosY;
        const y2 = pt.y * cosX - z1 * sinX;
        const screenX = cx + x1 * zoom;
        const screenY = cy - y2 * zoom;

        const dist = Math.hypot(mouseX - screenX, mouseY - screenY);
        if (dist < minDistance) {
          minDistance = dist;
          closest = pt;
        }
      });

      setHoveredPoint(closest);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(70, Math.min(650, prev - e.deltaY * 0.2)));
  };

  const uniqueModelNames = Array.from(new Set(points.map((p) => p.model_name))).sort();

  return (
    <div className={`canvas-tab-container ${fullMode ? "warm-card" : ""}`}>
      {fullMode && (
        <div className="canvas-toolbar">
          <div className="toolbar-left">
            <h2>Interactive ArcFace PCA Feature Space</h2>
            <span className="point-count-pill">{points.length} Real Exemplars in 3D</span>
          </div>

          <div className="toolbar-controls">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
              />
              Auto Orbit
            </label>

            <select
              value={selectedModel ?? ""}
              onChange={(e) => onSelectModel(e.target.value || null)}
              className="select-input"
            >
              <option value="">All Models Cluster</option>
              {uniqueModelNames.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <button
              className="btn-sm"
              onClick={() => {
                setRotX(0.4);
                setRotY(0.6);
                setZoom(240);
              }}
            >
              Reset View
            </button>
          </div>
        </div>
      )}

      <div className="canvas-stage-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={fullMode ? "full-3d-canvas" : "preview-canvas"}
        />

        {hoveredPoint && (
          <div className="point-tooltip">
            <strong>{hoveredPoint.model_name}</strong>
            <div>Source: {hoveredPoint.gallery_name || hoveredPoint.gallery_id}</div>
            <div>File: {hoveredPoint.rel_path}</div>
            <div>Confidence: {(hoveredPoint.quality_score * 100).toFixed(1)}%</div>
            <div>Feature Norm: {hoveredPoint.feature_norm.toFixed(2)}</div>
            <div>{hoveredPoint.is_exemplar ? "⭐ Core Smart Exemplar" : "Standard Crop"}</div>
            <div className="coord-text">
              PCA: ({hoveredPoint.x.toFixed(3)}, {hoveredPoint.y.toFixed(3)}, {hoveredPoint.z.toFixed(3)})
            </div>
          </div>
        )}

        {fullMode && (
          <div className="canvas-legend">
            <div className="legend-title">Cluster Color Legend</div>
            <div className="legend-items">
              {Array.from(modelColorMap.entries()).slice(0, 24).map(([modelName, col]) => (
                <div
                  key={modelName}
                  className={`legend-item ${selectedModel === modelName ? "active" : ""}`}
                  onClick={() => onSelectModel(selectedModel === modelName ? null : modelName)}
                >
                  <span className="legend-dot" style={{ backgroundColor: col }} />
                  <span className="legend-name">{modelName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
