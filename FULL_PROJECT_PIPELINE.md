# FloorPlanTo3D - Complete Project Details and Pipeline

## 1. Project Overview

This project converts a 2D floor plan image into:
- Detection outputs for walls, windows, and doors
- A reconstructed structural wall graph
- A 3D-ready model payload (for Three.js/Open3D style rendering)
- Material recommendations based on cost-strength-durability tradeoffs
- Human-readable explanations for each recommendation

The workspace has two major parts:
- Unity client (visualization/customization side)
- Python API (AI detection + structural pipeline side)

---

## 2. Main Components

### 2.1 Unity Client
Responsibilities:
- Capture/upload floor plan image
- Call API endpoint with multipart image payload
- Render returned detections and/or generated scene data
- Provide customization and interactive viewing

Notable files:
- `Builder.cs` (legacy JSON-based object creation flow)
- `test_client.html` (web viewer test page using Three.js)

### 2.2 Python API
Responsibilities:
- Load Mask R-CNN model and detect plan elements
- Keep backward-compatible response fields for Unity
- Run full 5-stage structural pipeline
- Return both legacy + pipeline outputs in one response

Notable files:
- `FloorPlanTo3D-API/application.py`
- `FloorPlanTo3D-API/structural_pipeline.py`
- `FloorPlanTo3D-API/pipeline/stage_1_floor_plan_parsing.py`
- `FloorPlanTo3D-API/pipeline/stage_2_geometry_reconstruction.py`
- `FloorPlanTo3D-API/pipeline/stage_3_model_generation.py`
- `FloorPlanTo3D-API/pipeline/stage_4_material_tradeoff.py`
- `FloorPlanTo3D-API/pipeline/stage_5_explainability.py`
- `FloorPlanTo3D-API/pipeline/shared.py`

---

## 3. Data Flow (End-to-End)

1. User uploads floor plan image.
2. API validates extension and image readability.
3. Mask R-CNN runs inference and returns bounding boxes + class IDs.
4. API builds legacy fields:
   - `points`
   - `classes`
   - `Width`, `Height`
   - `averageDoor`
5. API executes `run_structural_pipeline(...)`.
6. Pipeline stages 1 to 5 produce structural and recommendation payload.
7. API returns one JSON response containing both legacy and new pipeline sections.

---

## 4. API Contract

## 4.1 Endpoints

### GET /health
Returns service and model status:
- model runtime availability
- whether weights file exists
- whether model is already loaded

### POST /
Input:
- Multipart form-data key: `image`
- Supported extensions: `.png`, `.jpg`, `.jpeg`, `.bmp`, `.webp`

Output includes:
- Legacy Unity-compatible fields (`points`, `classes`, `Width`, `Height`, `averageDoor`)
- `rubric_alignment` metadata
- `pipeline` object with all 5 stages

---

## 5. 5-Stage Pipeline Explained

The orchestrator is `run_structural_pipeline(...)` in `structural_pipeline.py`.

### Stage 1 - Floor Plan Parsing
File: `pipeline/stage_1_floor_plan_parsing.py`

What it does:
- Converts wall detections (ROIs) into snapped line segments
- Converts doors/windows to opening objects
- Merges collinear wall fragments
- Estimates room bounding boxes from wall enclosure grid logic

Important behaviors:
- If no wall detections are available, a synthetic rectangular fallback wall set is created.
- A `fallback_used` flag is set when fallback is used.

Key output fields:
- `walls_detected`, `doors_detected`, `windows_detected`
- `opening_dimensions`
- `rooms_detected`, `rooms`
- `wall_segments`
- `fallback.used`, `fallback.note`

### Stage 2 - Geometry Reconstruction
File: `pipeline/stage_2_geometry_reconstruction.py`

What it does:
- Builds wall graph (nodes + edges) from parsed segments
- Ensures enclosure continuity by adding synthetic boundary edges when side coverage is missing
- Classifies each wall as:
  - `partition_wall`
  - `load_bearing_wall`
  - `long_span` (span > 5m)
- Associates openings (doors/windows) with nearest wall edge

Classification logic summary:
- Outer boundary walls are treated as load-bearing unless span exceeds long-span threshold.
- Span uses pixel-to-meter scale from average detected door width.

Key output fields:
- `wall_graph.nodes`
- `wall_graph.edges`
- `load_bearing_classification`
- `span_analysis` (max, average, threshold)
- `room_extents`

### Stage 3 - Model Generation
File: `pipeline/stage_3_model_generation.py`

What it does:
- Converts geometry stage edges/openings into 3D-ready primitives
- Uses planar XY meter coordinates
- Adds standard wall dimensions and floor slab metadata

Generated 3D payload contains:
- `wall_primitives` (start/end, length, thickness, height)
- `floor_slab`
- `openings`
- `rooms` (filled later in orchestrator)
- `export_hint` (Three.js/Open3D rendering guidance)

