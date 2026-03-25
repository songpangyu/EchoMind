from __future__ import annotations

import json

import httpx

from app.core.config import get_settings
from app.schemas.dream import AIAutofillResponse, GenerateDreamImageRequest


MOOD_KEYWORDS = {
    "peaceful": ("peace", "calm", "forest", "nature", "lake", "garden"),
    "happy": ("happy", "joy", "light", "sun", "flying", "stars"),
    "sad": ("sad", "cry", "grief", "alone", "fog"),
    "anxious": ("anxious", "chase", "fall", "storm", "shadow", "late"),
    "calm": ("quiet", "sleep", "mist", "night", "moon"),
}

PLACEHOLDER_IMAGE_URLS = {
    "realistic": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&h=800&fit=crop",
    "3d-cartoon": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop",
    "anime": "https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&h=800&fit=crop",
    "watercolor": "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1200&h=800&fit=crop",
    "oil-paint": "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=800&fit=crop",
    "sketch": "https://images.unsplash.com/photo-1529429617124-aee711a5ac1c?w=1200&h=800&fit=crop",
    "fantasy": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
}


class AIService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate_autofill(self, transcript: str) -> AIAutofillResponse:
        if not self.settings.ai_text_enabled:
            raise AIServiceNotConfiguredError("AI text service is not configured.")
        prompt = (
            "You analyze dream transcripts and must return compact JSON only. "
            "Pick one mood from: peaceful, happy, sad, anxious, calm. "
            "Respond with keys: suggestedTitle, suggestedMood, suggestedTags. "
            "suggestedTags must be an array of 3 to 5 short tags."
        )
        response_data = self._post_json(
            base_url=self.settings.ai_text_base_url,
            api_key=self.settings.ai_text_api_key,
            path="/chat/completions",
            payload={
                "model": self.settings.ai_text_model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": transcript},
                ],
                "temperature": 0.3,
                "response_format": {"type": "json_object"},
            },
        )
        content = response_data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        tags = self._normalize_tags(parsed.get("suggestedTags") or [])
        mood = parsed.get("suggestedMood")
        if mood not in MOOD_KEYWORDS:
            mood = self._fallback_mood(transcript)
        suggested_title = (parsed.get("suggestedTitle") or "Untitled Dream").strip()[:255]
        return AIAutofillResponse(
            suggestedTitle=suggested_title[:255],
            suggestedMood=mood,  # type: ignore[arg-type]
            suggestedTags=tags or ["Dream"],
            provider=self.settings.ai_text_model,
            configured=True,
        )

    def generate_image_url(self, payload: GenerateDreamImageRequest) -> tuple[str, bool]:
        if not self.settings.ai_image_enabled:
            raise AIServiceNotConfiguredError("AI image service is not configured.")
        response_data = self._post_json(
            base_url=self.settings.ai_image_base_url,
            api_key=self.settings.ai_image_api_key,
            path="/images/generations",
            payload={
                "model": self.settings.ai_image_model,
                "prompt": self._build_image_prompt(payload.style),
                "size": "1024x1024",
            },
        )
        image_url = response_data.get("data", [{}])[0].get("url")
        if not image_url:
            raise AIServiceRequestError("AI image service did not return an image URL.")
        return image_url, True

    def _fallback_mood(self, transcript: str) -> str:
        lowered = transcript.lower()
        mood = "peaceful"
        score = 0
        for mood_key, keywords in MOOD_KEYWORDS.items():
            current = sum(1 for keyword in keywords if keyword in lowered)
            if current > score:
                score = current
                mood = mood_key
        return mood

    def _normalize_tags(self, tags: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for tag in tags:
            cleaned = str(tag).strip()
            if not cleaned:
                continue
            key = cleaned.lower()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(cleaned[:50])
        return normalized[:5]

    def _build_image_prompt(self, style: str) -> str:
        return (
            "Dreamlike scene inspired by a user dream journal entry, "
            f"rendered in {style} style, cinematic, atmospheric, mystical, detailed."
        )

    def _post_json(self, *, base_url: str, api_key: str, path: str, payload: dict) -> dict:
        url = f"{base_url.rstrip('/')}{path}"
        try:
            with httpx.Client(timeout=self.settings.ai_timeout_seconds) as client:
                response = client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            raise AIServiceRequestError(
                f"AI service request failed with status {exc.response.status_code}: {exc.response.text[:300]}"
            ) from exc
        except httpx.HTTPError as exc:
            raise AIServiceRequestError(f"AI service request failed: {exc}") from exc


class AIServiceNotConfiguredError(Exception):
    pass


class AIServiceRequestError(Exception):
    pass
