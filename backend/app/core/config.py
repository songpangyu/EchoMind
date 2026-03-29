from pathlib import Path
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    app_name: str = Field(default="EchoMind API", alias="APP_NAME")
    app_base_path: str = Field(default="/api/v1", alias="APP_BASE_PATH")
    app_public_base_url: str = Field(default="http://127.0.0.1:18000", alias="APP_PUBLIC_BASE_URL")
    debug: bool = Field(default=False, alias="APP_DEBUG")

    mysql_host: str = Field(default="127.0.0.1", alias="MYSQL_HOST")
    mysql_port: int = Field(default=3306, alias="MYSQL_PORT")
    mysql_database: str = Field(default="echomind_db", alias="MYSQL_DATABASE")
    mysql_user: str = Field(default="root", alias="MYSQL_USER")
    mysql_password: str = Field(default="", alias="MYSQL_PASSWORD")

    default_user_id: str = Field(default="demo-user-001", alias="DEFAULT_USER_ID")

    ai_text_api_key: str = Field(default="", alias="AI_TEXT_API_KEY")
    ai_text_base_url: str = Field(default="", alias="AI_TEXT_BASE_URL")
    ai_text_model: str = Field(default="", alias="AI_TEXT_MODEL")
    ai_image_api_key: str = Field(default="", alias="AI_IMAGE_API_KEY")
    ai_image_base_url: str = Field(default="", alias="AI_IMAGE_BASE_URL")
    ai_image_model: str = Field(default="", alias="AI_IMAGE_MODEL")
    ai_timeout_seconds: int = Field(default=60, alias="AI_TIMEOUT_SECONDS")
    generated_media_dir: str = Field(default="storage/generated-images", alias="GENERATED_MEDIA_DIR")

    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")

    jwt_secret: str = Field(default="change-me-in-production-please", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_days: int = Field(default=7, alias="ACCESS_TOKEN_EXPIRE_DAYS")
    refresh_token_expire_days: int = Field(default=30, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    apple_bundle_id: str = Field(default="org.reactjs.native.example.EchoMind", alias="APPLE_BUNDLE_ID")


    model_config = SettingsConfigDict(
        env_file=".env.backend",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def sqlalchemy_database_uri(self) -> str:
        password = self.mysql_password
        return (
            f"mysql+pymysql://{self.mysql_user}:{password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )

    @property
    def sqlalchemy_alembic_uri(self) -> str:
        password = self.mysql_password.replace("%", "%%")
        return (
            f"mysql+pymysql://{self.mysql_user}:{password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def ai_text_enabled(self) -> bool:
        return bool(self.ai_text_api_key and self.ai_text_base_url and self.ai_text_model)

    @property
    def ai_image_enabled(self) -> bool:
        return bool(self.ai_image_api_key and self.ai_image_base_url and self.ai_image_model)

    @property
    def generated_media_path(self) -> Path:
        return Path(self.generated_media_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
