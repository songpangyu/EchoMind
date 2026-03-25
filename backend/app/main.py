from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes.ai import router as ai_router
from app.api.routes.dreams import router as dreams_router
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.schemas.dream import HealthResponse


settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "apiBase": settings.app_base_path,
    }


@app.get(f"{settings.app_base_path}/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    db = SessionLocal()
    database_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        database_status = "error"
    finally:
        db.close()

    return HealthResponse(
        status="ok" if database_status == "ok" else "degraded",
        service=settings.app_name,
        database=database_status,
        environment=settings.app_env,
    )


app.include_router(dreams_router, prefix=settings.app_base_path)
app.include_router(ai_router, prefix=settings.app_base_path)
