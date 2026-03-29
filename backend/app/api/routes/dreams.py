from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dream import (
    AIAutofillResponse,
    BatchDeleteRequest,
    BatchDeleteResponse,
    CreateDreamRequest,
    DeleteResponse,
    DreamListResponse,
    DreamResponse,
    GenerateDreamImageRequest,
    UpdateDreamRequest,
)
from app.services.ai_service import AIServiceNotConfiguredError, AIServiceRequestError
from app.services.dream_service import DreamNotFoundError, DreamService


router = APIRouter(prefix="/dreams", tags=["dreams"])


def build_dream_response(dream) -> DreamResponse:
    return DreamResponse(
        id=dream.id,
        userId=dream.user_id,
        sourceType=dream.source_type,
        status=dream.status,
        title=dream.title,
        transcript=dream.transcript,
        mood=dream.mood,
        tags=dream.tags_json or [],
        audioUrl=dream.audio_url,
        durationSeconds=dream.duration_seconds,
        aiImageUrl=dream.ai_image_url,
        aiImageStyle=dream.ai_image_style,
        aiAutofillStatus=dream.ai_autofill_status,
        aiImageStatus=dream.ai_image_status,
        analysis=dream.analysis_json,
        isFavorited=dream.is_favorited,
        createdAt=dream.created_at,
        updatedAt=dream.updated_at,
    )


@router.post("", response_model=DreamResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DreamResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_dream(payload: CreateDreamRequest, db: Session = Depends(get_db)) -> DreamResponse:
    if not payload.transcript.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transcript cannot be empty.")
    service = DreamService(db)
    dream = service.create_dream(payload)
    return build_dream_response(dream)


@router.get("", response_model=DreamListResponse)
@router.get("/", response_model=DreamListResponse, include_in_schema=False)
def list_dreams(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    month: int | None = Query(default=None, ge=1, le=12),
    year: int | None = Query(default=None, ge=2000, le=2100),
    q: str | None = Query(default=None, min_length=1),
    is_favorited: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> DreamListResponse:
    service = DreamService(db)
    items, total = service.list_dreams(
        page=page, page_size=page_size, month=month, year=year,
        query=q, is_favorited=is_favorited,
    )
    return DreamListResponse(
        items=[build_dream_response(item) for item in items],
        page=page,
        pageSize=page_size,
        total=total,
    )


@router.get("/{dream_id}", response_model=DreamResponse)
@router.get("/{dream_id}/", response_model=DreamResponse, include_in_schema=False)
def get_dream(dream_id: str, db: Session = Depends(get_db)) -> DreamResponse:
    service = DreamService(db)
    try:
        dream = service.get_dream_or_404(dream_id)
    except DreamNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return build_dream_response(dream)


@router.patch("/{dream_id}", response_model=DreamResponse)
@router.patch("/{dream_id}/", response_model=DreamResponse, include_in_schema=False)
def update_dream(dream_id: str, payload: UpdateDreamRequest, db: Session = Depends(get_db)) -> DreamResponse:
    service = DreamService(db)
    try:
        dream = service.get_dream_or_404(dream_id)
    except DreamNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    updated = service.update_dream(dream, payload)
    return build_dream_response(updated)


@router.delete("/{dream_id}", response_model=DeleteResponse)
@router.delete("/{dream_id}/", response_model=DeleteResponse, include_in_schema=False)
def delete_dream(dream_id: str, db: Session = Depends(get_db)) -> DeleteResponse:
    service = DreamService(db)
    try:
        service.delete_dream(dream_id)
    except DreamNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return DeleteResponse(deleted=1, ids=[dream_id])


@router.post("/batch-delete", response_model=BatchDeleteResponse)
@router.post("/batch-delete/", response_model=BatchDeleteResponse, include_in_schema=False)
def batch_delete_dreams(payload: BatchDeleteRequest, db: Session = Depends(get_db)) -> BatchDeleteResponse:
    service = DreamService(db)
    deleted_count = service.batch_delete_dreams(payload.ids)
    return BatchDeleteResponse(deleted=deleted_count, ids=payload.ids)


@router.post("/{dream_id}/ai-autofill", response_model=AIAutofillResponse)
@router.post("/{dream_id}/ai-autofill/", response_model=AIAutofillResponse, include_in_schema=False)
def generate_ai_autofill(dream_id: str, db: Session = Depends(get_db)) -> AIAutofillResponse:
    service = DreamService(db)
    try:
        dream = service.get_dream_or_404(dream_id)
    except DreamNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if not dream.transcript.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transcript cannot be empty.")

    try:
        _dream, result = service.apply_ai_autofill(dream)
    except AIServiceNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AIServiceRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return result


@router.post("/{dream_id}/ai-image", response_model=DreamResponse)
@router.post("/{dream_id}/ai-image/", response_model=DreamResponse, include_in_schema=False)
def generate_ai_image(
    dream_id: str,
    payload: GenerateDreamImageRequest,
    db: Session = Depends(get_db),
) -> DreamResponse:
    service = DreamService(db)
    try:
        dream = service.get_dream_or_404(dream_id)
    except DreamNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    try:
        updated = service.apply_ai_image(dream, payload)
    except AIServiceNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AIServiceRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return build_dream_response(updated)


@router.post("/{dream_id}/analyze", response_model=DreamResponse)
def analyze_dream(
    dream_id: str,
    db: Session = Depends(get_db),
) -> DreamResponse:
    service = DreamService(db)
    try:
        dream = service.get_dream_or_404(dream_id)
    except DreamNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    try:
        updated = service.apply_ai_analysis(dream)
    except AIServiceNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AIServiceRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return build_dream_response(updated)
