from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Attendance API"
    DEBUG: bool = True
    DATABASE_URL: str = ""  # set in .env
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()