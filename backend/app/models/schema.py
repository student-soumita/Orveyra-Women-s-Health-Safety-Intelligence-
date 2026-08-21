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

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    dob = Column(String, nullable=True)
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
