from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


MoodType = Literal["peaceful", "happy", "sad", "anxious", "calm"]
SourceType = Literal["voice", "text"]
DreamStatus = Literal["draft", "completed"]
JobStatus = Literal["idle", "processing", "completed", "failed"]
ImageStyle = Literal[
    "realistic",
    "3d-cartoon",
    "anime",
    "watercolor",
    "oil-paint",
    "sketch",
    "fantasy",
]


class DreamBase(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    transcript: str | None = None
    mood: MoodType | None = None
    tags: list[str] = Field(default_factory=list)
    durationSeconds: int | None = Field(default=None, ge=0)

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, tags: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for tag in tags:
            cleaned = tag.strip()
            if not cleaned:
                continue
            key = cleaned.lower()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(cleaned[:50])
        return normalized

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        return stripped or None

    @field_validator("transcript")
    @classmethod
    def normalize_transcript(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        return stripped or None


class CreateDreamRequest(DreamBase):
    sourceType: SourceType
    transcript: str
    status: DreamStatus = "completed"


class UpdateDreamRequest(DreamBase):
    status: DreamStatus | None = None
    isFavorited: bool | None = None


class DreamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    sourceType: SourceType
    status: DreamStatus
    title: str | None
    transcript: str
    mood: MoodType | None
    tags: list[str]
    audioUrl: str | None
    durationSeconds: int | None
    aiImageUrl: str | None
    aiImageStyle: str | None
    aiAutofillStatus: JobStatus
    aiImageStatus: JobStatus
    isFavorited: bool
    createdAt: datetime
    updatedAt: datetime


class DreamListResponse(BaseModel):
    items: list[DreamResponse]
    page: int
    pageSize: int
    total: int


class AIAutofillResponse(BaseModel):
    suggestedTitle: str
    suggestedMood: MoodType
    suggestedTags: list[str]
    provider: str
    configured: bool


class AnalyzeDreamTextRequest(BaseModel):
    transcript: str = Field(min_length=1)

    @field_validator("transcript")
    @classmethod
    def normalize_required_transcript(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Transcript cannot be empty.")
        return stripped


class GenerateDreamImageRequest(BaseModel):
    style: ImageStyle


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str
    environment: str
