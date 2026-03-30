# Autonomous Structural Intelligence System

*AI-powered floor plan understanding, structural geometry reconstruction, 3D-ready primitives, material tradeoff scoring, and explainable recommendations—with optional on-chain audit via Soroban.*

### PS 2 · AI/ML Track · Hackathon 2026

---

## 1. Project Title

The project name is the document title above. One-line positioning:

*Mask R–CNN floor plan parsing, wall-graph reconstruction, Three.js visualization, and ranked material recommendations with plain-language justification.*

---

## 2. Project Description

Upload an orthogonal floor plan image and the system returns a single JSON payload that includes instance detections (walls, doors, windows), a merged wall-and-opening interpretation, a geometric wall graph with load-bearing heuristics, extruded 3D primitives suitable for a browser viewer, ranked materials per structural element, and a step-by-step **decision trace** a contractor can read without opening a CAD tool.

The vision stack is **Mask R-CNN** (Matterport implementation) trained for floor-plan classes; downstream stages are deterministic Python geometry and scoring executed in `FloorPlanTo3D-API`.

For architects and estimators, ASIS collapses “trace the plan, guess spans, and argue materials in email” into one reproducible pass: same image, same numbers, same ranked options—optionally anchored on **Stellar testnet** when Web3 is enabled.

---

## 3. Project Vision

In two years this matures into a **planning copilot**: paste a PDF or phone photo of a working drawing, get code-aware structural narratives, quantity hints, and cost-aware material shortlists tied to supplier data. The wedge is **democratised structural intelligence**—smaller firms get senior-reviewer-style scrutiny in minutes—and **faster, defensible bids** because estimators start from a graph + rationale instead of a blank spreadsheet.

Long term, repeatable **on-chain attestations** (hash of the plan + summary of recommendations) become a lightweight notarisation layer for tender packets and handover audits.

---

## 4. Key Features

- **Floor plan parsing (Stage 1)** — Mask R-CNN ROI outputs merged into wall segments and openings; orthogonal room envelopes via grid flood-fill when walls form closed regions; fallback perimeter rectangle if detections are sparse.
- **Geometry reconstruction (Stage 2)** — Wall graph (`nodes` = junctions, `edges` = segments); perimeter coverage heuristics; load-bearing vs partition candidates and span-driven **long-span** flags.
- **2D → 3D model generation (Stage 3)** — `wall_primitives` and opening boxes with metre scale from door width calibration (~0.9 m); exports align with **Three.js** mesh construction in `templates/index.html` and `test_client.html`.
- **Material recommendation (Stage 4)** — Weighted **cost × strength × durability** scoring, dynamic weights by element type and span demand, `best_use` suitability bonus, context and diversity adjustments; top‑k lists with **tradeoff_explanation** strings.
- **Explainability (Stage 5)** — Structured **decision_trace** summarising each stage (counts, graph size, primitive counts, material headline)—no black-box LLM required for the rubric.
- **Web3 (bonus)** — After `POST /`, optional `store_analysis` on **Soroban** via `web3_bridge.py`; `test_client.html` surfaces chain metadata when present.
- **Unity client (optional)** — `Assets/`, `ProjectSettings/`, and root C# helpers for the original FloorPlanTo3D-style in-editor experience.

---

## 5. Tech Stack

| Tool | Purpose |
|------|---------|
| TensorFlow 1.x + Keras | Mask R-CNN inference (walls / windows / doors) in the Flask API |
| Matterport `mrcnn` | Model config, `MaskRCNN`, and image moulding |
| NumPy | Array math for masks and geometry helpers |
| Pillow | Image load/decode for uploads |
| scikit-image / matplotlib | Utilities bundled with the upstream FloorPlanTo3D API stack |
| Flask + flask-cors | REST API, CORS for browser clients |
| Three.js (r128, CDN) | Browser 3D viewer in API template + `test_client.html` |
| stellar-sdk (Python 3.8+) | Optional Soroban `ContractClient` submissions |
| Soroban SDK (Rust) | Smart contract in `contracts/asis-registry` |
| Docker / docker-compose | Optional one-command API runtime with pinned ML image |
| Unity Editor | Optional rich client under `Assets/` |

