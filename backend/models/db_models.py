"""SQLAlchemy models for user persistence, health profiles, saved places, and history."""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from werkzeug.security import check_password_hash, generate_password_hash
from backend.database import db


def _utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    """User account entity for authentication and personalization."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=True)
    role = db.Column(db.String(50), default="citizen", nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=_utc_now, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_utc_now, onupdate=_utc_now, nullable=False)

    # Relationships
    health_profile = db.relationship("HealthProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    saved_locations = db.relationship("SavedLocation", backref="user", cascade="all, delete-orphan", lazy="dynamic")
    history = db.relationship("AssessmentHistory", backref="user", cascade="all, delete-orphan", lazy="dynamic")
    alert_preferences = db.relationship("AlertPreference", backref="user", cascade="all, delete-orphan", lazy="dynamic")

    def __init__(
        self,
        email: str = "",
        password_hash: str = "",
        name: Optional[str] = None,
        role: str = "citizen",
        **kwargs: Any,
    ):
        super().__init__(**kwargs)
        if email:
            self.email = email
        if password_hash:
            self.password_hash = password_hash
        if name is not None:
            self.name = name
        self.role = role

    def set_password(self, password: str) -> None:
        """Hash and set user password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Validate user password against stored hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize user representation."""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name or self.email.split("@")[0],
            "role": self.role,
            "has_health_profile": self.health_profile is not None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class HealthProfile(db.Model):
    """Persistent personalized health vulnerability profile conforming to DPDP Act 2023."""

    __tablename__ = "health_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age_group = db.Column(db.String(20), default="adult", nullable=False)
    asthma = db.Column(db.Boolean, default=False, nullable=False)
    has_heart_condition = db.Column(db.Boolean, default=False, nullable=False)
    is_pregnant = db.Column(db.Boolean, default=False, nullable=False)
    is_outdoor_worker = db.Column(db.Boolean, default=False, nullable=False)
    conditions_json = db.Column(db.Text, default="[]", nullable=True)
    household = db.Column(db.String(50), default="none", nullable=True)
    outdoor_exercise_hours = db.Column(db.Float, default=0.0, nullable=True)
    commute_mode = db.Column(db.String(50), default="car", nullable=True)
    dpdp_consent = db.Column(db.Boolean, default=True, nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=_utc_now, onupdate=_utc_now, nullable=False)

    def __init__(
        self,
        user_id: Optional[int] = None,
        age_group: str = "adult",
        asthma: bool = False,
        has_heart_condition: bool = False,
        is_pregnant: bool = False,
        is_outdoor_worker: bool = False,
        conditions_json: str = "[]",
        household: str = "none",
        outdoor_exercise_hours: float = 0.0,
        commute_mode: str = "car",
        dpdp_consent: bool = True,
        **kwargs: Any,
    ):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        self.age_group = age_group
        self.asthma = asthma
        self.has_heart_condition = has_heart_condition
        self.is_pregnant = is_pregnant
        self.is_outdoor_worker = is_outdoor_worker
        self.conditions_json = conditions_json
        self.household = household
        self.outdoor_exercise_hours = outdoor_exercise_hours
        self.commute_mode = commute_mode
        self.dpdp_consent = dpdp_consent

    def to_dict(self) -> Dict[str, Any]:
        """Serialize health profile matching frontend form schema."""
        import json
        conds = []
        try:
            conds = json.loads(self.conditions_json) if self.conditions_json else []
        except Exception:
            conds = []

        if self.asthma and "asthma" not in conds:
            conds.append("asthma")
        if self.has_heart_condition and "cardiovascular_disease" not in conds:
            conds.append("cardiovascular_disease")

        return {
            "age_group": self.age_group,
            "asthma": self.asthma,
            "has_heart_condition": self.has_heart_condition,
            "is_pregnant": self.is_pregnant,
            "is_outdoor_worker": self.is_outdoor_worker,
            "conditions": conds,
            "household": self.household or "none",
            "outdoor_exercise_hours": self.outdoor_exercise_hours or 0.0,
            "commute_mode": self.commute_mode or "car",
            "dpdp_consent": self.dpdp_consent,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SavedLocation(db.Model):
    """Bookmarked geographic places for quick real-time assessment."""

    __tablename__ = "saved_locations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = db.Column(db.String(50), nullable=False)  # 'Home', 'Work', 'Campus', etc.
    name = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=_utc_now, nullable=False)

    def __init__(
        self,
        user_id: Optional[int] = None,
        label: str = "Saved Place",
        name: str = "",
        latitude: float = 0.0,
        longitude: float = 0.0,
        **kwargs: Any,
    ):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        self.label = label
        self.name = name
        self.latitude = latitude
        self.longitude = longitude

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AssessmentHistory(db.Model):
    """Historical assessment records for exposure tracking."""

    __tablename__ = "assessment_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    place_name = db.Column(db.String(255), nullable=True)
    score = db.Column(db.Integer, nullable=True)
    verdict = db.Column(db.String(50), nullable=False)
    pm25_reference = db.Column(db.Float, nullable=True)
    pm25_model = db.Column(db.Float, nullable=True)
    timestamp = db.Column(db.DateTime(timezone=True), default=_utc_now, index=True, nullable=False)

    def __init__(
        self,
        user_id: Optional[int] = None,
        latitude: float = 0.0,
        longitude: float = 0.0,
        place_name: Optional[str] = None,
        score: Optional[int] = None,
        verdict: str = "Good to go",
        pm25_reference: Optional[float] = None,
        pm25_model: Optional[float] = None,
        **kwargs: Any,
    ):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        self.latitude = latitude
        self.longitude = longitude
        self.place_name = place_name
        self.score = score
        self.verdict = verdict
        self.pm25_reference = pm25_reference
        self.pm25_model = pm25_model

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "place_name": self.place_name,
            "score": self.score,
            "verdict": self.verdict,
            "pm25_reference": self.pm25_reference,
            "pm25_model": self.pm25_model,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class AlertPreference(db.Model):
    """User threshold preferences for automated notifications."""

    __tablename__ = "alert_preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    saved_location_id = db.Column(db.Integer, db.ForeignKey("saved_locations.id", ondelete="CASCADE"), nullable=True)
    pm25_threshold = db.Column(db.Float, default=100.0, nullable=False)
    is_email_enabled = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=_utc_now, nullable=False)

    def __init__(
        self,
        user_id: Optional[int] = None,
        saved_location_id: Optional[int] = None,
        pm25_threshold: float = 100.0,
        is_email_enabled: bool = False,
        **kwargs: Any,
    ):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        self.saved_location_id = saved_location_id
        self.pm25_threshold = pm25_threshold
        self.is_email_enabled = is_email_enabled

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "saved_location_id": self.saved_location_id,
            "pm25_threshold": self.pm25_threshold,
            "is_email_enabled": self.is_email_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
