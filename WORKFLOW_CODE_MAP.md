# FloorPlanTo3D Workflow and Code Map

This document explains the end-to-end workflow of the project, which code handles each step, and how material selection works.

## 1) Big Picture Workflow

The project has two major parts:

1. Unity client: captures or loads a floor plan image, sends it to the API, and builds an interactive 3D scene.
2. Python API: runs detection + structural pipeline and returns JSON with geometry and material recommendations.

High-level flow:

1. User captures/loads a floor plan in Unity.
2. Unity sends image as multipart form data to API endpoint POST /.
3. API runs Mask R-CNN detection (wall/window/door).
4. API converts detections to legacy Unity fields and runs 5-stage structural pipeline.
5. API returns JSON response.
6. Unity Builder parses JSON and instantiates wall, door, and window objects.
7. User can scale, customize, paint, and furnish the generated layout.

## 2) Unity Side: Which Code Does What

### 2.1 Send Image to API

- File: Assets/scripts/Analyze.cs
- Main responsibilities:
  - Reads image either from camera (SnappingImage.webCamTexture) or loaded image (Kakera.ImageLoader.tex).
  - Converts image to PNG bytes.
  - Sends POST request to http://localhost:5000 with multipart key image.
  - Stores API JSON response in Analyze.data.
  - Creates Builder object when user proceeds.

Key method flow:
- sendToServer() / sendToServerLoadedImage() -> Upload(bool) coroutine -> UnityWebRequest.Post(...) -> response stored in Analyze.data.

### 2.2 Build Scene from API JSON

- File: Assets/scripts/Builder.cs
- Main responsibilities:
  - Parses Analyze.data JSON fields:
    - points (bounding boxes)
    - classes (wall/door/window labels)
    - averageDoor (scale estimation)
  - Initializes scale from averageDoor:
    - xScale = 1 / averageDoor
    - yScale = 1 / averageDoor
  - Instantiates GameObjects for walls first, then doors/windows.
  - Adds component scripts based on class:
    - WallMesh for wall
    - Door for door
    - Window for window

Important detail:
- Scene generation currently uses legacy API fields points/classes/averageDoor.
- New 5-stage pipeline data is returned too, but this Unity builder does not consume it yet.

### 2.3 Wall Geometry + Paint Anchor Points

- File: Assets/scripts/WallMesh.cs
- Main responsibilities:
  - Creates cube primitive for each wall.
  - Sets orientation (horizontal/vertical), scale, and position from detected coordinates.
  - Adds colliders/rigidbody.
  - Creates many small helper points tagged wallPaperr along wall faces (front/back) for painting selection.
  - Assigns a sequential WallPaper id to each helper point.

### 2.4 Door/Window Geometry

- Files:
  - Assets/scripts/Door.cs
  - Assets/scripts/Window.cs
- Main responsibilities:
  - Loads prefabs from Resources (Door, windowWall, and optional alternate door names).
  - Rotates/scales/positions prefabs based on detected bounding box + global scaling.
  - Adds colliders/rigidbody and gap-helper scripts (Door uses WindowGaps currently).

### 2.5 Scale Calibration and Regeneration

- File: Assets/scripts/MenuFunc.cs
- Main responsibilities:
  - Lets user draw a reference distance and enter real-world value.
  - Recomputes Builder.xScale and Builder.yScale.
  - Rebuilds wall/door/window transforms and wall paint points after scaling.
  - Contains resetScale() to return to original scale.

### 2.6 Visual Customization (Wall/Door/Window Selection)

- File: Assets/scripts/CanCustomize.cs
- Main responsibilities:
  - Raycasts from camera on touch/click.
  - Detects selected object type by child object name:
    - wall
    - windowWall(Clone)
    - Door(Clone)
  - Opens corresponding customization UI panel.

### 2.7 Painting / Visual Material Color Selection

- Files:
  - Assets/scripts/selected_dictionary.cs
  - Assets/scripts/WallPaper.cs
- Main responsibilities:
  - Groups selected wallpaper helper points per wall.
  - Sorts points by WallPaper id.
  - Builds provisional paint strips (cube meshes) between selected points.
  - Applies picker color live to provisional objects:
    - objectMaterial.color = picker.color

Important distinction:
- This is visual material/color selection in Unity (appearance customization).
- It is not structural material recommendation (AAC/RCC/etc).

## 3) API Side: Which Code Does What

### 3.1 API Entry and Model Inference

