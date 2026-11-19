"""API Routes package for Air Pollution XAI backend."""

from .admin_routes import admin_bp
from .auth_routes import auth_bp
from .explanation_routes import explanation_bp
from .health_routes import health_bp
from .livability_routes import livability_bp
from .location_routes import location_bp
from .model_routes import model_bp
from .prediction_routes import prediction_bp
from .worker_routes import worker_bp

__all__ = [
    "admin_bp",
    "auth_bp",
    "explanation_bp",
    "health_bp",
    "livability_bp",
    "location_bp",
    "model_bp",
    "prediction_bp",
    "worker_bp",
]
