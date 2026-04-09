# ML deployment (Safe Harbor)

Architecture: **sklearn** models saved as `joblib`; **FastAPI** loads them and scores features built by shared **`ml_service`** (same code as training and notebooks). The **.NET** API reads **Azure SQL** via EF Core, forwards JSON to FastAPI **server-side only**, and the React app calls .NET only.

## Folder layout

| Path | Role |
|------|------|
| [`ml_service/`](../ml_service/) | Shared Python: feature builders + constants |
| [`ml_api/`](../ml_api/) | FastAPI inference app |
| [`scripts/`](../scripts/) | `train_*.py` CSV training (TA + CI) |
| [`models/`](../models/) | `*.joblib` artifacts (train to create; may be gitignored) |
| [`ml-pipelines/`](../ml-pipelines/) | Notebooks (executable with repo `data/`) |

## Environment variables

### FastAPI (`ml_api`)

| Variable | Purpose |
|----------|---------|
| `ML_API_KEY` | If set, require header `X-ML-API-Key` on predict routes |
| `MODELS_DIR` | Directory containing `*.joblib` (default: repo `models/`) |

Model files (expected names):

- `donor_churn_rf.joblib` — donor churn (90d horizon, Random Forest)
- `resident_wellbeing_rf.joblib` — bundle `{ pipeline, feature_cols }` from `scripts/train_resident_wellbeing.py`
- `donor_high_value_rf.joblib`, `early_warning_rf.joblib`, `reintegration_rf.joblib`, `social_engagement_rf.joblib` — add when trained

### .NET (`appsettings` / Azure App Settings)

| Key | Purpose |
|-----|---------|
| `Ml:BaseUrl` | FastAPI base URL, e.g. `http://localhost:8010` |
| `Ml:ApiKey` | Shared secret sent as `X-ML-API-Key` |

### Notebooks / training

Use repo `data/` (`./data` or `../data` from `ml-pipelines/`). See [`ml-pipelines/requirements.txt`](../ml-pipelines/requirements.txt).

## HTTP endpoints

### FastAPI (internal)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Liveness |
| GET | `/models` | Which model files are loaded |
| POST | `/predict/donor-churn` | Body: `{ "as_of": "YYYY-MM-DD", "supporters": [ { "supporter_id", "acquisition_channel", ... }, ... ], "donations": [ { "supporter_id", "donation_date", "estimated_value", "campaign_name" }, ... ] }` |
| POST | `/predict/donor-high-value` | Placeholder until artifact exists |
| POST | `/predict/resident-wellbeing` | Body: `as_of` (ISO date, month *m*) + eight lists of raw rows (`health_wellbeing_records`, `process_recordings`, `home_visitations`, `education_records`, `incident_reports`, `intervention_plans`, `residents`, `safehouses`) with the same column names as `data/*.csv`. Returns predicted next-month composite wellbeing per resident for that month. |
| POST | `/predict/early-warning` | Placeholder |
| POST | `/predict/reintegration-readiness` | Placeholder |
| POST | `/predict/social-engagement-donations` | Placeholder |

### .NET (browser-facing)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/Ml/deployment-status` | Aggregates FastAPI `/health` + `/models` |
| GET | `/api/Ml/donor-churn-scores` | Query: `asOf` (optional), `page`, `pageSize` — loads supporters + donations from DB, calls FastAPI |
| GET | `/api/Ml/resident-wellbeing-scores` | Query: `asOf` (optional ISO date, first of feature month *m*; default = first day of latest health record month). Loads all caseload tables from DB, calls FastAPI `POST /predict/resident-wellbeing`. |

## Pipeline → UI page

| Notebook | Page | UI (v1) |
|----------|------|---------|
| `donor_churn_pipeline.ipynb` | `/donors` | Additive ML table + link to ML overview |
| `high_value_donor_profiles.ipynb` | `/donors` | Section when model available |
| `resident_wellbeing_next_month.ipynb` | `/caseload` | ML insights panel |
| `early_warning_incident_next_month.ipynb` | `/caseload` | ML insights panel |
| `reintegration_readiness_next_month.ipynb` | `/caseload` | ML insights panel |
| `social_media_engagement_to_donations.ipynb` | `/social` | ML KPI block |

## Local run (quick)

```bash
# Terminal 1 — train donor churn (from repo root, requires data/)
pip install -r ml-pipelines/requirements.txt
python scripts/train_donor_churn.py

# Train resident wellbeing (same data/ CSVs)
python scripts/train_resident_wellbeing.py

# Terminal 2 — ML API
pip install -r ml_api/requirements.txt
cd ml_api && uvicorn main:app --host 0.0.0.0 --port 8010

# Terminal 3 — .NET: set Ml:BaseUrl in appsettings.Development.json
cd backend/backend && dotnet run

# Terminal 4 — frontend
cd frontend && npm run dev
```

## Grader quick path

1. Open **`/admin/ml-integration`** — confirm rows and green/amber/red status.
2. Open **`/donors`** — “Live ML — donor churn” section shows scores when ML + DB are up.
3. Open **`/caseload`** and **`/social`** — ML panels (may show “unavailable” until models exist).

## Nightly retraining (phase 2)

Not automated in repo by default. Recommended pattern:

1. **Trigger:** Azure Functions timer, Container Apps job, or GitHub Actions `schedule`.
2. **Data:** Export from Azure SQL to Parquet/CSV, or `pandas.read_sql` with read-only credentials.
3. **Train:** Run `scripts/train_*.py` (same `ml_service` as inference).
4. **Publish:** Upload new `joblib` to Blob or shared disk; restart ML service or swap `MODELS_DIR` version path.

Document rollback by keeping the previous artifact.

## Security

- Do not expose FastAPI publicly without `ML_API_KEY` and network restriction (VNet / private endpoint).
- Do not put connection strings or model files in the frontend bundle.
