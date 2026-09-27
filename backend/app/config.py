import os

class Settings:
    PROJECT_NAME: str = "MatiSync"
    TAGLINE: str = "MatiSync — AI-Powered Material Standardization & Harmonization Platform"
    SIH_PROBLEM_STATEMENT: str = "SIH 2026 Problem Statement 26099"
    MINISTRY: str = "Ministry of Petroleum & Natural Gas"
    ORGANIZATION: str = "Chennai Petroleum Corporation Limited (CPCL)"
    VERSION: str = "1.0.0"
    
    # Database: SQLite fallback for local development, PostgreSQL for production
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _DEFAULT_DB_FILE = os.path.join(_BASE_DIR, "data", "matisync.db").replace("\\", "/")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{_DEFAULT_DB_FILE}"
    )
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    SECRET_KEY: str = os.getenv("SECRET_KEY", "matisync-sih-2026-secret-token-key-cpcl")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Environment mode: 'pilot' or 'rollout'
    DEPLOYMENT_MODE: str = os.getenv("DEPLOYMENT_MODE", "pilot")
    
    # Active Sector Rule Profile: 'oil_and_gas', 'power', 'steel', 'mining', 'heavy_engineering'
    ACTIVE_SECTOR: str = os.getenv("ACTIVE_SECTOR", "oil_and_gas")
    
    # Model Versions
    AI_MODEL_VERSION: str = "matisync-hybrid-v1.4"
    CONFIG_VERSION: str = "MATISYNC-CONFIG-2026.01"
    SECTOR_RULE_VERSION: str = "RULE-OILGAS-REV4"

settings = Settings()
