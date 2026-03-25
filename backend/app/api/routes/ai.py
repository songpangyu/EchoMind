from fastapi import APIRouter, HTTPException, status

from app.schemas.dream import AIAutofillResponse, AnalyzeDreamTextRequest
from app.services.ai_service import AIService, AIServiceNotConfiguredError, AIServiceRequestError


router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/autofill", response_model=AIAutofillResponse)
@router.post("/autofill/", response_model=AIAutofillResponse, include_in_schema=False)
def analyze_dream_text(payload: AnalyzeDreamTextRequest) -> AIAutofillResponse:
    try:
        return AIService().generate_autofill(payload.transcript)
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
