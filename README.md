# V.A.U.L.T Monitor

V.A.U.L.T Monitor is the Vault Authenticated Unified Ledger Telemetry Monitor: a front-facing dashboard for VaultWares internal ledger and logging systems.

This repo owns UI, routing, view state, and display components only. Normalized data comes from `vaultwares-pipelines`:

- `GET /monitor/overview`
- `GET /monitor/health-ledger`
- `GET /monitor/agent-ledger`
- `GET /monitor/logging/kiwi`
- `GET /monitor/events/search`

`vaultwares-themes` is included as a submodule and supplies the redesign token CSS used by the app.

## Development

```powershell
npm install
npm run dev
```

The Vite dev server proxies `/monitor/*` to `http://127.0.0.1:9001` by default. Override that with `VITE_MONITOR_API_TARGET`.

## Data Boundary

The browser must not read `agent-ledger`, `health-ledger`, or Kiwi data directly. `vaultwares-pipelines` owns adapters and normalization.

The current JSON/JSONL file-backed reads are transitional. `health-ledger`, `agent-ledger`, and Kiwi summaries need durable DB-backed ingestion behind the central API before richer search, alert acknowledgement, or incident actions are added.
