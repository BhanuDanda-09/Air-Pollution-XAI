"""Pytest fixtures for backend test suite."""

import os
import sys
from pathlib import Path
import pytest

# Ensure project root is discoverable
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Ensure Matplotlib writes cache inside workspace to avoid permission issues
os.environ.setdefault("MPLCONFIGDIR", str(PROJECT_ROOT / ".matplotlib_cache"))
(PROJECT_ROOT / ".matplotlib_cache").mkdir(exist_ok=True)

from backend.app import create_app


@pytest.fixture(scope="session")
def app():
    """Create Flask application in testing mode."""
    application = create_app()
    application.config.update({"TESTING": True})
    return application


@pytest.fixture(scope="session")
def client(app):
    """Test client for HTTP assertions."""
    return app.test_client()


@pytest.fixture
def sample_features():
    """Standard realistic meteorological sample."""
    return {
        "RH": 55.0,
        "WD": 180.0,
        "SR": 350.0,
        "BP": 745.0,
        "AT": 28.0,
    }
