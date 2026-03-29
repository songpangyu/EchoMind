import uuid
from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.dream import Dream
from app.models.user import User
from app.schemas.dream import (
    CreateDreamRequest,
    DreamResponse,
    GenerateDreamImageRequest,
    HomeStatsResponse,
    InsightsStatsResponse,
    MoodDistribution,
    MoodTrend,
    TagFrequency,
    UpdateDreamRequest,
    AiInsightResponse,
)
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
        is_favorited: bool | None = None,
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

        if is_favorited is not None:
            fav_filter = Dream.is_favorited == is_favorited
            stmt = stmt.where(fav_filter)
            count_stmt = count_stmt.where(fav_filter)

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

    def delete_dream(self, dream_id: str) -> None:
        dream = self.get_dream_or_404(dream_id)
        self.db.delete(dream)
        self.db.commit()

    def batch_delete_dreams(self, dream_ids: list[str]) -> int:
        stmt = select(Dream).where(
            Dream.id.in_(dream_ids),
            Dream.user_id == self.settings.default_user_id,
        )
        dreams = list(self.db.scalars(stmt).all())
        for dream in dreams:
            self.db.delete(dream)
        self.db.commit()
        return len(dreams)

    # ── Stats ────────────────────────────────────────────────

    def get_home_stats(self) -> HomeStatsResponse:
        all_dreams = list(
            self.db.scalars(
                select(Dream)
                .where(Dream.user_id == self.settings.default_user_id)
                .order_by(Dream.created_at.desc())
            ).all()
        )
        total = len(all_dreams)

        now = datetime.utcnow()
        this_month_dreams = sum(
            1 for d in all_dreams
            if d.created_at.month == now.month and d.created_at.year == now.year
        )

        # Weekly average (over past 4 weeks)
        four_weeks_ago = now - timedelta(weeks=4)
        recent_dreams = [d for d in all_dreams if d.created_at >= four_weeks_ago]
        weekly_average = round(len(recent_dreams) / 4, 1)

        # Current streak (consecutive days with dreams, ending today/yesterday)
        current_streak = self._calculate_current_streak(all_dreams)

        # Top mood
        moods = [d.mood for d in all_dreams if d.mood]
        top_mood = Counter(moods).most_common(1)[0][0] if moods else None

        # Top tag
        all_tags: list[str] = []
        for d in all_dreams:
            if d.tags_json:
                all_tags.extend(d.tags_json)
        top_tag = Counter(all_tags).most_common(1)[0][0] if all_tags else None

        # Recent mood trend (last 7 dreams)
        recent_mood_trend = [
            MoodTrend(
                date=d.created_at.strftime("%Y-%m-%d"),
                mood=d.mood,
            )
            for d in all_dreams[:7]
        ]

        # Last dream
        from app.api.routes.dreams import build_dream_response
        last_dream = build_dream_response(all_dreams[0]) if all_dreams else None

        return HomeStatsResponse(
            totalDreams=total,
            thisMonthDreams=this_month_dreams,
            weeklyAverage=weekly_average,
            currentStreak=current_streak,
            topMood=top_mood,
            topTag=top_tag,
            recentMoodTrend=recent_mood_trend,
            lastDream=last_dream,
        )

    def get_ai_insight(self) -> AiInsightResponse:
        """Return the persisted AI insight from the user record (instant DB read)."""
        user = self.db.scalars(
            select(User).where(User.id == self.settings.default_user_id)
        ).first()
        if user and user.ai_insight:
            return AiInsightResponse(**user.ai_insight)
        return AiInsightResponse(
            insightText="Record your first dream to unlock personalized AI insights about your subconscious patterns.",
            symbols=[]
        )

    def generate_and_save_ai_insight(self) -> None:
        """Heavy background task: calls LLM and persists result into users.ai_insight."""
        import logging
        logger = logging.getLogger(__name__)
        try:
            recent_dreams = list(
                self.db.scalars(
                    select(Dream)
                    .where(Dream.user_id == self.settings.default_user_id)
                    .where(Dream.transcript != "")
                    .order_by(Dream.created_at.desc())
                    .limit(10)
                ).all()
            )
            if not recent_dreams:
                return

            summary_lines = []
            for d in recent_dreams:
                date_str = d.created_at.strftime("%Y-%m-%d")
                tags_str = ", ".join(d.tags_json) if d.tags_json else "none"
                mood_str = d.mood or "neutral"
                summary_lines.append(
                    f"- Date: {date_str} | Mood: {mood_str} | Tags: {tags_str} | Transcript: {d.transcript[:200]}..."
                )

            recent_dreams_summary = "\n".join(summary_lines)
            insight_data = self.ai_service.generate_user_insight(recent_dreams_summary)

            # Persist to the user record
            user = self.db.scalars(
                select(User).where(User.id == self.settings.default_user_id)
            ).first()
            if user:
                user.ai_insight = insight_data
                self.db.add(user)
                self.db.commit()
                logger.info("AI insight generated and saved for user %s", self.settings.default_user_id)
        except Exception:
            logger.exception("Background AI insight generation failed")

    def get_insights_stats(self) -> InsightsStatsResponse:
        all_dreams = list(
            self.db.scalars(
                select(Dream)
                .where(Dream.user_id == self.settings.default_user_id)
                .order_by(Dream.created_at.desc())
            ).all()
        )
        total = len(all_dreams)

        # Average dreams per week
        if total > 0 and all_dreams:
            now = datetime.utcnow()
            first_dream_date = all_dreams[-1].created_at
            weeks_span = max((now - first_dream_date).days / 7, 1)
            avg_per_week = round(total / weeks_span, 1)
        else:
            avg_per_week = 0.0

        # Streaks
        current_streak = self._calculate_current_streak(all_dreams)
        longest_streak = self._calculate_longest_streak(all_dreams)

        # Mood distribution
        moods = [d.mood for d in all_dreams if d.mood]
        mood_counts = Counter(moods)
        mood_total = len(moods)
        mood_distribution = [
            MoodDistribution(
                mood=mood,
                count=count,
                percentage=round(count / mood_total * 100, 1) if mood_total > 0 else 0,
            )
            for mood, count in mood_counts.most_common()
        ]

        # Top tags
        all_tags: list[str] = []
        for d in all_dreams:
            if d.tags_json:
                all_tags.extend(d.tags_json)
        tag_counts = Counter(all_tags)
        top_tags = [
            TagFrequency(tag=tag, count=count)
            for tag, count in tag_counts.most_common(10)
        ]

        # Weekly frequency (last 12 weeks)
        now = datetime.utcnow()
        weekly_frequency = []
        for i in range(11, -1, -1):
            week_start = now - timedelta(weeks=i + 1)
            week_end = now - timedelta(weeks=i)
            count = sum(1 for d in all_dreams if week_start <= d.created_at < week_end)
            weekly_frequency.append({
                "week": (now - timedelta(weeks=i)).strftime("%m/%d"),
                "count": count,
            })

        # Monthly frequency (last 6 months)
        monthly_frequency = []
        for i in range(5, -1, -1):
            month_date = now - timedelta(days=30 * i)
            m, y = month_date.month, month_date.year
            count = sum(1 for d in all_dreams if d.created_at.month == m and d.created_at.year == y)
            monthly_frequency.append({
                "month": month_date.strftime("%Y-%m"),
                "count": count,
            })

        return InsightsStatsResponse(
            totalDreams=total,
            avgDreamsPerWeek=avg_per_week,
            currentStreak=current_streak,
            longestStreak=longest_streak,
            moodDistribution=mood_distribution,
            topTags=top_tags,
            weeklyFrequency=weekly_frequency,
            monthlyFrequency=monthly_frequency,
        )

    def _calculate_current_streak(self, dreams: list[Dream]) -> int:
        if not dreams:
            return 0
        dates = sorted({d.created_at.date() for d in dreams}, reverse=True)
        today = datetime.utcnow().date()
        # Start from today or yesterday
        if dates[0] != today and dates[0] != today - timedelta(days=1):
            return 0
        streak = 1
        for i in range(1, len(dates)):
            if dates[i - 1] - dates[i] == timedelta(days=1):
                streak += 1
            else:
                break
        return streak

    def _calculate_longest_streak(self, dreams: list[Dream]) -> int:
        if not dreams:
            return 0
        dates = sorted({d.created_at.date() for d in dreams})
        longest = 1
        current = 1
        for i in range(1, len(dates)):
            if dates[i] - dates[i - 1] == timedelta(days=1):
                current += 1
                longest = max(longest, current)
            else:
                current = 1
        return longest

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

    def apply_ai_analysis(self, dream: Dream) -> Dream:
        if dream.analysis_json:
            return dream
        
        try:
            analysis = self.ai_service.generate_dream_analysis(dream.transcript)
            dream.analysis_json = analysis
            self.db.add(dream)
            self.db.commit()
            self.db.refresh(dream)
            return dream
        except Exception:
            raise


class DreamNotFoundError(Exception):
    def __init__(self, dream_id: str) -> None:
        super().__init__(f"Dream '{dream_id}' was not found.")
        self.dream_id = dream_id