*Note:* Runtime material rows are defined in `FloorPlanTo3D-API/pipeline/shared.py` (`MATERIAL_DB`). `materials_db.json` at repo root mirrors that list for reviewers and should be kept in sync if you edit materials.

---

## 6. Pipeline Architecture

1. **Stage 1 — Floor plan parsing** — Class ROIs → merged segments; openings typed as door/window; rooms from wall enclosure or fallback boundary.
2. **Stage 2 — Geometry reconstruction** — Snap nodes, build edges, classify structural role, estimate spans and long-span zones.
3. **Stage 3 — 2D → 3D model generation** — Emit extrusion-ready segments and opening solids in metres for WebGL.
4. **Stage 4 — Material analysis & tradeoff scoring** — Score catalogue rows per element with adjustable weights and narrative explanations.
5. **Stage 5 — Explainability output** — Human-readable trace tying stages together for judges and site engineers.

Architecture diagram (add your team’s diagram before submission):

![Architecture Diagram](./assets/architecture_diagram.png)

*Screenshot placeholder — add `assets/architecture_diagram.png` before final submission.*

---

## 7. Screenshots & Demo

#### 7a. Input Floor Plan

![Input Floor Plan](./assets/floorplan_B.png)

*Caption: Plan B — primary evaluation-style sample (`example2.png` via `floorplan_B.png` symlink).*

#### 7b. Parsed Output (Wall & Room Detection)

![Parsed Floor Plan](./assets/parsed_output.png)

*Caption: Overlay or API debug view showing merged walls, inferred rooms, and openings (add `parsed_output.png` before submission).*

#### 7c. 3D Model — Browser View

![3D Model](./assets/3d_model_screenshot.png)

*Caption: Three.js render from `templates/index.html` or `test_client.html` after upload (add `3d_model_screenshot.png`).*

#### 7d. Material Recommendation Output

![Material Output](./assets/material_output.png)

*Caption: Ranked options per element from `stage_4_material_tradeoff` (add `material_output.png`).*

#### 7e. Explainability Panel

![Explainability](./assets/explainability_output.png)

*Caption: Decision trace / Web3 panel from API JSON (add `explainability_output.png`).*

---

## 8. Demo Video (Optional)

