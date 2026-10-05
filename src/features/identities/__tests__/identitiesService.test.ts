import { describe, it, expect } from "vitest";
import {
  getAvailableGalleries,
  getGallerySummary,
  getFilteredModels,
  getFiltered3DPoints,
  getFilteredTasks,
  ALL_GALLERIES_SOURCE
} from "../lib/identitiesService";

describe("Identities Local PC Service", () => {
  it("provides available galleries with real PC storage stats", () => {
    const galleries = getAvailableGalleries();
    expect(galleries.length).toBe(5);

    const allSource = galleries[0];
    expect(allSource.id).toBe("all");
    expect(allSource.summary.total_models).toBe(15000);
    expect(allSource.summary.total_face_crops).toBe(130591);
    expect(allSource.summary.exemplars_count).toBe(97692);

    const fGallery = galleries.find((g) => g.id === "f_amd");
    expect(fGallery).toBeDefined();
    expect(fGallery?.drive).toBe("F:");
    expect(fGallery?.summary.total_models).toBe(12576);

    const celebGallery = galleries.find((g) => g.id === "g_celebrities");
    expect(celebGallery).toBeDefined();
    expect(celebGallery?.drive).toBe("G:");
    expect(celebGallery?.summary.total_models).toBe(900);

    const miniGallery = galleries.find((g) => g.id === "d_miniville");
    expect(miniGallery).toBeDefined();
    expect(miniGallery?.drive).toBe("D:");
    expect(miniGallery?.summary.total_models).toBe(593);
  });

  it("retrieves gallery summaries accurately", () => {
    const allSummary = getGallerySummary("all");
    expect(allSummary.total_models).toBe(15000);
    expect(allSummary.locked_models).toBe(13207);
    expect(allSummary.soft_models).toBe(1792);
    expect(allSummary.invalid_models).toBe(1);

    const gSummary = getGallerySummary("g_gallery");
    expect(gSummary.total_models).toBe(931);
    expect(gSummary.total_face_crops).toBe(20461);
  });

  it("filters models by gallery, status, and search query", () => {
    const allModels = getFilteredModels("all");
    expect(allModels.length).toBeGreaterThan(0);

    const lockedModels = getFilteredModels("all", "locked");
    expect(lockedModels.every((m) => m.status === "locked")).toBe(true);

    const celebModels = getFilteredModels("g_celebrities");
    expect(celebModels.every((m) => m.gallery_id === "g_celebrities")).toBe(true);

    // Filter by name query
    const searchResults = getFilteredModels("all", "all", "claudia");
    expect(searchResults.some((m) => m.name.toLowerCase().includes("claudia"))).toBe(true);
  });

  it("provides 3D PCA projection points with valid coordinates", () => {
    const points = getFiltered3DPoints("all");
    expect(points.length).toBeGreaterThan(0);

    const first = points[0];
    expect(typeof first.x).toBe("number");
    expect(typeof first.y).toBe("number");
    expect(typeof first.z).toBe("number");
    expect(typeof first.quality_score).toBe("number");
    expect(typeof first.feature_norm).toBe("number");
    expect(first.model_name).toBeTruthy();
  });

  it("retrieves real task telemetry logs", () => {
    const tasks = getFilteredTasks("all");
    expect(tasks.length).toBe(5);
    expect(tasks.every((t) => t.status === "completed")).toBe(true);
    expect(tasks.some((t) => t.task_type === "clean")).toBe(true);
  });
});
