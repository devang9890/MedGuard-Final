from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongo_url: str
    database_name: str
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
