import React, { useEffect, useState, useMemo } from "react";
import {
  getIdentitiesSummary,
  getIdentitiesList,
  getIdentityDetails,
  get3dEmbeddings,
  getIdentityTasks,
  updateIdentityStatus,
  getAvailableGalleries
} from "../api";
import type {
  IdentityModel,
  IdentitySummaryStats,
  Embedding3DPoint,
  IdentityTaskLog,
  IdentityCrop,
  GallerySourceInfo
} from "../types";
import {
  GallerySourceSelector,
  IdentitiesKpiDeck,
  EmbeddingVisualizer3D,
  GalleryModelsGrid,
  ModelCropDrawer,
  TaskTelemetryTable,
  type IdentityTab
} from "../features/identities";

interface IdentitiesPageProps {
  setLoading?: (loading: boolean) => void;
}

export function IdentitiesPage({ setLoading }: IdentitiesPageProps) {
  const galleries: GallerySourceInfo[] = useMemo(() => getAvailableGalleries(), []);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<IdentityTab>("overview");
  const [summary, setSummary] = useState<IdentitySummaryStats | null>(null);
  const [identities, setIdentities] = useState<(IdentityModel & { crops?: IdentityCrop[] })[]>([]);
  const [points3d, setPoints3d] = useState<Embedding3DPoint[]>([]);
  const [tasks, setTasks] = useState<IdentityTaskLog[]>([]);
  const [selectedModel, setSelectedModel] = useState<(IdentityModel & { crops?: IdentityCrop[] }) | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPointModel, setSelectedPointModel] = useState<string | null>(null);

  const activeGallery = useMemo(
    () => galleries.find((g) => g.id === selectedGalleryId) || galleries[0],
    [galleries, selectedGalleryId]
  );

  const loadData = async (signal?: AbortSignal) => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const [sumData, idData, embData, taskData] = await Promise.all([
        getIdentitiesSummary(selectedGalleryId, signal).catch(() => null),
        getIdentitiesList(statusFilter, searchQuery, selectedGalleryId, signal).catch(() => ({ identities: [], count: 0 })),
        get3dEmbeddings(selectedGalleryId, selectedPointModel, signal).catch(() => ({ points: [], count: 0 })),
        getIdentityTasks(selectedGalleryId, 40, signal).catch(() => ({ tasks: [], count: 0 }))
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
  }, [selectedGalleryId, statusFilter, searchQuery]);

  const openModelDrawer = async (model: IdentityModel & { crops?: IdentityCrop[] }) => {
    try {
      const details = await getIdentityDetails(model.name);
      setSelectedModel(details);
    } catch {
      setSelectedModel({ ...model, crops: model.crops || [] });
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
            ArcFace 512-dimensional canonical feature embeddings, smart candidate exemplars, and multi-drive gallery telemetry across PC storage.
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

      {/* Gallery Source Selector Bar */}
      <GallerySourceSelector
        galleries={galleries}
        selectedGalleryId={selectedGalleryId}
        onSelectGallery={setSelectedGalleryId}
      />

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === "overview" && summary && (
        <div className="overview-container">
          <IdentitiesKpiDeck
            summary={summary}
            galleryLabel={selectedGalleryId === "all" ? undefined : activeGallery.short_name}
          />

          <div className="overview-split">
            <div className="split-left warm-card">
              <div className="card-header">
                <h3>3D Face Feature Space Preview</h3>
                <button className="btn-sm" onClick={() => setActiveTab("3d")}>
                  Full Screen Visualizer
                </button>
              </div>
              <EmbeddingVisualizer3D
                points={points3d}
                selectedModel={selectedPointModel}
                onSelectModel={setSelectedPointModel}
                fullMode={false}
              />
              <div className="canvas-hint">Drag mouse to orbit. Scroll wheel to zoom.</div>
            </div>

            <div className="split-right warm-card">
              <div className="card-header">
                <h3>Active Gallery Models ({identities.length})</h3>
                <button className="btn-sm" onClick={() => setActiveTab("models")}>
                  View All
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
                        {model.gallery_name && ` · ${model.gallery_name}`}
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

      {/* TAB 2: 3D FEATURE SPACE VISUALIZER */}
      {activeTab === "3d" && (
        <EmbeddingVisualizer3D
          points={points3d}
          selectedModel={selectedPointModel}
          onSelectModel={setSelectedPointModel}
          fullMode={true}
        />
      )}

      {/* TAB 3: GALLERY MODELS GRID */}
      {activeTab === "models" && (
        <GalleryModelsGrid
          models={identities}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onInspectModel={openModelDrawer}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* TAB 4: ACTIVITY & TASK TELEMETRY LOGS */}
      {activeTab === "tasks" && (
        <TaskTelemetryTable tasks={tasks} />
      )}

      {/* MODEL INSPECTOR DRAWER / MODAL */}
      <ModelCropDrawer
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
      />
    </div>
  );
}
