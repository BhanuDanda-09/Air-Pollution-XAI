"""Flask application factory for Air Pollution XAI backend."""

import logging
import sys
from pathlib import Path

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.database import init_db
from backend.models.model_loader import get_model_loader
from backend.routes import (
    admin_bp,
    air_bp,
    auth_bp,
    explanation_bp,
    health_bp,
    livability_bp,
    location_bp,
    model_bp,
    prediction_bp,
    relocation_bp,
    user_bp,
    worker_bp,
)
from backend.utils.response import error_response, success_response

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app(config_class=Config):
    """Create and configure Flask application instance."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure Cross-Origin Resource Sharing (CORS)
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.CORS_ALLOWED_ORIGINS}},
        supports_credentials=True,
    )

    # Initialize SQLite / PostgreSQL Database
    try:
        init_db(app)
        logger.info("Database initialized.")
    except Exception as exc:
        logger.error("Error initializing database: %s", exc)

    # Initialize model loader singleton during application startup
    try:
        loader = get_model_loader()
        status = loader.get_status()
        logger.info("Initialized ModelLoader: %s", status)
    except Exception as exc:
        logger.error("Error pre-warming ModelLoader: %s", exc)

    # Register API blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(model_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(explanation_bp)
    app.register_blueprint(location_bp)
    app.register_blueprint(livability_bp)
    app.register_blueprint(air_bp)
    app.register_blueprint(relocation_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(worker_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)

    # Root route and uptime pinger endpoint
    @app.route("/", methods=["GET"])
    def index():
        return success_response(
            data={
                "project": "Explainable AI-Based Air Pollution Prediction and Source Attribution",
                "version": "2.0.0",
                "endpoints": {
                    "health": "/api/health",
                    "cities": "/api/cities",
                    "geocode": "/api/geocode",
                    "air_current": "/api/air/current",
                    "air_forecast": "/api/air/forecast",
                    "air_history": "/api/air/history",
                    "air_climatology": "/api/air/climatology",
                    "hotspots": "/api/hotspots",
                    "relocation_compare": "/api/relocation/compare",
                    "explain": "/api/explain",
                    "models": "/api/models",
                    "predict": "/api/predict",
                    "compare": "/api/compare",
                    "location_assess": "/api/location/assess",
                    "livability_assess": "/api/location/livability",
                },
                "documentation": "See backend/README.md for API documentation and examples.",
            },
            message="Air Pollution XAI REST API Backend is online.",
        )

    @app.route("/health", methods=["GET"])
    def root_health():
        """Direct health check alias for external uptime monitors (e.g. UptimeRobot, cron-job.org)."""
        loader = get_model_loader()
        status = loader.get_status()
        is_healthy = status.get("xgboost", False) or status.get("random_forest", False)
        return jsonify({
            "status": "healthy" if is_healthy else "degraded",
            "uptime_pinger_compatible": True,
            "version": "1.0.0",
        }), 200 if is_healthy else 503

    # Error Handlers
    @app.errorhandler(404)
    def not_found_handler(err):
        return error_response(
            message="Endpoint not found. Check the URL and request method.",
            code="NOT_FOUND",
            status_code=404,
        )

    @app.errorhandler(405)
    def method_not_allowed_handler(err):
        return error_response(
            message="HTTP method not allowed for this endpoint.",
            code="METHOD_NOT_ALLOWED",
            status_code=405,
        )

    @app.errorhandler(500)
    def internal_error_handler(err):
        return error_response(
            message="An unexpected internal server error occurred.",
            code="INTERNAL_SERVER_ERROR",
            status_code=500,
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
