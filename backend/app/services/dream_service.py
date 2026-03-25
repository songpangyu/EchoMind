import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.dream import Dream
from app.schemas.dream import CreateDreamRequest, DreamResponse, GenerateDreamImageRequest, UpdateDreamRequest
from app.services.ai_service import AIService, GeneratedImage


class DreamService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.ai_service = AIService()

    def create_dream(self, payload: CreateDreamRequest) -> Dream:
        dream = Dream(
            user_id=self.settings.default_user_id,
            source_type=payload.sourceType,
            status=payload.status,
            title=payload.title,
            transcript=payload.transcript,
            mood=payload.mood,
            tags_json=payload.tags,
            duration_seconds=payload.durationSeconds,
        )
        self.db.add(dream)
        self.db.commit()
        self.db.refresh(dream)
        return dream

    def list_dreams(
        self,
        *,
        page: int,
        page_size: int,
        month: int | None,
        year: int | None,
        query: str | None,
    ) -> tuple[list[Dream], int]:
        stmt = select(Dream).where(Dream.user_id == self.settings.default_user_id)
        count_stmt = select(func.count()).select_from(Dream).where(Dream.user_id == self.settings.default_user_id)

        if month and year:
            month_expr = func.month(Dream.created_at) == month
            year_expr = func.year(Dream.created_at) == year
            stmt = stmt.where(month_expr, year_expr)
            count_stmt = count_stmt.where(month_expr, year_expr)

        if query:
            like_query = f"%{query}%"
            query_filter = or_(
                Dream.title.ilike(like_query),
                Dream.transcript.ilike(like_query),
                func.json_search(Dream.tags_json, "one", query).isnot(None),
            )
            stmt = stmt.where(query_filter)
            count_stmt = count_stmt.where(query_filter)

        stmt = stmt.order_by(Dream.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        items = list(self.db.scalars(stmt).all())
        total = self.db.scalar(count_stmt) or 0
        return items, total

    def get_dream_or_404(self, dream_id: str) -> Dream:
        dream = self.db.get(Dream, dream_id)
        if dream is None or dream.user_id != self.settings.default_user_id:
            raise DreamNotFoundError(dream_id)
        return dream

    def update_dream(self, dream: Dream, payload: UpdateDreamRequest) -> Dream:
        updates = payload.model_dump(exclude_unset=True)
        if "title" in updates:
            dream.title = updates["title"]
        if "transcript" in updates and updates["transcript"] is not None:
            dream.transcript = updates["transcript"]
        if "mood" in updates:
            dream.mood = updates["mood"]
        if "tags" in updates:
            dream.tags_json = updates["tags"]
        if "durationSeconds" in updates:
            dream.duration_seconds = updates["durationSeconds"]
        if "status" in updates:
            dream.status = updates["status"]
        if "isFavorited" in updates:
            dream.is_favorited = updates["isFavorited"]
        self.db.add(dream)
        self.db.commit()
        self.db.refresh(dream)
        return dream

    def apply_ai_autofill(self, dream: Dream) -> tuple[Dream, DreamResponse]:
        dream.ai_autofill_status = "processing"
        self.db.add(dream)
        self.db.commit()

        result = self.ai_service.generate_autofill(dream.transcript)
        if not dream.title:
            dream.title = result.suggestedTitle
        if not dream.mood:
            dream.mood = result.suggestedMood
        if not dream.tags_json:
            dream.tags_json = result.suggestedTags
        dream.ai_autofill_status = "completed"
        self.db.add(dream)
        self.db.commit()
        self.db.refresh(dream)
        return dream, result

    def apply_ai_image(self, dream: Dream, payload: GenerateDreamImageRequest) -> Dream:
        dream.ai_image_status = "processing"
        self.db.add(dream)
        self.db.commit()

        try:
            generated_image = self.ai_service.generate_image(dream=dream, payload=payload)
            image_url = self._persist_generated_image(dream.id, payload.style, generated_image)
            dream.ai_image_style = payload.style
            dream.ai_image_url = image_url
            dream.ai_image_status = "completed"
            self.db.add(dream)
            self.db.commit()
            self.db.refresh(dream)
            return dream
        except Exception:
            dream.ai_image_status = "failed"
            self.db.add(dream)
            self.db.commit()
            self.db.refresh(dream)
            raise

    def _persist_generated_image(self, dream_id: str, style: str, generated_image: GeneratedImage) -> str:
        if generated_image.mime_type == "text/uri-list":
            return generated_image.content.decode("utf-8")

        extension = self._extension_for_mime_type(generated_image.mime_type)
        filename = f"{dream_id}-{style}-{uuid.uuid4().hex[:10]}.{extension}"
        destination = self.settings.generated_media_path / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(generated_image.content)
        return f"{self.settings.app_public_base_url.rstrip('/')}/media/{filename}"

    def _extension_for_mime_type(self, mime_type: str) -> str:
        mapping = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        }
        return mapping.get(mime_type, "jpg")


class DreamNotFoundError(Exception):
    def __init__(self, dream_id: str) -> None:
        super().__init__(f"Dream '{dream_id}' was not found.")
        self.dream_id = dream_id
