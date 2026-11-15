"""API Routes package for Air Pollution XAI backend."""

from .explanation_routes import explanation_bp
from .health_routes import health_bp
from .model_routes import model_bp
from .prediction_routes import prediction_bp

__all__ = ["health_bp", "model_bp", "prediction_bp", "explanation_bp"]
