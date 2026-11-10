from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.options import router as options_router
from app.api.comparison import router as comparison_router
from app.api.plans import router as plans_router
from app.database import Base, engine
from app.models import plan  # noqa: F401  (registers the tables)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CommuteCalc API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(plans_router)
app.include_router(options_router)
app.include_router(comparison_router)