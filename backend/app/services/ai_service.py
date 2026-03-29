from __future__ import annotations

import json
from dataclasses import dataclass
from textwrap import shorten

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

IMAGE_STYLE_PROMPTS = {
    "realistic": (
        "photorealistic cinematic scene, natural lighting, believable textures, "
        "immersive atmosphere, high detail, emotionally grounded"
    ),
    "3d-cartoon": (
        "stylized 3D cartoon render, expressive characters, soft global illumination, "
        "playful shapes, polished animation-film look"
    ),
    "anime": (
        "anime illustration, dynamic framing, expressive linework, cel shading, "
        "dreamlike color design, manga-inspired composition"
    ),
    "watercolor": (
        "watercolor painting, translucent pigments, soft bleeding edges, layered washes, "
        "poetic and airy mood"
    ),
    "oil-paint": (
        "oil painting, rich brushwork, painterly texture, dramatic lighting, "
        "gallery-quality composition"
    ),
    "sketch": (
        "pencil sketch, graphite shading, hand-drawn texture, subtle paper grain, "
        "moody monochrome illustration"
    ),
    "fantasy": (
        "epic fantasy artwork, mystical environment, magical glow, surreal scale, "
        "ornate details, cinematic wonder"
    ),
}

GROK_IMAGE_MODEL_ALIASES = {
    "grok image": "grok-imagine-1.0",
    "grok imagine": "grok-imagine-1.0",
}


