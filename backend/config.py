import os
from functools import lru_cache
from pydantic import PostgresDsn
from dotenv import load_dotenv

load_dotenv(".env")          # keep .env out of Git!

class Settings:
    # Database
    database_url: PostgresDsn = os.getenv("DATABASE_URL")
    # Firebase
    firebase_config = {
        "apiKey":               os.getenv("VITE_FIREBASE_API_KEY"),
        "authDomain":           os.getenv("VITE_FIREBASE_AUTH_DOMAIN"),
        "projectId":            os.getenv("VITE_FIREBASE_PROJECT_ID"),
        "storageBucket":        "mini-rec-app.appspot.com",
        "databaseURL":          "https://mini-rec-app-default-rtdb.firebaseio.com",
    }
    # AWS / S3
    s3_bucket: str = os.getenv("S3_BUCKET")
    aws_region: str = os.getenv("AWS_REGION")

@lru_cache
def get_settings():
    return Settings()
