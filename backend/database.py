"""Database connection and initialization module using Flask-SQLAlchemy."""

import logging
import os
from pathlib import Path
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger(__name__)

db = SQLAlchemy()


def get_database_uri(base_dir: Path) -> str:
    """Resolve database URI supporting PostgreSQL in production and SQLite locally."""
    db_url = os.getenv("DATABASE_URL") or os.getenv("SQLALCHEMY_DATABASE_URI")
    if db_url:
        # Render / Neon postgres URLs often use postgres://, which SQLAlchemy requires as postgresql://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        return db_url

    # Local fallback to SQLite database inside instance folder
    instance_dir = base_dir / "instance"
    instance_dir.mkdir(parents=True, exist_ok=True)
    sqlite_path = instance_dir / "air_pollution.db"
    return f"sqlite:///{sqlite_path.as_posix()}"


def init_db(app: Flask) -> SQLAlchemy:
    """Initialize SQLAlchemy with the application context and create schema tables."""
    base_dir = Path(__file__).resolve().parent
    db_uri = get_database_uri(base_dir)

    app.config.setdefault("SQLALCHEMY_DATABASE_URI", db_uri)
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    db.init_app(app)

    with app.app_context():
        # Import models inside context to register with metadata
        from backend.models import db_models  # noqa: F401
        try:
            db.create_all()
            logger.info("Database initialized successfully at: %s", db_uri.split("@")[-1])
        except Exception as exc:
            logger.error("Failed to initialize database tables: %s", exc)

    return db
