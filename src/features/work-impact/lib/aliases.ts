// ── Project alias map — canonical name → former names ────────────────────────

export const ALIASES: Record<string, string[]> = {
  'vaultwares-glass':              ['glass-ui'],
  'vaultwares-dispatch':           ['dispatch-wares'],
  'vaultwares-decompile':          ['deconstructed-website-a-la-mode'],
  'vaultwares-media-processing':   ['vault-video-enhancer', 'VaultWares Media Processing', 'video-transcriber-translator', 'vault-enhancer', 'vault_enhancer'],
  'vaultwares-realtime':           ['realtime-stt'],
  'vaultwares-studio':             ['usd-playground'],
  'vaultwares-website':            ['vaultwares-v1'],
  'vaultwares-docs':               ['tmp-app'],
  'vaultwares-identity-manager':   ['vaultwares-auto-signup'],
  'vaultwares-cli':                [],
  'tube-sites':                    ['tube-site', 'promking-tube', 'Prom-King\\tube-sites', 'Prom-King/tube-sites', 'Prom-King tube-sites', 'Prom-King\\\\tube-sites', 'prom-king.xyz', 'fullxxx.video', 'prom-king/fullxxx-video-and-qa-automation', 'prom-king/fullxxx-webhook-deploy-qa'],
  'vaultwares-themes':             ['vault-themes'],
  'vaultwares-adk':                ['vaultwares-agentciation'],
  'vaultwares-api':                ['vaultwares-pipelines'],
  'python-zipper':                 ['python-scripts'],
  'vault-explorer':                ['Vault Explorer'],
  'qa-automation':                 ['Prom-King/qa-automation'],
  'prelanding-page':               ['Prom-King/prelanding-page', 'prom-king-prelanding-page'],
  'agent-ledger':                  ['agent-ledger/stats-app'],
  'vaultwares-mcp':                ['fastmcp'],
  'no-more-groceries':             ['No More Groceries'],
  'General Tasks':                 ['General Tasks (workspace)', 'Workspace Git Sync', 'VaultWares protocols', 'Prom King monetization projects', 'business workspace', 'business', 'business tube sites', 'business WordPress tube sites', 'Test', 'VaultWares Secrets', 'vaultwares-secrets', 'vaultwares-console'],
  'vw-jira-sync':                 ['vaultwares-docs / vw-jira-sync', 'General Tasks / vw-jira-sync']
}

/** Resolve aliases for a project — returns array of former names or [] */
export function getAliases(name: string): string[] {
  return ALIASES[name.toLowerCase()] ?? []
}
