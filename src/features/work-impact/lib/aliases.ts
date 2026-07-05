// ── Project alias map — canonical name → former / junk names ─────────────────
//
// Lookup is case-insensitive. Resolution rule: if a name (case-insensitively)
// equals a canonical OR appears in any canonical's aliases list, normalize to
// that canonical. Otherwise the name is returned unchanged.
//
// FORKS are external repos that show up in agent-input but aren't owned
// projects. They get dropped from byProject / projects / totalProjects so they
// don't pad the owned-project count.

const aliasToCanonical = new Map<string, string>()
const forkSet = new Set<string>()
const aliasesRecord: Record<string, string[]> = {}
export interface ProjectMetadata {
  isPrivate: boolean;
  owner: string | null;
  isDeleted: boolean;
  isFork: boolean;
  repoId: string | null;
}

const metadataRecord: Record<string, ProjectMetadata> = {}
let isInitialized = false
let initPromise: Promise<void> | null = null

export async function initAliases(apiUrl: string, signal?: AbortSignal): Promise<void> {
  if (isInitialized) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const response = await fetch(`${apiUrl}/projects/aliases`, {
        headers: { Accept: "application/json" },
        signal
      })
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      const data: Array<{
        canonical: string
        repoId: string | null
        isPrivate: boolean
        owner: string | null
        aliases: string[]
        isDeleted: boolean
        isFork: boolean
      }> = await response.json()

      aliasToCanonical.clear()
      forkSet.clear()
      // Note: we can't completely replace aliasesRecord because it's a const, but we can clear its keys
      for (const key of Object.keys(aliasesRecord)) {
        delete aliasesRecord[key]
      }
      for (const key of Object.keys(metadataRecord)) {
        delete metadataRecord[key]
      }

      for (const p of data) {
        if (p.isFork) {
          forkSet.add(p.canonical.toLowerCase())
        }
        metadataRecord[p.canonical.toLowerCase()] = {
          isPrivate: p.isPrivate,
          owner: p.owner,
          isDeleted: p.isDeleted,
          isFork: p.isFork,
          repoId: p.repoId
        }
        aliasesRecord[p.canonical] = p.aliases || []
        aliasToCanonical.set(p.canonical.toLowerCase(), p.canonical)
        for (const a of (p.aliases || [])) {
          aliasToCanonical.set(a.toLowerCase(), p.canonical)
        }
      }
      isInitialized = true
    } catch (e) {
      console.error("Failed to load project aliases from API:", e)
    } finally {
      initPromise = null
    }
  })()

  return initPromise
}

/** Map any project name to its canonical form (unchanged if not aliased). */
export function normalizeProject(name: string): string {
  if (!name) return 'General Tasks'
  return aliasToCanonical.get(name.toLowerCase()) ?? name
}

/** True if the project is one of our owned projects (not a fork repo). */
export function isOwnedProject(name: string): boolean {
  return !forkSet.has(name.toLowerCase())
}

/** Legacy compat: aliases for a given canonical, or [] if unknown. */
export function getAliases(name: string): string[] {
  return aliasesRecord[name.toLowerCase()] ?? []
}

export function getProjectMetadata(name: string): ProjectMetadata | null {
  return metadataRecord[name.toLowerCase()] ?? null
}
