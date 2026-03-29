"""
Minimal ASIS-compatible API for local demo.
Replace with your full pipeline when integrated.
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ASIS Pipeline (demo)")

# Permissive CORS for local dev (React on any host:port).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Accept floor-plan upload; return shape expected by frontend + Stellar flow."""
    _ = await file.read()

    return {
        "materials": {
            "elements": [
                {
                    "element_type": "load_bearing_wall",
                    "recommendations": [
                        {"name": "Red Brick", "score": 0.74},
                        {"name": "Reinforced Concrete", "score": 0.68},
                        {"name": "AAC Blocks", "score": 0.61},
                    ],
                }
            ]
        },
        "concerns": [],
    }
