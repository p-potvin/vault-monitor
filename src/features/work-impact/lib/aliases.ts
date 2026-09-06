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
const forkSet = new Set<string>(['onetrainer'])
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

const BUILTIN_ALIASES: Record<string, string[]> = {
  'vaultwares-media-processing': [
    'vault-video-enhancer',
    'VaultWares Media Processing',
    'video-transcriber-translator',
    'vault-enhancer',
    'vault_enhancer',
  ],
  'prom-king': [
    'Prom-King',
    'Prom-King docs',
    'Prom-King/docs',
    'Prom-King docs release',
    'Prom-King shared-tube',
    'Prom-King / VaultWares',
    'Prom King monetization projects',
  ],
  'tech-oracle': [
    'tech-oracle (Prom-King)',
  ],
  'vaultwares-cli': [
    'vw-cli',
  ],
  'vaultwares-themes': [
    'vault-themes',
  ],
  'vault-explorer': [
    'Vault Explorer',
    'vault-explorer,vault-streaming',
    'vault-streaming,vault-explorer',
  ],
  'vw-media-stack': [
    'vw-media',
    'vw-media (ovhcloud)',
    'vault-media-stack (OVH)',
    'wallpaper-foundry / vw-media-stack',
    'VaultWares DNS / media stack',
    'vw-media + agent-ledger + vault-monitor',
    'vps-ovhcloud media stack',
    'vps-ovhcloud-media-stack',
  ],
  'vault-streaming': [
    'vault-streaming + vw-comet',
    'vw-comet ovhcloud',
    'vw-comet (ovhcloud 100.67.25.118)',
    'vw-comet-indexers ovhcloud',
  ],
  'vaultwares-api': [
    'vaultwares-api, agent-ledger',
    'vaultwares-api & networking',
    'shared-tube & vaultwares-api',
  ],
  'vault-inference': [
    'vault-inference,vaultwares-docs',
  ],
  'vaultwares-realtime': [
    'vaultwares-realtime,vault-explorer',
    'realtime-stt',
  ],
  'vaultwares-studio': [
    'vaultwares-studio / vault-commander',
    'usd-playground',
  ],
  'vault-monitor': [
    'vault-monitor / infrastructure',
    'vault-monitor,qa-automation',
    'vault-monitor vaultwares-pipelines',
  ],
  'vaultwares-mcp': [
    'vaultwares-mcp / media stack',
  ],
  'General Tasks': [
    'General Tasks (workspace)',
    'Workspace Git Sync',
    'Test',
    'VaultWares Infra',
    'multi-repo-infra',
    'ovh-infra',
    'vps-ovhcloud maintenance',
    'tailnet-sync',
    'openclaw',
    'OpenClaw',
    'memories',
  ],
  'huggingface-spaces': [
    'pro-realism',
    'pro-realism-v3',
    'Pro-Realism-Edit-Studio',
    'Pro-Realism-FLUX2-Klein-Multi-LoRA',
    'huggingface spaces',
  ],
  'vault-cacophony': [
    'mini-omni',
  ],
  'colonel-kfc': [
    'ColONEL-KFC',
    'Colonel-KFC',
  ],
  'mai-vibo': [
    'Mai-ViBo-2ruViSum-AIO',
  ],
  'thoughts': [
    'Thoughts',
    'thoughts/memories',
  ],
  'prelanding-page': [
    'Prelanding-Page',
    'pre-landing-page',
  ],
  'tube-sites': [
    'business',
    'business workspace',
    'business tube sites',
    'business WordPress tube sites',
  ],
  'health-ledger': [
    'Health Ledger Release',
  ],
  'vaultwares-docs': [
    'VaultWares protocols',
    'tmp-app',
  ],
  'auto-backup': [
    'vaultwares-backups',
  ],
  'vault-central': [
    'vaultwares-console',
    'Vault Central',
  ],
  'vaultwares-adk': [
    'vaultwares-adk consumers',
  ],
  'pkt-wallpapers': [
    'PKT Wallpapers',
  ],
  'vaultwares-secrets': [
    'VaultWares Secrets',
  ],
  'vaultwares-dns': [
    'VaultWares DNS',
  ],
  'vaultwares-glass': [
    'glass-ui',
  ],
  'vaultwares-dispatch': [
    'dispatch-wares',
  ],
  'vaultwares-decompile': [
    'deconstructed-website-a-la-mode',
  ],
  'vaultwares-website': [
    'vaultwares-v1',
    'vaultwares-website + vaultwares-themes',
  ],
  'vaultwares-identity-manager': [
    'vaultwares-auto-signup',
  ],
};

