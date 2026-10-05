import identitiesSnapshot from "./identitiesSnapshot.json";
import type {
  GallerySourceInfo,
  IdentityCrop,
  IdentityModel,
  IdentitySummaryStats,
  Embedding3DPoint,
  IdentityTaskLog,
  IdentitiesSnapshotData
} from "../types";

const snapshot = identitiesSnapshot as unknown as IdentitiesSnapshotData;

export const ALL_GALLERIES_SOURCE: GallerySourceInfo = {
  id: "all",
  name: "All PC Galleries (Combined)",
  short_name: "All Galleries",
  drive: "Combined",
  path: "Aggregated Local PC Galleries (F:, G:, D:)",
  description: "Unified telemetry across all 4 local gallery datasets (AMD Harvester, Curated Primary, Celebrities, Miniville)",
  summary: snapshot.summary
};

export function getAvailableGalleries(): GallerySourceInfo[] {
  return [ALL_GALLERIES_SOURCE, ...snapshot.galleries];
}

export function getGallerySummary(galleryId: string = "all"): IdentitySummaryStats {
  if (!galleryId || galleryId === "all") {
    return snapshot.summary;
  }
  const match = snapshot.galleries.find((g) => g.id === galleryId);
  return match?.summary || snapshot.summary;
}

export function getFilteredModels(
  galleryId: string = "all",
  statusFilter: string = "all",
  searchQuery: string = ""
): (IdentityModel & { crops?: IdentityCrop[] })[] {
  let list = snapshot.models;

  if (galleryId && galleryId !== "all") {
    list = list.filter((m) => m.gallery_id === galleryId);
  }

  if (statusFilter && statusFilter !== "all") {
    list = list.filter((m) => m.status.toLowerCase() === statusFilter.toLowerCase());
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((m) => m.name.toLowerCase().includes(q));
  }

  return list;
}

export function getFiltered3DPoints(
  galleryId: string = "all",
  selectedModel: string | null = null
): Embedding3DPoint[] {
  let list = snapshot.points3d;

  if (galleryId && galleryId !== "all") {
    list = list.filter((p) => p.gallery_id === galleryId);
  }

  if (selectedModel) {
    list = list.filter((p) => p.model_name.toLowerCase() === selectedModel.toLowerCase());
  }

  return list;
}

export function getFilteredTasks(galleryId: string = "all"): IdentityTaskLog[] {
  let list = snapshot.tasks;

  if (galleryId && galleryId !== "all") {
    list = list.filter((t) => t.gallery_id === galleryId);
  }

  return list;
}

export function getSnapshotTimestamp(): string {
  return snapshot.generated_at;
}
