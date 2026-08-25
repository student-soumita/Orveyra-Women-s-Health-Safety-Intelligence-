import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    passkey_registered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    cycles = relationship("CycleLog", back_populates="user", cascade="all, delete-orphan")
    symptoms = relationship("SymptomLog", back_populates="user", cascade="all, delete-orphan")
    lifestyle = relationship("LifestyleLog", back_populates="user", cascade="all, delete-orphan")
    biomarkers = relationship("BiomarkerLog", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("MedicationLog", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("DocumentVault", back_populates="user", cascade="all, delete-orphan")
    observations = relationship("AIObservation", back_populates="user", cascade="all, delete-orphan")
    # Immediate Help relationships (additive — do not change existing behaviour)
    trusted_contacts = relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")
    incident_records = relationship("IncidentRecord", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    avatar_url = Column(Text, nullable=True)
    age = Column(Integer, nullable=True)
    blood_group = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    medical_conditions = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    typical_cycle_length = Column(Integer, default=28)
    typical_period_length = Column(Integer, default=5)
    baseline_notes = Column(Text, nullable=True)
    ai_processing_enabled = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class CycleLog(Base):
    __tablename__ = "cycle_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    start_date = Column(String, nullable=False) # YYYY-MM-DD
    end_date = Column(String, nullable=True)   # YYYY-MM-DD
    flow_intensity = Column(String, default="Medium") # Spotting, Light, Medium, Heavy
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="cycles")

Index("idx_cycle_user_date", CycleLog.user_id, CycleLog.start_date)

class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    category = Column(String, nullable=False) # Pelvic, Mood, Skin, Energy, Digest
    symptom_name = Column(String, nullable=False)
    severity = Column(Integer, default=5) # 1 to 10 scale
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="symptoms")

Index("idx_symptom_user_date", SymptomLog.user_id, SymptomLog.date)

class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(String, nullable=True) # Poor, Fair, Good, Excellent
    stress_level = Column(Integer, nullable=True) # 1 to 10
    activity_minutes = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="lifestyle")

Index("idx_lifestyle_user_date", LifestyleLog.user_id, LifestyleLog.date)

class BiomarkerLog(Base):
    __tablename__ = "biomarker_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    lab_name = Column(String, nullable=True)
    test_name = Column(String, nullable=False)
    numeric_value = Column(Float, nullable=False)
    unit = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    is_abnormal = Column(Boolean, default=False)
    source_document_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="biomarkers")

Index("idx_biomarker_user_date", BiomarkerLog.user_id, BiomarkerLog.date)

class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="medications")

class DocumentVault(Base):
    __tablename__ = "document_vault"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    presigned_token = Column(String, nullable=True)
    raw_layout_json = Column(Text, nullable=True) # IDP Extracted layout
    verification_status = Column(String, default="UNVERIFIED") # UNVERIFIED, VERIFIED, REJECTED
    confidence_score = Column(Float, default=0.95)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="documents")

class AIObservation(Base):
    __tablename__ = "ai_observations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    signal_quality = Column(String, nullable=False) # INSUFFICIENT DATA, POSSIBLE TREND, STRONG SIGNAL, MISSING CONTEXT
    drift_banner = Column(String, nullable=True)
    statistical_flags = Column(Text, nullable=True) # JSON of mathematical variances
    evidence_chain_json = Column(Text, nullable=True) # 5-part evidence structure
    explanation_text = Column(Text, nullable=False)
    clinician_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="observations")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String, nullable=False)
    endpoint = Column(String, nullable=True)
    client_ip = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class DoctorShareToken(Base):
    __tablename__ = "doctor_share_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    access_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# ---------------------------------------------------------
# CARE FINDER MODELS (ISOLATED MODULAR TABLES)
# ---------------------------------------------------------