function applyBuiltinAliases() {
  for (const [canonical, aliases] of Object.entries(BUILTIN_ALIASES)) {
    aliasToCanonical.set(canonical.toLowerCase(), canonical);
    for (const a of aliases) {
      aliasToCanonical.set(a.toLowerCase(), canonical);
    }
    if (!aliasesRecord[canonical]) {
      aliasesRecord[canonical] = aliases;
    }
  }
}

// Seed builtins initially
applyBuiltinAliases();

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
      forkSet.add('onetrainer')
      
      for (const key of Object.keys(aliasesRecord)) {
        delete aliasesRecord[key]
      }
      for (const key of Object.keys(metadataRecord)) {
        delete metadataRecord[key]
      }

      applyBuiltinAliases()

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
        const existing = aliasesRecord[p.canonical] || []
        aliasesRecord[p.canonical] = Array.from(new Set([...existing, ...(p.aliases || [])]))
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

/** Regroup minor kinds into parent semantic kinds */
export function normalizeKind(kind: string): string {
  if (!kind) return 'general';
  const k = kind.toLowerCase().trim();

  // bug & fix clamped together
  if (['bug', 'fix', 'bugfix'].includes(k)) return 'bug';

  // feature separate from code-change
  if (['feature', 'improvement'].includes(k)) return 'feature';

  // brainstorm split from plan
  if (['brainstorm', 'proposal', 'research'].includes(k)) return 'brainstorm';

  // devops: all dev-ops adjacent tasks and commands
  if ([
    'devops', 'dev-ops', 'commands', 'command', 'ops', 'ops-health-probe',
    'infrastructure', 'config', 'deploy', 'deployment', 'release',
    'ui-deploy', 'push', 'db-migration', 'maintenance', 'ci'
  ].includes(k)) return 'devops';

  // code-change
  if (['code-change', 'implementation', 'refactor', 'scaffold'].includes(k)) return 'code-change';

  // plan
  if (['plan', 'planning'].includes(k)) return 'plan';

  // documentation
  if (['documentation', 'docs', 'doc', 'design-doc', 'protocol', 'project-onboarding'].includes(k)) return 'documentation';

  // verification
  if (['verification', 'analysis', 'diagnosis', 'qa-run', 'test', 'audit'].includes(k)) return 'verification';

  // handoff
  if (k === 'handoff') return 'handoff';

  return 'general';
}

/** Clean up and normalize model names */
export function normalizeModel(model: string): string {
  if (!model || model.toLowerCase() === 'unknown' || model.trim() === '') return 'Unknown';
  const m = model.trim();
  const low = m.toLowerCase();

  // GPT models
  if (low === 'gpt-5' || low === 'gpt 5') return 'GPT-5';
  if (low.startsWith('gpt-5.2') || low.startsWith('gpt-5-2')) return 'GPT-5.2';
  if (low.startsWith('gpt-5.6') || low.startsWith('gpt-5-6')) return 'GPT-5.6';
  if (low.includes('codex') && low.includes('gpt-5')) return 'GPT-5 Codex';
  if (low.includes('o3-mini')) return 'o3-mini';

  // Claude models
  if (low.includes('opus-5') || low.includes('opus 5')) return 'Claude Opus 5';
  if (low.includes('opus-4.7') || low.includes('opus-4-7') || low.includes('opus 4.7')) return 'Claude Opus 4.7';
  if (low.includes('opus-4') || low.includes('opus 4')) return 'Claude Opus 4';
  if (low.includes('sonnet-4') || low.includes('sonnet 4')) return 'Claude Sonnet 4';
  if (low.includes('sonnet-3.7') || low.includes('sonnet 3.7')) return 'Claude 3.7 Sonnet';
  if (low.includes('claude-3-5') || low.includes('claude 3.5')) return 'Claude 3.5 Sonnet';

  // Gemini models
  if (low.includes('gemini-3.8') || low.includes('gemini 3.8')) return 'Gemini 3.8 Flash';
  if (low.includes('gemini-3.5') || low.includes('gemini 3.5')) return 'Gemini 3.5 Flash';
  if (low.includes('gemini-3.0') || low.includes('gemini 3.0')) return 'Gemini 3.0 Flash';
  if (low.includes('gemini-2.5-pro') || low.includes('gemini 2.5 pro')) return 'Gemini 2.5 Pro';
  if (low.includes('gemini-2.5-flash') || low.includes('gemini 2.5 flash')) return 'Gemini 2.5 Flash';
  if (low.includes('gemini')) return 'Gemini 3.5 Flash';

  // DeepSeek models
  if (low.includes('deepseek-r1') || low.includes('deepseek r1')) return 'DeepSeek-R1';
  if (low.includes('deepseek-v3') || low.includes('deepseek v3')) return 'DeepSeek-V3';

  return m;
}

