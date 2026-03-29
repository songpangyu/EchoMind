from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.dream import HomeStatsResponse, InsightsStatsResponse, AiInsightResponse
from app.services.dream_service import DreamService


router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/home", response_model=HomeStatsResponse)
@router.get("/home/", response_model=HomeStatsResponse, include_in_schema=False)
def get_home_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> HomeStatsResponse:
    service = DreamService(db, user_id=current_user.id)
    return service.get_home_stats()


@router.get("/insights", response_model=InsightsStatsResponse)
@router.get("/insights/", response_model=InsightsStatsResponse, include_in_schema=False)
def get_insights_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> InsightsStatsResponse:
    service = DreamService(db, user_id=current_user.id)
    return service.get_insights_stats()


@router.get("/ai-insight", response_model=AiInsightResponse)
@router.get("/ai-insight/", response_model=AiInsightResponse, include_in_schema=False)
def get_ai_insight(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> AiInsightResponse:
    service = DreamService(db, user_id=current_user.id)
    return service.get_ai_insight()