### Stage 4 - Material Tradeoff
File: `pipeline/stage_4_material_tradeoff.py`

What it does:
- Scores materials using weighted cost/strength/durability
- Uses element-specific base weights from `pipeline/shared.py`
- Applies dynamic weighting by structural demand level (derived from span)
- Applies contextual and diversity adjustments
- Ranks top recommendations per structural element

Scoring base formula:
- `score = w_cost*cost + w_strength*strength + w_durability*durability`

Element types evaluated:
- `load_bearing_wall`
- `partition_wall`
- `slab`
- `column`
- `long_span`

Returns:
- Ranked `top_recommendations` for each element
- `decision_justification` text
- `structural_concerns` for long spans

### Stage 5 - Explainability
File: `pipeline/stage_5_explainability.py`

What it does:
- Builds an end-to-end decision trace summary
- Summarizes each stage in plain language
- Adds reasons for material choices
- Includes structural concern summary

Returns:
- `decision_trace`
- `material_reasons`
- `final_summary`

---

## 6. Material Database and Weights

Defined in `pipeline/shared.py`.

Includes starter material set such as:
- AAC Blocks
- Red Brick
- RCC
- Steel Frame
- Hollow Concrete Block
- Fly Ash Brick
- Precast Concrete Panel

Weight presets are element-aware, for example:
- Load-bearing walls prioritize strength
- Partition walls prioritize cost
- Long-span zones prioritize strength heavily

---

## 7. Legacy Compatibility Notes

The API intentionally preserves old Unity response fields so existing clients continue to work.

Legacy fields still returned:
- `points`
- `classes`
- `Width`
- `Height`
- `averageDoor`

This allows gradual migration from old client parsing to new `pipeline` consumption.

---

## 8. Setup and Run

## 8.1 API Setup
From workspace root:

1. `cd FloorPlanTo3D-API`
2. `python -m venv .venv`
3. `.venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. Place weights at `FloorPlanTo3D-API/weights/maskrcnn_15_epochs.h5`
6. `python application.py`

Optional environment variables:
- `FP3D_API_HOST`
- `FP3D_API_PORT`
- `FP3D_API_DEBUG`
- `FP3D_WEIGHTS_FILE`

## 8.2 Smoke Test
From workspace root:

1. `python test_upload.py`

## 8.3 Unit Tests

1. `cd FloorPlanTo3D-API`
2. `python -m unittest discover -s tests -p "test_*.py"`

---

## 9. Response Structure Summary

Top-level response sections:
- `points`
- `classes`
- `Width`
- `Height`
- `averageDoor`
- `rubric_alignment`
- `pipeline`

`pipeline` contains exactly:
- `stage_1_floor_plan_parsing`
- `stage_2_geometry_reconstruction`
- `stage_3_model_generation`
- `stage_4_material_tradeoff`
- `stage_5_explainability`

---

## 10. Known Constraints and Assumptions

- Optimized for clean digital orthogonal floor plans.
- Hand-drawn/noisy robustness is not the primary target.
- Long-span threshold is 5.0m.
- Pixel-to-meter scaling is estimated from average detected door size.
- If room extraction fails, wall graph and material stages still proceed.

---

## 11. Practical Pipeline Example (Conceptual)

Given one uploaded plan image:

1. Model detects bounding boxes for walls, doors, windows.
2. Stage 1 merges wall lines and infers rooms.
3. Stage 2 builds structural graph and labels wall behavior.
4. Stage 3 emits 3D wall/opening primitives with metric dimensions.
5. Stage 4 produces ranked material choices per element with justifications.
6. Stage 5 composes clear traceable explanations for the final result.

This is the complete operational pipeline from image to structural recommendation.

---

## 12. File Map for Quick Navigation

- Root docs:
  - `readme.md`
  - `INFO.md`
  - `FULL_PROJECT_PIPELINE.md`
- API core:
  - `FloorPlanTo3D-API/application.py`
  - `FloorPlanTo3D-API/structural_pipeline.py`
- Pipeline internals:
  - `FloorPlanTo3D-API/pipeline/shared.py`
  - `FloorPlanTo3D-API/pipeline/stage_1_floor_plan_parsing.py`
  - `FloorPlanTo3D-API/pipeline/stage_2_geometry_reconstruction.py`
  - `FloorPlanTo3D-API/pipeline/stage_3_model_generation.py`
  - `FloorPlanTo3D-API/pipeline/stage_4_material_tradeoff.py`
  - `FloorPlanTo3D-API/pipeline/stage_5_explainability.py`
- Tests/helpers:
  - `test_upload.py`
  - `test_client.html`

This document is intended as the single consolidated reference for architecture, pipeline logic, and execution steps.
