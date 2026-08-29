import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  getIdentitiesSummary,
  getIdentitiesList,
  getIdentityDetails,
  get3dEmbeddings,
  getIdentityTasks,
  updateIdentityStatus
} from "../api";
import type {
  IdentityModel,
  IdentitySummaryStats,
  Embedding3DPoint,
  IdentityTaskLog,
  IdentityCrop
} from "../types";

// Vibrant, harmonious palette for 3D model clusters
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

interface IdentitiesPageProps {
  setLoading?: (loading: boolean) => void;
}

export function IdentitiesPage({ setLoading }: IdentitiesPageProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "3d" | "models" | "tasks">("overview");
  const [summary, setSummary] = useState<IdentitySummaryStats | null>(null);
  const [identities, setIdentities] = useState<IdentityModel[]>([]);
  const [points3d, setPoints3d] = useState<Embedding3DPoint[]>([]);
  const [tasks, setTasks] = useState<IdentityTaskLog[]>([]);
  const [selectedModel, setSelectedModel] = useState<(IdentityModel & { crops: IdentityCrop[] }) | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 3D Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState(0.4);
  const [rotY, setRotY] = useState(0.6);
  const [zoom, setZoom] = useState(240);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<Embedding3DPoint | null>(null);
  const [selectedPointModel, setSelectedPointModel] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const loadData = async (signal?: AbortSignal) => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const [sumData, idData, embData, taskData] = await Promise.all([
        getIdentitiesSummary(signal).catch(() => null),
        getIdentitiesList(statusFilter, searchQuery, signal).catch(() => ({ identities: [], count: 0 })),
        get3dEmbeddings(signal).catch(() => ({ points: [], count: 0 })),
        getIdentityTasks(40, signal).catch(() => ({ tasks: [], count: 0 }))
      ]);

      if (sumData) setSummary(sumData);
      setIdentities(idData.identities);
      setPoints3d(embData.points);
      setTasks(taskData.tasks);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setErrorMsg("Could not connect to Identities API gateway.");
      }
    } finally {
      setIsRefreshing(false);
      setLoading?.(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [statusFilter, searchQuery]);

  // Distinct model map for color coding
  const modelColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueModels = Array.from(new Set(points3d.map((p) => p.model_name)));
    uniqueModels.forEach((m, idx) => {
      map.set(m, getModelColor(m, idx));
    });
    return map;
  }, [points3d]);

  // 3D Canvas Render Loop
  useEffect(() => {
    if (activeTab !== "3d" && activeTab !== "overview") return;
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
        setRotY((prev) => (prev + 0.004) % (Math.PI * 2));
      }

      const cx = width / 2;
      const cy = height / 2;

      // Draw Grid / Coordinate Bounding Box
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;

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
        // Rotate around Y
        const x1 = axis.x * cosY + axis.z * sinY;
        const z1 = -axis.x * sinY + axis.z * cosY;
        // Rotate around X
        const y2 = axis.y * cosX - z1 * sinX;
        const z2 = axis.y * sinX + z1 * cosX;

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
      const activePoints = selectedPointModel
        ? points3d.filter((p) => p.model_name === selectedPointModel)
        : points3d;

      const projected = activePoints.map((pt) => {
        // Rotate around Y
        const x1 = pt.x * cosY + pt.z * sinY;
        const z1 = -pt.x * sinY + pt.z * cosY;
        // Rotate around X
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
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Main Point Circle
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#ffffff" : color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isHovered ? 12 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHovered) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(`${pt.model_name} (${pt.rel_path})`, screenX + 10, screenY - 6);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeTab, points3d, rotX, rotY, zoom, autoRotate, hoveredPoint, selectedPointModel, modelColorMap]);

  // Handle Mouse Interactions for 3D Orbiting
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
      // Hit testing for hover
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
      let minDistance = 12;

      const activePoints = selectedPointModel
        ? points3d.filter((p) => p.model_name === selectedPointModel)
        : points3d;

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
    setZoom((prev) => Math.max(80, Math.min(600, prev - e.deltaY * 0.2)));
  };

  const openModelDrawer = async (model: IdentityModel) => {
    try {
      const details = await getIdentityDetails(model.name);
      setSelectedModel(details);
    } catch {
      setSelectedModel({ ...model, crops: [] });
    }
  };

  const handleToggleStatus = async (model: IdentityModel, newStatus: "locked" | "soft") => {
    try {
      await updateIdentityStatus(model.name, newStatus);
      loadData();
      if (selectedModel && selectedModel.name === model.name) {
        setSelectedModel({ ...selectedModel, status: newStatus });
      }
    } catch (err) {
      alert(`Failed to update status: ${err}`);
    }
  };

  return (
    <div className="identities-page warm-page">
      {/* Page Top Header */}
      <header className="page-header warm-card">
        <div className="header-titles">
          <div className="title-row">
            <h1>Model Identities & Facial Feature Space</h1>
            <span className="live-pill healthy">
              <span className="status-led healthy" /> SQLite Multi-Vector Gateway
            </span>
          </div>
          <p className="page-subtitle">
            ArcFace 512-dimensional canonical feature embeddings, smart candidate exemplars, and multi-angle orientation telemetry.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="header-actions">
          <div className="tab-pill-group">
            <button
              className={`tab-pill ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview & KPIs
            </button>
            <button
              className={`tab-pill ${activeTab === "3d" ? "active" : ""}`}
              onClick={() => setActiveTab("3d")}
            >
              3D Feature Space ({points3d.length})
            </button>
            <button
              className={`tab-pill ${activeTab === "models" ? "active" : ""}`}
              onClick={() => setActiveTab("models")}
            >
              Gallery Models ({identities.length})
            </button>
            <button
              className={`tab-pill ${activeTab === "tasks" ? "active" : ""}`}
              onClick={() => setActiveTab("tasks")}
            >
              Activity Logs ({tasks.length})
            </button>
          </div>

          <button
            className={`btn-icon ${isRefreshing ? "spin" : ""}`}
            onClick={() => loadData()}
            title="Refresh from Gallery Database"
            disabled={isRefreshing}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {errorMsg && <div className="alert-box error">{errorMsg}</div>}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & KPIS
      ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="overview-container">
          {/* Top KPI Deck */}
          <div className="kpi-grid">
            <div className="kpi-card warm-card glow-cyan">
              <div className="kpi-label">Total Model Identities</div>
              <div className="kpi-value">{summary?.total_models ?? identities.length}</div>
              <div className="kpi-sub">
                <span className="badge-locked">{summary?.locked_models ?? 0} Locked</span>
                <span className="badge-soft">{summary?.soft_models ?? 0} Soft</span>
              </div>
            </div>

            <div className="kpi-card warm-card glow-purple">
              <div className="kpi-label">Stored ArcFace Vectors</div>
              <div className="kpi-value">{summary?.total_face_crops ?? points3d.length}</div>
              <div className="kpi-sub">512-dim L2 Normalized Float32</div>
            </div>

            <div className="kpi-card warm-card glow-emerald">
              <div className="kpi-label">Exemplar Anchors</div>
              <div className="kpi-value">{summary?.exemplars_count ?? 0}</div>
              <div className="kpi-sub">Smart Medoid Consensus Ranked</div>
            </div>

            <div className="kpi-card warm-card glow-amber">
              <div className="kpi-label">Avg Quality & Norm</div>
              <div className="kpi-value">{summary?.avg_quality_score ?? "0.99"}</div>
              <div className="kpi-sub">Feature Norm: {summary?.avg_feature_norm ?? "22.5"}</div>
            </div>

            <div className="kpi-card warm-card glow-rose">
              <div className="kpi-label">Processed Images</div>
              <div className="kpi-value">{summary?.total_images_processed ?? 0}</div>
              <div className="kpi-sub">{summary?.total_outliers_isolated ?? 0} Outliers Quarantined</div>
            </div>
          </div>

          {/* Quick 3D Preview + Featured Models */}
          <div className="overview-split">
            <div className="split-left warm-card">
              <div className="card-header">
                <h3>3D Face Feature Space Preview</h3>
                <button className="btn-sm" onClick={() => setActiveTab("3d")}>
                  Full Screen Visualizer
                </button>
              </div>
              <div className="canvas-wrapper preview-canvas">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onWheel={handleWheel}
                />
              </div>
              <div className="canvas-hint">Drag mouse to orbit. Scroll wheel to zoom.</div>
            </div>

            <div className="split-right warm-card">
              <div className="card-header">
                <h3>Active Gallery Models</h3>
                <button className="btn-sm" onClick={() => setActiveTab("models")}>
                  View All ({identities.length})
                </button>
              </div>
              <div className="quick-models-list">
                {identities.slice(0, 6).map((model) => (
                  <div key={model.id} className="quick-model-row" onClick={() => openModelDrawer(model)}>
                    <div className="model-avatar">
                      {model.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="model-info">
                      <div className="model-name">{model.name}</div>
                      <div className="model-meta">
                        {model.crop_count} crops ({model.exemplar_count} exemplars)
                      </div>
                    </div>
                    <span className={`status-badge ${model.status}`}>
                      {model.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 2: 3D / 2.5D FEATURE SPACE VISUALIZER
      ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "3d" && (
        <div className="canvas-tab-container warm-card">
          <div className="canvas-toolbar">
            <div className="toolbar-left">
              <h2>Interactive ArcFace Feature Embeddings</h2>
              <span className="point-count-pill">{points3d.length} Vectors in 3D Space</span>
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
                value={selectedPointModel ?? ""}
                onChange={(e) => setSelectedPointModel(e.target.value || null)}
                className="select-input"
              >
                <option value="">All Models Cluster</option>
                {Array.from(new Set(points3d.map((p) => p.model_name))).map((m) => (
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

          <div className="canvas-stage-wrapper">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className="full-3d-canvas"
            />

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="point-tooltip">
                <strong>{hoveredPoint.model_name}</strong>
                <div>File: {hoveredPoint.rel_path}</div>
                <div>Confidence: {(hoveredPoint.quality_score * 100).toFixed(1)}%</div>
                <div>Norm: {hoveredPoint.feature_norm.toFixed(2)}</div>
                <div>{hoveredPoint.is_exemplar ? "⭐ Core Smart Exemplar" : "Standard Model Crop"}</div>
                <div className="coord-text">
                  3D: ({hoveredPoint.x}, {hoveredPoint.y}, {hoveredPoint.z})
                </div>
              </div>
            )}

            {/* Color Legend */}
            <div className="canvas-legend">
              <div className="legend-title">Cluster Color Legend</div>
              <div className="legend-items">
                {Array.from(modelColorMap.entries()).map(([modelName, col]) => (
                  <div
                    key={modelName}
                    className={`legend-item ${selectedPointModel === modelName ? "active" : ""}`}
                    onClick={() =>
                      setSelectedPointModel(selectedPointModel === modelName ? null : modelName)
                    }
                  >
                    <span className="legend-dot" style={{ backgroundColor: col }} />
                    <span className="legend-name">{modelName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 3: GALLERY MODELS GRID
      ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "models" && (
        <div className="models-tab-container">
          <div className="filter-bar warm-card">
            <div className="search-box">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              {["all", "locked", "soft", "invalid"].map((st) => (
                <button
                  key={st}
                  className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="models-grid">
            {identities.map((model) => (
              <div key={model.id} className="model-card warm-card">
                <div className="card-top">
                  <div className="card-avatar">{model.name.slice(0, 2).toUpperCase()}</div>
                  <div className="card-headings">
                    <h3 className="card-title">{model.name}</h3>
                    <span className="card-date">Created {model.created_at.slice(0, 10)}</span>
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
                        <div key={idx} className="exemplar-chip" title={ex.rel_path}>
                          {ex.rel_path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card-actions">
                  <button className="btn-secondary" onClick={() => openModelDrawer(model)}>
                    Inspect Crops
                  </button>
                  {model.status === "soft" ? (
                    <button
                      className="btn-primary"
                      onClick={() => handleToggleStatus(model, "locked")}
                    >
                      Lock Identity
                    </button>
                  ) : (
                    <button
                      className="btn-outline"
                      onClick={() => handleToggleStatus(model, "soft")}
                    >
                      Set Soft
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 4: ACTIVITY & TASK TELEMETRY LOGS
      ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="tasks-tab-container warm-card">
          <div className="card-header">
            <h2>Task Execution Telemetry & Performance Logs</h2>
            <span className="point-count-pill">{tasks.length} Total Task Records</span>
          </div>

          <div className="table-responsive">
            <table className="telemetry-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Task Type</th>
                  <th>Target Model</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Scanned</th>
                  <th>Matched</th>
                  <th>Outliers</th>
                  <th>Quarantined</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.created_at.replace("T", " ").slice(0, 19)}</td>
                    <td>
                      <span className={`task-badge ${t.task_type}`}>{t.task_type}</span>
                    </td>
                    <td><strong>{t.target_model ?? "—"}</strong></td>
                    <td>
                      <span className={`status-led ${t.status === "completed" ? "healthy" : "offline"}`} />
                      {t.status}
                    </td>
                    <td>{t.duration_ms} ms</td>
                    <td>{t.images_scanned}</td>
                    <td>{t.matched_count}</td>
                    <td>{t.outliers_count}</td>
                    <td>{t.quarantined_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODEL INSPECTOR DRAWER / MODAL
      ───────────────────────────────────────────────────────────────────── */}
      {selectedModel && (
        <div className="modal-backdrop" onClick={() => setSelectedModel(null)}>
          <div className="modal-drawer warm-card" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>{selectedModel.name}</h2>
                <span className={`status-badge ${selectedModel.status}`}>
                  {selectedModel.status.toUpperCase()}
                </span>
              </div>
              <button className="btn-close" onClick={() => setSelectedModel(null)}>
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-metrics">
                <div>
                  <strong>Threshold:</strong> {selectedModel.threshold}
                </div>
                <div>
                  <strong>Total Crops:</strong> {selectedModel.crops?.length ?? 0}
                </div>
                <div>
                  <strong>Created:</strong> {selectedModel.created_at}
                </div>
              </div>

              <h3>Stored Face Crops & Vectors</h3>
              <div className="crops-list">
                {selectedModel.crops?.map((crop) => (
                  <div key={crop.id} className="crop-row">
                    <div className="crop-main">
                      <span className="crop-icon">{crop.is_exemplar ? "⭐" : "📷"}</span>
                      <div className="crop-name">
                        <strong>{crop.rel_path}</strong>
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
