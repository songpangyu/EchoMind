from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dream import HomeStatsResponse, InsightsStatsResponse
from app.services.dream_service import DreamService


router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/home", response_model=HomeStatsResponse)
@router.get("/home/", response_model=HomeStatsResponse, include_in_schema=False)
def get_home_stats(db: Session = Depends(get_db)) -> HomeStatsResponse:
    service = DreamService(db)
    return service.get_home_stats()


@router.get("/insights", response_model=InsightsStatsResponse)
@router.get("/insights/", response_model=InsightsStatsResponse, include_in_schema=False)
def get_insights_stats(db: Session = Depends(get_db)) -> InsightsStatsResponse:
    service = DreamService(db)
    return service.get_insights_stats()
