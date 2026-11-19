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

import tempfile
test_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
test_db_file.close()
os.environ["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{Path(test_db_file.name).as_posix()}"

from backend.app import create_app


@pytest.fixture(scope="session")
def app():
    """Create Flask application in testing mode."""
    application = create_app()
    application.config.update({"TESTING": True})
    yield application
    # Clean up test database file
    try:
        if os.path.exists(test_db_file.name):
            os.remove(test_db_file.name)
    except Exception:
        pass


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