/** Clean up and normalize actor names */
export function normalizeActor(actor: string): string {
  if (!actor || actor.trim() === '') return 'AI Agent';
  const a = actor.trim();
  const low = a.toLowerCase();

  // Strip code paths / file names passed as actor
  if (low.endsWith('.js') || low.endsWith('.ts') || low.endsWith('.py') || low.startsWith('src/')) {
    return 'AI Agent';
  }

  if (low.includes('antigravity')) return 'Antigravity';
  if (low.includes('codex')) return 'Codex';
  if (low.includes('copilot')) return 'GitHub Copilot';
  if (low.includes('claude')) return 'Claude Code';
  if (low.includes('cascade')) return 'Cascade';
  if (low.includes('mistral')) return 'Mistral Vibe';
  if (low.includes('mcp')) return 'VaultWares MCP';
  if (low.includes('watchdog')) return 'pg-watchdog';
  if (low.includes('recap')) return 'Daily Ledger Recap';

  return a;
}

/** Clean up and normalize tool names, clamped into semantic groups */
export function normalizeTool(tool: string): string {
  if (!tool) return 'General Tool';
  const t = tool.trim();
  const low = t.toLowerCase();

  // Terminal & Shell Execution
  if ([
    'bash', 'powershell', 'shell', 'run_command', 'shell_command', 'functions.shell_command',
    'exec', 'run_in_terminal', 'mcp__workspace__bash', 'workspace-bash',
    'mcp__windows-mcp__powershell', 'mcp__vaultwares_mcp__mcp_server___sh_run'
  ].includes(low)) return 'Terminal / Shell';

  // File Editing
  if ([
    'edit', 'replace_file_content', 'multi_replace_file_content', 'apply_patch',
    'functions.apply_patch', 'multi_edit', 'replace_string_in_file', 'multi_replace_string_in_file'
  ].includes(low)) return 'Edit File';

  // File Reading
  if (['read', 'view_file', 'read_file', 'fs_read', 'view'].includes(low)) return 'Read File';

  // File Writing & Creation
  if (['write', 'write_to_file', 'create_file', 'fs_write', 'create'].includes(low)) return 'Write File';

  // Search & Grep & Glob
  if ([
    'grep', 'grep_search', 'rg', 'glob', 'code_search', 'find_file_by_name',
    'find_by_name', 'toolsearch', 'tool_search', 'list_dir'
  ].includes(low)) return 'Search / Grep';

  // Tasks & Planning
  if ([
    'taskcreate', 'taskupdate', 'taskstop', 'taskoutput', 'scheduledtask', 'spawn_task',
    'update_plan', 'functions.update_plan', 'exitplanmode', 'todo_write', 'todowrite',
    'todo_list', 'workflow', 'report_progress'
  ].includes(low)) return 'Tasks & Planning';

  // Browser & Web Access
  if ([
    'webfetch', 'websearch', 'search_web', 'read_url_content', 'web', 'web.run',
    'playwright', 'playwright cli', 'playwright-python', 'playwright-electron',
    'browser preview', 'browser verification', 'browser_subagent', 'mcp0_nav_fetch',
    'node_repl browser', 'ui-automation'
  ].includes(low)) return 'Browser & Web';

  // Remote & SSH
  if (['ssh', 'mcp__vaultwares_mcp__mcp_server___ssh_run', 'scp', 'tailscale'].includes(low)) return 'SSH & Remote';

  // Git & VCS
  if ([
    'git', 'gh', 'using-git-worktrees',
    'mcp__codex_apps__github._request_pull_request_reviewers'
  ].includes(low)) return 'Git / GitHub';

  // User Interaction
  if (['askuserquestion', 'ask_user_question', 'ask_question', 'ask_permission', 'senduserfile'].includes(low)) return 'User Interaction';

  // Skills & Subagents
  if (['skill', 'agent', 'spawn-agent', 'run_subagent'].includes(low)) return 'Subagents & Skills';

  // Infra & Database Services
  if (['psql', 'pg_dump', 'pg_isready', 'docker', 'systemctl', 'restart-service'].includes(low)) return 'Infra & Services';

  // Dev Runtimes
  if (['python', 'node', 'node_repl', 'npm', 'pnpm', 'uv', 'dotnet', 'ffmpeg', 'eslint', 'pytest', 'vite', 'datasets', 'robocopy'].includes(low)) return 'Dev Runtimes';

  // Ledger & Telemetry
  if (['ledger_get_recent', 'ledger_search', 'mcp__vaultwares_mcp__mcp_server___ledger_get_recent', 'search_session_transcripts', 'monitor'].includes(low)) return 'Ledger & Telemetry';

  // Artifacts & Previews
  if (['view_image', 'functions.view_image', 'preview_eval', 'preview_inspect', 'preview_start', 'visualize', 'artifact'].includes(low)) return 'Artifacts & Previews';

  return t;
}