class CareSavedPlace(Base):
    __tablename__ = "care_saved_places"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    provider_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    facility_name = Column(String, nullable=True)
    address = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CareSearchHistory(Base):
    __tablename__ = "care_search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    query = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CareShareLink(Base):
    __tablename__ = "care_share_links"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    provider_id = Column(String, nullable=False)
    provider_name = Column(String, nullable=False)
    shared_sections_json = Column(Text, nullable=False) # JSON array of shared keys
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    access_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ---------------------------------------------------------
# IMMEDIATE HELP MODELS (ISOLATED — DO NOT MODIFY ABOVE)
# ---------------------------------------------------------

class TrustedContact(Base):
    """Private trusted contacts for Immediate Help only. Never public."""
    __tablename__ = "trusted_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    relationship_label = Column(String, nullable=True)  # Mom, Friend, Partner, etc.
    custom_label = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="trusted_contacts")

Index("idx_trusted_contact_user", TrustedContact.user_id)


class IncidentRecord(Base):
    """
    A safety incident recorded by the user via Immediate Help.
    Strictly private to the authenticated user.
    """
    __tablename__ = "incident_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    # User-entered fields
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)           # Harassment, Threat, Stalking, Unsafe interaction, Medical concern, Other
    location_text = Column(String, nullable=True)       # Free-text or reverse-geocoded string
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    incident_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    status = Column(String, default="open")            # open, resolved, archived
    # Optional doctor-mode inclusion (default OFF per spec)
    include_in_doctor_report = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="incident_records")
    evidence = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")
    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentEvent.event_at")

Index("idx_incident_user_time", IncidentRecord.user_id, IncidentRecord.incident_at)


class IncidentEvidence(Base):
    """
    Evidence file attached to an incident.
    Stored in private safety_vault directory, served only via authenticated endpoint.
    SHA-256 hash stored for integrity metadata (not legal certification).
    """
    __tablename__ = "incident_evidence"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    incident_id = Column(Integer, ForeignKey("incident_records.id", ondelete="CASCADE"), index=True, nullable=False)
    filename = Column(String, nullable=False)          # Original filename
    stored_filename = Column(String, nullable=False)   # Stored filename (UUID-based)
    file_path = Column(String, nullable=False)         # Absolute path in safety_vault
    mime_type = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    sha256_hash = Column(String, nullable=True)        # Integrity metadata only
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("IncidentRecord", back_populates="evidence")

Index("idx_evidence_incident", IncidentEvidence.incident_id)


class IncidentEvent(Base):
    """
    Panic Timeline events — a chronological log of what the user did during an incident.
    Automatically created by the backend when user takes actions.
    """
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    incident_id = Column(Integer, ForeignKey("incident_records.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type = Column(String, nullable=False)        # OPENED, LOCATION_SHARED, NOTE_ADDED, EVIDENCE_ADDED, CALL_SELECTED, EXITED
    label = Column(String, nullable=True)              # Human-readable description
    event_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("IncidentRecord", back_populates="events")

Index("idx_event_incident_time", IncidentEvent.incident_id, IncidentEvent.event_at)


# ---------------------------------------------------------
# DYNAMIC SAFETY RISK ENGINE MODELS (ISOLATED & ADDITIVE)
# ---------------------------------------------------------

class SafetyRiskZone(Base):
    """
    Geospatial risk zones (high risk area boundaries, historical incident hotspots).
    Used by Dynamic Risk Engine for polygon/radius calculations.
    """
    __tablename__ = "safety_risk_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    risk_level = Column(String, default="ELEVATED") # ELEVATED, MODERATE, LOW
    base_risk_weight = Column(Float, default=25.0)  # 0 to 30 weight contribution
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=500.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Index("idx_risk_zone_coords", SafetyRiskZone.center_latitude, SafetyRiskZone.center_longitude)


class RiskSnapshot(Base):
    """
    Anonymized evaluation snapshots logged when users query safety risk assessments.
    Used for telemetry audit & pattern updates.
    """
    __tablename__ = "risk_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    risk_score = Column(Integer, nullable=False)     # 0 to 100
    risk_level = Column(String, nullable=False)      # LOW, MODERATE, ELEVATED
    confidence_score = Column(Integer, nullable=False)# 0 to 100
    contributing_factors_json = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