@dataclass
class GeneratedImage:
    content: bytes
    mime_type: str


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

    def generate_dream_analysis(self, transcript: str) -> dict:
        if not self.settings.ai_text_enabled:
            raise AIServiceNotConfiguredError("AI text service is not configured.")
        
        prompt = (
            "You are an expert dream analyst. Analyze the provided dream transcript from 5 different psychological and symbolic perspectives: "
            "life, work, relationship, emotion, and spiritual.\n\n"
            "Return ONLY a pure JSON object with exactly those 5 keys. For each key, provide:\n"
            "  - 'summary': A short paragraph summarizing the dream's meaning from this perspective.\n"
            "  - 'insights': An array of 2 to 4 key takeaways or symbolic interpretations.\n"
            "  - 'suggestion': A single actionable piece of advice or reflection.\n\n"
            "Ensure the output is strictly valid JSON."
        )
        
        response_data = self._post_json(
            base_url=self.settings.ai_text_base_url,
            api_key=self.settings.ai_text_api_key,
            path="/chat/completions",
            payload={
                "model": self.settings.ai_text_model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Dream transcript:\n{transcript}"},
                ],
                "temperature": 0.5,
                "response_format": {"type": "json_object"},
            },
        )
        content = response_data["choices"][0]["message"]["content"]
        return json.loads(content)

    def generate_user_insight(self, recent_dreams_summary: str) -> dict:
        if not self.settings.ai_text_enabled:
            raise AIServiceNotConfiguredError("AI text service is not configured.")
        
        prompt = (
            "You are an expert dream analyst. Analyze the following summary of the user's recent dreams and provide a single cohesive insight.\n\n"
            "Return ONLY a pure JSON object with the following structure:\n"
            "  - 'insightText': A paragraph (2-3 sentences) analyzing their recent patterns, emotions, and overarching themes. Give them gentle advice.\n"
            "  - 'symbols': An array of up to 3 major symbols identified from these dreams. Each item must have:\n"
            "      - 'icon': a single emoji representing the symbol.\n"
            "      - 'text': a short phrase like 'Nature = Freedom' or 'Water = Emotion'.\n\n"
            "Ensure the output is strictly valid JSON."
        )
        
        response_data = self._post_json(
            base_url=self.settings.ai_text_base_url,
            api_key=self.settings.ai_text_api_key,
            path="/chat/completions",
            payload={
                "model": self.settings.ai_text_model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"User's recent dreams summary:\n{recent_dreams_summary}"},
                ],
                "temperature": 0.6,
                "response_format": {"type": "json_object"},
            },
        )
        content = response_data["choices"][0]["message"]["content"]
        return json.loads(content)

    def generate_image(self, *, dream, payload: GenerateDreamImageRequest) -> GeneratedImage:
        if not self.settings.ai_image_enabled:
            raise AIServiceNotConfiguredError("AI image service is not configured.")
        if "huggingface.co" in self.settings.ai_image_base_url:
            return self._generate_huggingface_image(dream=dream, payload=payload)

        image_url = self._generate_grok_image_url(dream=dream, payload=payload)
        return GeneratedImage(content=image_url.encode("utf-8"), mime_type="text/uri-list")

    def _generate_grok_image_url(self, *, dream, payload: GenerateDreamImageRequest) -> str:
        response_data = self._post_json(
            base_url=self.settings.ai_image_base_url,
            api_key=self.settings.ai_image_api_key,
            path="/v1/images/generations",
            payload={
                "model": self._resolve_image_model_name(self.settings.ai_image_model),
                "prompt": self._build_image_prompt(
                    style=payload.style,
                    transcript=dream.transcript,
                    title=dream.title,
                    mood=dream.mood,
                    tags=dream.tags_json or [],
                ),
                "n": 1,
                "size": "1536x1024",
                "response_format": "url",
            },
        )
        image_data = (response_data.get("data") or [{}])[0]
        image_url = image_data.get("url")
        image_b64 = image_data.get("b64_json")

        if image_url and image_url != "error":
            return image_url
        if image_b64 and image_b64 != "error":
            return f"data:image/png;base64,{image_b64}"
        if image_url == "error" or image_b64 == "error":
            raise AIServiceRequestError(
                "Grok image service accepted the request but returned an invalid image payload."
            )
        if not image_url and not image_b64:
            raise AIServiceRequestError("AI image service did not return an image URL.")
        return image_url or image_b64

    def _generate_huggingface_image(self, *, dream, payload: GenerateDreamImageRequest) -> GeneratedImage:
        prompt = self._build_image_prompt(
            style=payload.style,
            transcript=dream.transcript,
            title=dream.title,
            mood=dream.mood,
            tags=dream.tags_json or [],
        )
        response = self._post_raw(
            url=self.settings.ai_image_base_url,
            api_key=self.settings.ai_image_api_key,
            payload={
                "inputs": prompt,
                "parameters": {
                    "width": 1536,
                    "height": 1024,
                    "num_inference_steps": 4,
                    "guidance_scale": 3.5,
                },
                "options": {
                    "wait_for_model": True,
                    "use_cache": False,
                },
            },
        )
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            preview = response.text[:300]
            raise AIServiceRequestError(
                f"Hugging Face image service returned an unexpected content type '{content_type}': {preview}"
            )
        return GeneratedImage(content=response.content, mime_type=content_type.split(";")[0].strip())

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

    def _build_image_prompt(
        self,
        *,
        style: str,
        transcript: str,
        title: str | None,
        mood: str | None,
        tags: list[str],
    ) -> str:
        style_prompt = IMAGE_STYLE_PROMPTS.get(style, IMAGE_STYLE_PROMPTS["realistic"])
        normalized_tags = ", ".join(tag.strip() for tag in tags if tag.strip()) or "dream symbols"
        transcript_excerpt = shorten(" ".join(transcript.split()), width=420, placeholder="...")
        mood_text = mood or self._fallback_mood(transcript)
        title_text = title.strip() if title else "Untitled dream"
        medium = "illustration"
        if style == "realistic":
            medium = "photographic image"
        elif style == "3d-cartoon":
            medium = "3D cartoon render"
        elif style in ["watercolor", "oil-paint", "sketch"]:
            medium = f"{style} artwork"
        elif style == "anime":
            medium = "anime drawing"

        return (
            f"Create a single dream {medium} in a 4:3 landscape composition. "
            f"Dream title: {title_text}. "
            f"Dominant feeling: {mood_text}. "
            f"Key symbols: {normalized_tags}. "
            f"Dream description: {transcript_excerpt}. "
            f"Visual direction: {style_prompt}. "
            "Keep the image visually coherent, avoid any text, watermark, UI, split panels, or collage."
        )

    def _resolve_image_model_name(self, configured_model: str) -> str:
        normalized = configured_model.strip()
        if not normalized:
            return "grok-imagine-1.0"
        return GROK_IMAGE_MODEL_ALIASES.get(normalized.lower(), normalized)

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

    def _post_raw(self, *, url: str, api_key: str, payload: dict) -> httpx.Response:
        try:
            with httpx.Client(timeout=self.settings.ai_timeout_seconds * 2) as client:
                response = client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                return response
        except httpx.HTTPStatusError as exc:
            body_preview = exc.response.text[:300]
            raise AIServiceRequestError(
                f"AI service request failed with status {exc.response.status_code}: {body_preview}"
            ) from exc
        except httpx.HTTPError as exc:
            raise AIServiceRequestError(f"AI service request failed: {exc}") from exc


class AIServiceNotConfiguredError(Exception):
    pass


class AIServiceRequestError(Exception):
    pass