- File: FloorPlanTo3D-API/application.py
- Main responsibilities:
  - Loads Mask R-CNN model and weights.
  - Validates uploaded image type.
  - Runs inference and obtains rois/class_ids/scores.
  - Builds response with:
    - Legacy fields for Unity: points, classes, Width, Height, averageDoor
    - New pipeline payload: pipeline = run_structural_pipeline(...)

Endpoints:
- GET /health: model/runtime/weights status
- POST /: image inference + pipeline output

### 3.2 Pipeline Orchestration

- File: FloorPlanTo3D-API/structural_pipeline.py
- Main responsibilities:
  - Converts detection class names to internal ids.
  - Computes pixel_to_meter scale using average door width:
    - pixel_to_meter = 0.9 / average_door_px
  - Runs stages 1 to 5 in order.
  - Formats final stage outputs into rubric-aligned JSON.

## 4) 5-Stage Structural Pipeline Details

### Stage 1: Floor Plan Parsing

- File: FloorPlanTo3D-API/pipeline/stage_1_floor_plan_parsing.py
- Does:
  - Converts wall boxes to line segments.
  - Converts door/window boxes to opening objects.
  - Merges collinear wall fragments.
  - Estimates rooms from wall enclosure grid.
  - Falls back to synthetic rectangular boundary if no walls are detected.

### Stage 2: Geometry Reconstruction

- File: FloorPlanTo3D-API/pipeline/stage_2_geometry_reconstruction.py
- Does:
  - Builds wall graph (nodes + edges).
  - Adds synthetic enclosure edges when boundary coverage is missing.
  - Classifies each wall into:
    - partition_wall
    - load_bearing_wall
    - long_span (if span > 5m)
  - Associates openings to nearest wall edge.

### Stage 3: 3D Model Generation

- File: FloorPlanTo3D-API/pipeline/stage_3_model_generation.py
- Uses helper in:
  - FloorPlanTo3D-API/pipeline/shared.py (build_3d_model)
- Does:
  - Converts geometry edges into 3D-ready wall primitives in planar XY meters.
  - Adds floor slab metadata and openings.
  - Returns export hints for Three.js/Open3D style viewers.

### Stage 4: Material Tradeoff (Structural Material Selection)

- File: FloorPlanTo3D-API/pipeline/stage_4_material_tradeoff.py
- Data and constants in:
  - FloorPlanTo3D-API/pipeline/shared.py

This is where AAC/Brick/RCC/Steel recommendations are selected.

Material database:
- AAC Blocks, Red Brick, RCC, Steel Frame, Hollow Concrete Block, Fly Ash Brick, Precast Concrete Panel.

Base scoring formula:
- score = w_cost*cost + w_strength*strength + w_durability*durability

How selection is done:
1. Convert each material attribute to numeric component scores.
2. Pick base element weights from WEIGHTS by element type.
3. Apply dynamic weight shift based on demand level from span:
   - high demand: more strength/durability, less cost weight
   - low demand: more cost weight
4. Add adjustments:
   - suitability bonus if element_type in material.best_use
   - context adjustment (for example long-span favors Steel/RCC)
   - diversity adjustment to avoid repeating same material everywhere
5. Rank by adjusted score and return top 3 recommendations with explanations.

Output contains per-element:
- top_recommendations
- weighted contributions
- dynamic weights
- decision_justification text
- structural concerns for long spans

### Stage 5: Explainability

- File: FloorPlanTo3D-API/pipeline/stage_5_explainability.py
- Does:
  - Produces stage-wise decision trace.
  - Converts top material picks into plain-English reasons.
  - Summarizes detected structural concerns.

## 5) Material Selection: Two Different Meanings

There are two separate "material" paths in this project:

1. Structural material recommendation (engineering):
   - API Stage 4 selects AAC/Brick/RCC/Steel using weighted tradeoff scoring.
   - Code: FloorPlanTo3D-API/pipeline/stage_4_material_tradeoff.py

2. Visual appearance material/color (user customization):
   - Unity painting applies picker color to selected wall paint meshes.
   - Code: Assets/scripts/selected_dictionary.cs

So, the API decides what should be used structurally, while Unity lets users visually recolor/customize the generated scene.

## 6) Current Integration Status and Practical Note

- API already returns advanced pipeline + material recommendations.
- Unity scene generation still uses legacy fields and does not yet render Stage 4 recommendations in UI.
- If you want, next step is to bind pipeline.stage_4_material_tradeoff into Unity panels so users can see recommended structural materials per wall/zone while customizing visuals.
