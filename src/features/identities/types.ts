import type {
  ExemplarPreview,
  IdentityCrop,
  IdentityModel,
  IdentitySummaryStats,
  Embedding3DPoint,
  IdentityTaskLog,
  GallerySourceInfo
} from "../../types";

export type {
  ExemplarPreview,
  IdentityCrop,
  IdentityModel,
  IdentitySummaryStats,
  Embedding3DPoint,
  IdentityTaskLog,
  GallerySourceInfo
};

export type IdentityTab = "overview" | "3d" | "models" | "tasks";

export interface IdentitiesSnapshotData {
  generated_at: string;
  summary: IdentitySummaryStats;
  galleries: GallerySourceInfo[];
  models: (IdentityModel & { crops?: IdentityCrop[] })[];
  points3d: Embedding3DPoint[];
  tasks: IdentityTaskLog[];
}