[![Demo Video](./assets/demo_thumbnail.png)](https://YOUR_YOUTUBE_OR_LOOM_LINK_HERE)

*Click the thumbnail above to watch the full demo.*

Demo link (replace when ready): `https://your-demo-link-here.com`

---

## 9. Project Setup Guide

Assume **Python** is installed. The Mask R-CNN stack is easiest via **Docker**; native installs typically need Python 3.6–3.7 with TensorFlow 1.15 (see `FloorPlanTo3D-API/requirements.txt` markers).

### Prerequisites

- Python **3.8+** on the host for `main.py` / `test_upload.py` and for `stellar-sdk` (Web3).
- **Docker** + Docker Compose (recommended for the ML API image).
- A modern **browser** (Chrome recommended for WebGL).
- **Node.js** is *not* required for the bundled viewer (Three.js loads from CDN).

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/06piyush13/Autonomous-Structural-Intelligence-System.git
cd Autonomous-Structural-Intelligence-System

# 2. Python deps (API + requests for CLI smoke tests)
pip install -r requirements.txt

# 3. Model weights — place maskrcnn_15_epochs.h5 under FloorPlanTo3D-API/weights/
#    See FloorPlanTo3D-API/weights/README.md
```

### Running the API

**Option A — Docker**

```bash
docker compose up --build
```

**Option B — Local (after satisfying TensorFlow / mrcnn constraints)**

```bash
cd FloorPlanTo3D-API
python application.py
# Health: curl http://127.0.0.1:5000/health
```

### Running the full pipeline (HTTP)

With the API listening on port **5000**:

```bash
# From repo root
python main.py --input assets/floorplan_B.png --json-out out.json
```

Equivalent smoke test:

```bash
python test_upload.py
```

The five stages are **not** separate OS processes—they run in order inside `run_structural_pipeline()` when the API handles an upload. To inspect or debug an individual stage, import the module from `FloorPlanTo3D-API`:

```bash
cd FloorPlanTo3D-API
python -c "import pipeline.stage_1_floor_plan_parsing as s; print(s.__doc__ or 'stage_1')"
# … repeat for stage_2_geometry_reconstruction, stage_3_model_generation, stage_4_material_tradeoff, stage_5_explainability
```

### Viewing the 3D model

1. Start the API (`application.py` or Docker).
2. Open `http://127.0.0.1:5000/` — the Flask app serves `templates/index.html` with the Three.js viewer.
3. Or open `test_client.html` locally and point it at the same API origin if you embed the correct URL in the fetch calls (default assumes `localhost:5000`).

*There is no `npm run dev` in this repo; the viewer is static HTML + CDN Three.js.*

### Environment Variables

Copy **`.env.example`** → **`.env`** at the repo root (never commit secrets). See **`web3.md`** for Soroban variables:

```bash
CONTRACT_ID=CBBEKEWTG0JUNLLANUQJV22PWCR26YDB2REA6TLTWBE5PMOLGDVURIQH
STELLAR_SECRET_KEY=
WEB3_ENABLED=1
# Optional: SOROBAN_RPC_URL, WEB3_ASYNC
```

---

## 10. Folder Structure

```
Autonomous-Structural-Intelligence-System/
├── assets/                         # Sample / promo images & submission screenshots
│   ├── floorplan_A.png             # → example1.png
│   ├── floorplan_B.png             # → example2.png
│   ├── floorplan_C.png             # → handDrawn.png
│   └── architecture_diagram.png    # add before submission
├── contracts/
│   └── asis-registry/                # Soroban contract (Rust)
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── FloorPlanTo3D-API/              # Flask + Mask R-CNN + five-stage pipeline
│   ├── application.py
│   ├── structural_pipeline.py
│   ├── web3_bridge.py
│   ├── pipeline/
│   │   ├── stage_1_floor_plan_parsing.py
│   │   ├── stage_2_geometry_reconstruction.py
│   │   ├── stage_3_model_generation.py
│   │   ├── stage_4_material_tradeoff.py
│   │   └── stage_5_explainability.py
│   ├── templates/
│   │   └── index.html              # Three.js viewer (CDN)
│   └── weights/
├── Assets/                         # Unity project assets (optional client)
├── ProjectSettings/
├── Packages/
├── materials_db.json               # Material catalogue mirror for reviewers
├── main.py                         # CLI: POST image to API, print stage summary
├── test_upload.py                  # Minimal requests smoke test
├── test_client.html                # Standalone browser demo + Web3 panel
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## 11. Web3 / Blockchain Integration

### Deployed Contract Details

| Field | Value |
|-------|-------|
| Network | Stellar Testnet (Soroban) |
| Contract ID | `CBBEKEWTG0JUNLLANUQJV22PWCR26YDB2REA6TLTWBE5PMOLGDVURIQH` |
| Deployed by | `asis-deployer` |
| Transaction Hash | `62ad664ca7c84ac14753f812a0830222ea660bbd218d68806709cfbeb02944af` |
| Alias | `asis-structural-analysis` |

### Block Explorer Screenshot

![Block Explorer](./assets/blockexplorer_screenshot.png)

*Caption: Soroban contract on Stellar Testnet — contract ID visible (add `blockexplorer_screenshot.png`).*

### How it integrates with the pipeline

Each successful analysis can compute a **SHA-256** of the uploaded image and call **`store_analysis`** on the deployed contract so the **plan hash**, structural counters, and top material summary become **tamper-evident**. The Flask response includes a `web3` object; `test_client.html` shows verification state and links to **Stellar Expert** when `explorer_tx_url` is populated—so a third party can confirm the PDF or PNG the client saw matches what was attested on-chain.

---

## 12. Material Tradeoff Formula

Base score per material (before ranking tweaks):

```
score = w_cost · ĉ + w_strength · ŝ + w_durability · d̂
```

Where `ĉ`, `ŝ`, `d̂` are **normalised desirability** in \([0,1]\) from discrete labels (`Low` … `Very High` cost/strength/durability maps in `shared.py`), and **`(w_cost, w_strength, w_durability)`** are **dynamic weights** from `_dynamic_weights()` in `stage_4_material_tradeoff.py` (element type baseline from `WEIGHTS`, then span-demand nudges).

The **adjusted ranking score** used to sort candidates is:

```
adjusted = score
         + 0.12  (if material.best_use matches element type)
         + context_adjustment(element, span, material name)
         + diversity_adjustment(usage count)
```

`context_adjustment` rewards materials that fit high-span load-bearing behaviour and penalises poor fits; `diversity_adjustment` gently spreads recommendations across the catalogue so every wall does not collapse to a single product name.

---

## 13. Known Limitations

- Parsing quality follows **Mask R-CNN** ROI quality; faint lines, skewed scans, or non-orthogonal sketches degrade wall merges and room flooding.
- **3D height** is rule-based (e.g. door/window assumptions in pipeline output), not read from title-block text.
- **Load-bearing classification** is heuristic (graph topology + span), not a full finite-element solve.
- **`materials_db.json` / `MATERIAL_DB`** are static label sets; no live INR/USD feeds yet.
- **Web3** requires Python **3.8+** for `stellar-sdk`; the Docker ML image may be **3.7** only—run chain calls from the host or split services per `web3.md`.

---

## 14. Future Scope

- Integrate **live material quotes** (IndiaMART, TradeIndia, or vendor CSV ingests) and replace static cost bands.
- Add **multi-storey** detection (repeat footprints, stair cores) and vertical load paths.
- Export **PDF bid packs**: graph thumbnail, material table, and decision trace.
- Fine-tune or replace Mask R-CNN with a **floor-plan-specific** detector trained on local codes and hatch conventions.
- **PWA / mobile** viewer for site walks with offline cached models.
- Optional **LLM** layer strictly for stylistic rewriting while keeping numeric scores canonical.

---

## 15. Team

| Name | Role |
|------|------|
| Piyush Chandrakar | CV pipeline, API integration, Soroban wiring |
| Tejas Dungarwal | Three.js / 3D viewer and scene scaling |
| Aryan Jain | Material tradeoff engine, scoring narratives |
| Surbhi Singh | Frontend polish, demo flow, presentation |

---

## 16. Acknowledgements

- **FloorPlanTo3D** / **Mask R-CNN (Matterport)** for the segmentation baseline and API shape we extended.
- **Cubicasa5K** and related community work that established floor-plan instance segmentation practice.
- **Stellar Development Foundation** tooling (Stellar CLI, Soroban) for testnet deployment.
- **Open-source** NumPy, Pillow, Flask, Three.js contributors.

---

## Final Checklist Before Submission

```
[ ] All 5 pipeline stages are described
[ ] At least 4 screenshots are present and render correctly
[ ] Architecture diagram is included
[ ] Setup instructions actually work (test them!)
[ ] .env.example is present (never commit real API keys or secret keys)
[ ] Contract ID and block explorer screenshot added (if Web3 bonus)
[ ] Folder structure is clean — no __pycache__, .env, or node_modules committed
[ ] README does not contain phrases like "As an AI language model..." or "Certainly!"
[ ] README does not contain raw JSON, stack traces, or debug output
[ ] Image paths are correct relative to repo root
```

---

*Instructions version: Hackathon 2026 · PS 2 · ASIS*
