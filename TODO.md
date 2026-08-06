# vault-monitor — TODO

## AI assistant session stats

The `/api/telemetry/ai-sessions/*` endpoints on vaultwares-api are live and fed
daily by `vw collect-ai-history` (scheduled task `VaultWares-CollectAiHistory`,
05:30). Available now:

| Endpoint | Use |
|---|---|
| `GET /api/telemetry/ai-sessions/summary?days=` | totals + per-tool / per-host / per-model rollups |
| `GET /api/telemetry/ai-sessions/projects?limit=&days=` | which projects consumed the most assistant time |
| `GET /api/telemetry/ai-sessions/timeline?bucket=day\|week\|month&days=` | sessions / messages / tokens per bucket per tool |
| `GET /api/telemetry/ai-sessions/sessions/search?q=&tool=&host=&project=` | free-text over titles and cwd |

Hosts currently reporting: `Clopeux-Desktop`, `Clopeux-Laptop`.

### Caveats to respect when charting

- **Filter on `parser`.** Antigravity and Windsurf records are `metadata-only`
  (see below) — their `message_count` is `NULL`, not zero. Charting them
  alongside full-parse tools understates those tools rather than showing a gap.
- **Codex `tokens_used` is cumulative context, not spend.** Use the
  `input_tokens` / `cached_input_tokens` / `output_tokens` /
  `reasoning_tokens` split instead. As of 2026-08-05 roughly 94% of Codex
  input tokens were cache hits, so a naive total overstates real usage by
  about two orders of magnitude.

## Decode the encrypted conversation stores

Antigravity (`~/.gemini/antigravity*/conversations/*.pb`) and Windsurf Cascade
(`~/.codeium/windsurf/cascade/*.pb`) are **encrypted at rest**, not raw
protobuf — measured entropy is 8.00 bits/byte with per-file random headers, so
`protoc --decode_raw` returns noise. That is why 176 of the collected sessions
carry `parser = "metadata-only"` and contribute no message or token counts.

**Lead:** https://github.com/mjacobs/agy-reader

Prior art that did *not* pan out: `arashz/antigravity_decryptor` is unmaintained
and sources its key only from the **macOS Keychain**
(`security find-generic-password -s 'Antigravity Safe Storage'`). On Windows the
Safe Storage key is DPAPI-encrypted under `os_crypt.encrypted_key` in
`%APPDATA%\Antigravity IDE\Local State`, so any port needs a
`CryptUnprotectData` step before the AES-CTR/CBC/GCM attempts.

Worth checking whether agy-reader already handles the Windows key path. If it
does, the same approach likely unlocks Windsurf too — Antigravity and Windsurf
share the Codeium lineage and the same `.pb` container.

Once decoded, backfill `message_count` / `user_message_count` for those 176
sessions via the existing ingest endpoint; the upsert is idempotent on
`(host, tool, session_id)`, so a re-collect will fill them in place.

Not a priority.
