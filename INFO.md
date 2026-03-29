# 🏗️ INFO.md — PS 2: Autonomous Structural Intelligence System (ASIS)
> Hackathon 2026 · AI/ML Track · 36 Hours · 100 Marks + 25 Web3 Bonus

---

## 📌 Problem Statement Summary

Build an **end-to-end AI pipeline** that:
1. **Reads** a floor plan image (OpenCV)
2. **Reconstructs** it as a 3D structural model (Three.js / Open3D)
3. **Recommends** optimal construction materials with cost–strength tradeoff analysis
4. **Explains** every decision in plain English (LLM-generated)

> "Build an AI system that reads a floor plan, builds it in 3D, and tells you exactly what to construct it with — and why."

---

## 🗂️ The 5-Stage Mandatory Pipeline

| Stage | Name | Key Output |
|-------|------|------------|
| 01 | Floor Plan Parsing | Wall segments, room polygons, door/window openings with coordinates |
| 02 | Geometry Reconstruction | Wall graph (nodes = corners, edges = walls), load-bearing classification |
| 03 | 2D → 3D Model Generation | Viewable 3D model (Three.js browser render or .obj/.glb export) |
| 04 | Material Analysis & Tradeoff | Ranked material options per element with weighted score |
| 05 | Explainability | Plain-English LLM summary of decisions, tradeoffs, and structural concerns |

---

## 🧪 Test Inputs

| Plan | Layout | Description | Eval Weight |
|------|--------|-------------|-------------|
| A | 2BR / 1BA | Simple rectangular | Baseline |
| B | 4BR / 3BA | Multi-room + kitchen, laundry, foyer | **PRIMARY EVAL** |
| C | 3BR / 2BA | L-shaped outline | Stretch / bonus |

- You receive all 3 plans **12 hours before** the hackathon starts
- **Plan B is the one judges score hardest on — optimize for it first**
- Plan C (L-shape) tests your geometry edge case handling

---

## 🧱 Starter Material Database

| Material | Cost | Strength | Durability | Best Use |
|----------|------|----------|------------|----------|
| AAC Blocks | Low | Medium | High | Partition walls |
| Red Brick | Medium | High | Medium | Load-bearing walls |
| RCC | High | Very High | Very High | Columns, slabs |
| Steel Frame | High | Very High | Very High | Long spans (>5m) |
| Hollow Concrete Block | Low–Med | Medium | Medium | Non-structural walls |
| Fly Ash Brick | Low | Medium–High | High | General walling |
| Precast Concrete Panel | Med–High | High | Very High | Structural walls, slabs |

> You **must** use this as your base and may extend it with additional materials or live pricing APIs.

---

## 📊 Scoring Rubric (100 Marks)

| Criterion | Marks | What Judges Look For |
|-----------|-------|----------------------|
| Floor Plan Parsing | 20 | Wall/room/opening detection accuracy on all 3 test inputs |
| 2D → 3D Model | 25 | Structural correctness + all rooms present + must be viewable |
| Material Analysis & Tradeoff Logic | 25 | Correct formula, justified per element type, ranked options |
| Explainability | 20 | Evidence-backed, readable by non-expert, cites geometry |
| System Integration & Demo Quality | 10 | End-to-end pipeline, handles edge cases, clean presentation |

---

## 🏆 WINNING STRATEGY

### Phase 0 — Pre-Hackathon (Use the 12-Hour Head Start)
- [ ] Download all 3 floor plan images the moment they're released
- [ ] Run OpenCV experiments on Plan A immediately — get line detection working
- [ ] Map out pixel-to-meter scale from the scale bar in the images
- [ ] Prototype the geometry graph structure (nodes + edges) on paper
- [ ] Set up your Ubuntu 22.04 dev environment (see setup section below)
- [ ] Pre-write the material scoring formula and test it with dummy data
- [ ] Draft your LLM system prompt for the explainability stage

### Phase 1 — Hours 0–8: Core Parser + 3D (Highest ROI)
**Goal: Get Plan A working end-to-end before anything else.**

```
Hour 0–1:  Project scaffold, conda env, folder structure, GitHub repo
Hour 1–4:  Stage 1 — OpenCV wall/room detection on Plan A
Hour 4–6:  Stage 2 — Geometry graph, load-bearing classification
Hour 6–8:  Stage 3 — Three.js 3D extrusion, browser viewer working
```

**Do NOT move on until you have a viewable 3D model for Plan A.**
The 3D stage is worth 25 marks and is the most visually impressive demo moment.

### Phase 2 — Hours 8–20: Material Engine + Explainability
```
Hour 8–12:  Stage 4 — Material database, tradeoff scoring formula, ranked output
Hour 12–16: Stage 5 — LLM integration for explanations (use structured prompts)
Hour 16–20: Run all 3 plans through the full pipeline, fix failures
```

### Phase 3 — Hours 20–30: Robustness + Optional Extensions
```
Hour 20–24: Handle Plan C (L-shaped) — fix polygon extraction for non-rectangular
Hour 24–26: Add 1–2 optional extensions (see below for highest-value picks)
Hour 26–28: Stress test all 3 plans 3x each, fix every crash
Hour 28–30: Freeze code, write README, draw architecture diagram
```

