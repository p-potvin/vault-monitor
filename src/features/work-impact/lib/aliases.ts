// ── Project alias map — canonical name → former / junk names ─────────────────
//
// Lookup is case-insensitive. Resolution rule: if a name (case-insensitively)
// equals a canonical OR appears in any canonical's aliases list, normalize to
// that canonical. Otherwise the name is returned unchanged.
//
// FORKS are external repos that show up in agent-input but aren't owned
// projects. They get dropped from byProject / projects / totalProjects so they
// don't pad the owned-project count.

export const ALIASES: Record<string, string[]> = {
  'vaultwares-glass':              ['glass-ui'],
  'vaultwares-dispatch':           ['dispatch-wares'],
  'vaultwares-decompile':          ['deconstructed-website-a-la-mode'],
  'vaultwares-media-processing':   ['vault-video-enhancer', 'VaultWares Media Processing', 'video-transcriber-translator', 'vault-enhancer', 'vault_enhancer'],
  'vaultwares-realtime':           ['realtime-stt'],
  'vaultwares-studio':             ['usd-playground'],
  'vaultwares-website':            ['vaultwares-v1', 'vaultwares-website + vaultwares-themes'],
  'vaultwares-docs':               ['tmp-app'],
  'vaultwares-identity-manager':   ['vaultwares-auto-signup'],
  'vaultwares-cli':                [],
  'tube-sites':                    ['tube-site', 'promking-tube', 'Prom-King\\tube-sites', 'Prom-King/tube-sites', 'Prom-King tube-sites', 'Prom-King\\\\tube-sites', 'prom-king.xyz', 'fullxxx.video', 'prom-king/fullxxx-video-and-qa-automation', 'prom-king/fullxxx-webhook-deploy-qa', 'Prom-King Keep2Share & ShareVerge Pipeline', 'Prom-King & VaultWares API', 'Monitoring and Prom-King tube operations'],
  'vaultwares-themes':             ['vault-themes', 'vault-themes, vault-player', 'vault-themes + vaultwares-docs'],
  'vaultwares-adk':                ['vaultwares-agentciation'],
  'vaultwares-api':                ['vaultwares-pipelines', 'vaultwares-api + shared-tube', 'vaultwares-webhooks'],
  'python-zipper':                 ['python-scripts'],
  'vault-explorer':                ['Vault Explorer', 'vw-comet + vault-explorer', 'vault-explorer + vw-comet'],
  'qa-automation':                 ['Prom-King/qa-automation'],
  'prelanding-page':               ['Prom-King/prelanding-page', 'prom-king-prelanding-page'],
  'agent-ledger':                  ['agent-ledger/stats-app'],
  'vaultwares-mcp':                ['fastmcp'],
  'no-more-groceries':             ['No More Groceries'],
  'shared-tube':                   ['Prom-King/shared-tube', 'Prom-King/shared-tube + vaultwares-pipelines', 'Prom-King/shared-tube + vaultwares-api', 'Prom-King/shared-tube + vaultwares-mcp', 'Prom-King/shared-tube + vaultwares-docs', 'Prom-King/shared-tube + VaultWares/vaultwares-mcp + vaultwares-docs', 'shared-tube + brume2'],
  'content-disseminator':          ['Prom-King/content-disseminator'],
  'link-sharing':                  ['prom-king/link-sharing'],
  'vault-central':                 ['Vault Central'],
  'vault-monitor':                 ['vault-monitor vaultwares-pipelines'],
  'vw-media-stack':                ['vw-media-stack / vaultwares-docs', 'vps-ovhcloud media stack', 'vps-ovhcloud-media-stack'],
  'nvidia-rag':                    ['NVIDIA RAG', 'NVIDIA RAG Ingestion', 'NVIDIA RAG Blueprint'],
  'General Tasks':                 ['General Tasks (workspace)', 'Workspace Git Sync', 'VaultWares protocols', 'Prom King monetization projects', 'business workspace', 'business', 'business tube sites', 'business WordPress tube sites', 'Test', 'VaultWares Secrets', 'vaultwares-secrets', 'vaultwares-console', 'VaultWares SSOT', 'VaultWares SSOT (20 repos)', 'VaultWares Infrastructure', 'VaultWares Project File Sync', 'VaultWares — Post-Refactoring Cleanup & Infrastructure Verification', 'VaultWares — Project Rename Refactoring (Phase 5)', 'VaultWares — Project Rename Refactoring (Phase 5 PR Workflow)', 'VaultWares — System Verification & Maintenance Complete', 'vaultwares-themes, vaultwares-adk, vaultwares-realtime, vaultwares-media-processing', 'deploy-flow-unification'],
  'vw-jira-sync':                 ['vaultwares-docs / vw-jira-sync', 'General Tasks / vw-jira-sync']
}

/** External-fork repos that show up in agent-input but aren't owned projects. */
export const FORKS: readonly string[] = ['OneTrainer', 'video-depth-anything']

// ── Resolution helpers (case-insensitive) ────────────────────────────────────

const aliasToCanonical = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(ALIASES)) {
  aliasToCanonical.set(canonical.toLowerCase(), canonical)
  for (const a of aliases) aliasToCanonical.set(a.toLowerCase(), canonical)
}
const forkSet = new Set(FORKS.map(s => s.toLowerCase()))

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
  return ALIASES[name.toLowerCase()] ?? []
}
