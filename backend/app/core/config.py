from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Charge les variables d'environnement depuis le fichier .env"""
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Variables SMTP pour l'envoi d'emails
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_EMAIL: str = ""
    SMTP_PASSWORD: str = ""

    # extra="ignore" permet d'ignorer les variables du .env qui ne sont pas listées ici
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Instance globale de configuration
settings = Settings()