### Phase 4 — Hours 30–36: Demo Prep
```
Hour 30–33: Build clean demo flow (Plan A → B → C progression)
Hour 33–35: 5-min presentation script, judge Q&A rehearsal
Hour 35–36: Fallback: record demo video as backup
```

---

## 🎯 High-Value Optional Extensions (Pick These First)

These give the best marks-per-hour ratio:

1. **Structural Validation Rules** — detect large unsupported spans (>5m triggers Steel Frame recommendation), flag missing columns. Easy to implement with span length calculations from your geometry graph.

2. **Cost Breakdown Report (PDF export)** — generate a line-item estimate. Judges love deliverables they can hold. Use `reportlab` or `fpdf2`.

3. **Layout Optimisation Suggestions** — LLM suggests material substitutions to reduce cost. Very low implementation effort with a good prompt.

Skip for now:
- Multi-storey (too much time)
- Real-time pricing API (fragile, can break demo)
- Full noisy input robustness (not mandatory, high effort)

---

## ⚠️ Hidden Traps & How to Beat Them

| Trap | Judge Tests | Your Defense |
|------|-------------|--------------|
| **Non-90° layouts** | Plan C has angular deviations | Use `approxPolyDP` in OpenCV + tolerance snapping (±5°) |
| **Junction detection** | T vs L corners misclassified → open rooms | Use contour hierarchy + corner clustering (`DBSCAN` or simple distance threshold) |
| **3D handoff quality** | Offset coords → floating walls | Round all coordinates to nearest 0.5m before extruding |
| **Load-bearing classification** | "Outer walls only" rule fails | Implement: outer walls + any wall spanning >60% of floor width = load-bearing |
| **Material tradeoff formula** | Equal weighting = poor score | Use element-type-specific weights (see formula below) |
| **Explainability depth** | Generic LLM output = poor score | Force structured output with specific fields (span, element type, score delta) |

---

## 🧮 Material Tradeoff Formula (Don't Use Equal Weights)

```python
# Score mappings
COST_SCORE    = {"Low": 1.0, "Low-Med": 0.75, "Medium": 0.5, "Med-High": 0.25, "High": 0.0}
STR_SCORE     = {"Medium": 0.5, "Medium-High": 0.65, "High": 0.8, "Very High": 1.0}
DUR_SCORE     = {"Medium": 0.5, "High": 0.8, "Very High": 1.0}

# Element-specific weights: (cost_weight, strength_weight, durability_weight)
WEIGHTS = {
    "load_bearing_wall":  (0.2, 0.5, 0.3),   # strength matters most
    "partition_wall":     (0.5, 0.2, 0.3),   # cost matters most
    "slab":               (0.2, 0.4, 0.4),   # durability + strength
    "column":             (0.1, 0.6, 0.3),   # max strength
    "long_span":          (0.2, 0.6, 0.2),   # strength critical (>5m → Steel)
}

def tradeoff_score(material, element_type):
    cw, sw, dw = WEIGHTS[element_type]
    return (
        cw * COST_SCORE[material["cost"]] +
        sw * STR_SCORE[material["strength"]] +
        dw * DUR_SCORE[material["durability"]]
    )
```

**Always present top 3 materials per element, ranked by score.**

---

## 🤖 LLM Explainability — Prompt Template

```python
EXPLAIN_PROMPT = """
You are a structural engineering assistant. Explain the following material recommendation
to a non-expert client.

Element: {element_type}
Location: {location_description}
Span: {span_meters}m
Top recommendation: {material_name} (score: {score:.2f})
Alternatives considered: {alt1}, {alt2}
Reason for recommendation: cost weight={cw}, strength weight={sw}, durability weight={dw}

Write 2-3 sentences. Cite the span measurement and the element type.
Mention one tradeoff (e.g., cost vs strength) explicitly.
Do NOT use filler phrases like "great choice" or "is recommended because it is good."
"""
```

This forces specific, evidence-backed output that scores well on the Explainability rubric.

---

## 🖥️ Ubuntu 22.04 Dev Environment Setup

```bash
# 1. Python environment
sudo apt update && sudo apt install -y python3.11 python3.11-venv python3-pip
python3.11 -m venv .venv && source .venv/bin/activate

# 2. Core CV + geometry stack
pip install opencv-python-headless numpy shapely scipy scikit-image

# 3. LLM
pip install openai anthropic  # use whichever API you have keys for

# 4. 3D export (optional Open3D path)
pip install open3d

# 5. PDF report generation (optional extension)
pip install fpdf2 reportlab

# 6. Web server for Three.js viewer
pip install fastapi uvicorn jinja2 python-multipart

# 7. Data handling
pip install pandas pydantic

# 8. Node.js for Three.js (if building standalone viewer)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Folder Structure
```
asis/
├── pipeline/
│   ├── stage1_parser.py          # OpenCV wall/room detection
│   ├── stage2_geometry.py        # Graph reconstruction, load-bearing
│   ├── stage3_model.py           # 3D extrusion, Three.js data export
│   ├── stage4_materials.py       # Tradeoff scoring, ranked recommendations
│   └── stage5_explain.py         # LLM explanation generation
├── viewer/
│   ├── index.html                # Three.js browser viewer
│   └── static/
├── api/
│   └── main.py                   # FastAPI server (upload image → full pipeline)
├── data/
│   ├── materials.json            # Starter material database
│   ├── floor_plans/              # Plan A, B, C images
│   └── outputs/                  # Per-run JSON + 3D data
├── reports/
│   └── cost_breakdown.py         # Optional PDF export
├── tests/
│   └── test_all_plans.py         # Run all 3 plans, assert no crashes
├── architecture_diagram.png
└── README.md
```

---

## 🔧 Stage 1 — OpenCV Parser Starter Logic

```python
import cv2
import numpy as np
from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

