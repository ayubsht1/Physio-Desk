from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	app_name: str = "Physio Desk API"
	database_url: str = "postgresql+psycopg2://physio:physio@localhost:5432/physio_desk"
	cors_origins: str = "http://localhost:3000"
	jwt_secret_key: str
	jwt_algorithm: str = "HS256"
	access_token_expire_minutes: int = 60
	refresh_token_expire_days: int = 7

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)

	@property
	def cors_origin_list(self) -> list[str]:
		return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
	return Settings()


settings = get_settings()