def parse_floor_plan(image_path: str) -> dict:
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Binarize
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

    # Detect walls via HoughLinesP
    edges = cv2.Canny(binary, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=80,
                             minLineLength=40, maxLineGap=10)

    # Snap to orthogonal grid (±5° tolerance)
    h, w = img.shape[:2]
    walls = []
    for line in (lines or []):
        x1, y1, x2, y2 = line[0]
        angle = np.degrees(np.arctan2(abs(y2-y1), abs(x2-x1)))
        if angle < 5:    walls.append({"type": "horizontal", "coords": [x1,y1,x2,y2]})
        elif angle > 85: walls.append({"type": "vertical",   "coords": [x1,y1,x2,y2]})

    # Extract room contours
    contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE,
                                            cv2.CHAIN_APPROX_SIMPLE)
    rooms = []
    min_area = (h * w) * 0.01   # ignore tiny noise contours
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > min_area:
            approx = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
            rooms.append(approx.reshape(-1, 2).tolist())

    return {"walls": walls, "rooms": rooms, "image_size": [w, h]}
```

---

## 🏗️ Stage 3 — Three.js Viewer Integration

Export geometry as JSON from Python, render in browser:

```python
def export_threejs_json(walls, rooms, floor_height=3.0) -> dict:
    """Convert 2D geometry to Three.js-compatible 3D data."""
    geometries = []
    for wall in walls:
        x1, y1, x2, y2 = wall["coords"]
        length = ((x2-x1)**2 + (y2-y1)**2) ** 0.5
        geometries.append({
            "type": "wall",
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "height": floor_height,
            "thickness": 0.2,
            "is_load_bearing": wall.get("is_load_bearing", False)
        })
    return {"walls": geometries, "scale": 0.01}  # pixels → meters
```

In `viewer/index.html`, use Three.js `BoxGeometry` to extrude each wall segment.
Load-bearing walls render in a different color for visual clarity.

---

## 📋 Demo Script (5 Minutes)

```
[0:00] Hook — "In 5 minutes you will see an AI read a floor plan 
        and become a structural engineer."

[0:30] Show Plan B image → click Upload

[1:00] Show Stage 1 output — detected walls overlay on image

[1:30] Show Stage 2 — load-bearing vs partition wall classification

[2:00] Rotate the live 3D model in the browser

[2:45] Show material recommendations table — top 3 per element with scores

[3:30] Read aloud one LLM explanation — point out span citation

[4:00] Run Plan C (L-shaped) — show it works

[4:30] Show optional extension (PDF report or structural validation)

[5:00] "Questions?"
```

**Practice this 3x before the judging session.**

---

## 📝 README Sections (Required for Submission)

- [ ] Project Title & Description
- [ ] Architecture Diagram (export from draw.io or Excalidraw)
- [ ] Setup Instructions (single `pip install -r requirements.txt` + `uvicorn api.main:app`)
- [ ] Pipeline walkthrough with screenshots
- [ ] Material scoring formula explanation
- [ ] Sample output screenshots (all 3 plans)
- [ ] Future Scope section

---

## 🌐 Web3 Bonus (Optional +25 Marks)

**Meaningful integration idea for ASIS:**
> Deploy a Soroban smart contract that **records material recommendations on-chain** per floor plan hash. Architects can verify the AI's recommendation history is immutable. Frontend lets user query past recommendations by plan hash.

This is "meaningful" because it connects directly to the pipeline output — not just storing a random log.

**Stack:** React + Tailwind (frontend) · Soroban (Rust smart contract) · Stellar-SDK (integration)
**Submit at:** https://www.risein.com/programs/hackathon-project-submission-stellar?referral=JEtvo

---

## ✅ Final Checklist Before Judging

- [ ] All 3 plans run end-to-end without crashing
- [ ] 3D model is viewable in browser (no local file path issues)
- [ ] Material recommendations show ranked table with scores, not just 1 option
- [ ] LLM explanations cite span measurements and element type — not generic
- [ ] Architecture diagram committed to repo
- [ ] README complete with setup guide
- [ ] Fallback recorded demo video ready
- [ ] If using manual coordinates fallback — disclosure slide prepared
- [ ] GitHub repo is public and link is ready to share

---

*"That is what separates a script from an agent, and a parser from an engineer."*
*— Hackathon 2026 Compendium*