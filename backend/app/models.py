from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Producer(Base):
    __tablename__ = "producers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact = Column(String, nullable=True)
    daily_volume = Column(Float, default=150.0)

    handovers = relationship("Handover", back_populates="producer")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    vehicle_number = Column(String, nullable=False)
    sensor_id = Column(String, nullable=False)
    cooling_type = Column(String, default="Active Refrigerated")
    insulation_rating = Column(String, default="Grade-A Polyurethane")
    capacity_liters = Column(Float, default=5000.0)

    handovers = relationship("Handover", back_populates="vehicle")


class Route(Base):
    __tablename__ = "routes"

    id = Column(String, primary_key=True, index=True)
    route_name = Column(String, nullable=False)
    start_location = Column(String, nullable=False)
    end_location = Column(String, nullable=False)
    distance_km = Column(Float, default=45.0)
    expected_duration_min = Column(Integer, default=180)

    handovers = relationship("Handover", back_populates="route")


class Handover(Base):
    __tablename__ = "handovers"

    id = Column(String, primary_key=True, index=True)
    producer_id = Column(String, ForeignKey("producers.id"), nullable=False)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    route_id = Column(String, ForeignKey("routes.id"), nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    milk_volume = Column(Float, default=200.0)
    status = Column(String, default="COMPLETED")  # COMPLETED, WARNING, CRITICAL
    overall_confidence = Column(Float, default=85.0)
    risk_level = Column(String, default="LOW")     # LOW, MEDIUM, HIGH, CRITICAL

    producer = relationship("Producer", back_populates="handovers")
    vehicle = relationship("Vehicle", back_populates="handovers")
    route = relationship("Route", back_populates="handovers")
    sensor_readings = relationship("SensorReading", back_populates="handover", cascade="all, delete-orphan")
    reconstructed_readings = relationship("ReconstructedReading", back_populates="handover", cascade="all, delete-orphan")
    uncertain_exposures = relationship("UncertainExposure", back_populates="handover", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="handover", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    handover_id = Column(String, ForeignKey("handovers.id"), nullable=True, index=True)
    vehicle_id = Column(String, nullable=False, index=True)
    producer_id = Column(String, nullable=True)
    route_id = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    door_status = Column(String, default="CLOSED")    # OPEN, CLOSED, UNKNOWN
    door_event = Column(String, default="NONE")       # OPENED, CLOSED, NONE
    network_status = Column(String, default="ONLINE") # ONLINE, OFFLINE, DEGRADED
    sensor_status = Column(String, default="OK")      # OK, FAULT, UNAVAILABLE, DRIFT
    calibration_status = Column(String, default="VALID") # VALID, EXPIRED, WARNING
    battery_status = Column(Float, default=95.0)
    milk_volume = Column(Float, default=0.0)
    location_available = Column(Boolean, default=True)
    source = Column(String, default="ACTUAL")          # ACTUAL, MANUAL, FALLBACK, SYNCHRONIZED
    is_noisy = Column(Boolean, default=False)
    is_delayed = Column(Boolean, default=False)

    handover = relationship("Handover", back_populates="sensor_readings")


class ReconstructedReading(Base):
    __tablename__ = "reconstructed_readings"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    sensor_reading_id = Column(Integer, ForeignKey("sensor_readings.id"), nullable=True)
    handover_id = Column(String, ForeignKey("handovers.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    actual_value = Column(Float, nullable=True)  # Ground-truth for evaluation
    reconstructed_value = Column(Float, nullable=False)
    method = Column(String, nullable=False)      # BASELINE_FORWARD_FILL, IMPROVED_CONTEXTUAL
    confidence = Column(Float, nullable=False)   # 0 - 100
    source = Column(String, default="RECONSTRUCTED")
    reason = Column(String, nullable=False)
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)

    handover = relationship("Handover", back_populates="reconstructed_readings")


class UncertainExposure(Base):
    __tablename__ = "uncertain_exposures"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    handover_id = Column(String, ForeignKey("handovers.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    estimated_temperature = Column(Float, nullable=False)
    min_possible_temperature = Column(Float, nullable=False)
    max_possible_temperature = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    notes = Column(String, nullable=True)

    handover = relationship("Handover", back_populates="uncertain_exposures")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    handover_id = Column(String, ForeignKey("handovers.id"), nullable=True, index=True)
    vehicle_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    alert_type = Column(String, nullable=False)  # CRITICAL_TEMPERATURE, LONG_SENSOR_GAP, etc.
    severity = Column(String, default="WARNING") # INFO, WARNING, CRITICAL
    value = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    message = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")    # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    handover = relationship("Handover", back_populates="alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(String, nullable=True)
    reconstruction_method = Column(String, nullable=True)
    confidence_before = Column(Float, nullable=True)
    confidence_after = Column(Float, nullable=True)


class SyncQueue(Base):
    __tablename__ = "sync_queue"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    payload = Column(Text, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, SYNCHRONIZING, SYNCHRONIZED, FAILED
    synced_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0)


class ThresholdSetting(Base):
    __tablename__ = "threshold_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String, default="°C")
    description = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String, default="system")


class ExperimentRun(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    gap_duration = Column(Integer, nullable=False)  # minutes: 5, 15, 30, 60
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    uncertain_exposure = Column(Float, nullable=False)  # minutes
    alerts_generated = Column(Integer, default=0)
    false_positives = Column(Integer, default=0)
    false_negatives = Column(Integer, default=0)
    detection_rate = Column(Float, default=1.0)
    precision = Column(Float, default=1.0)
    recall = Column(Float, default=1.0)
    system_type = Column(String, default="IMPROVED")  # BASELINE or IMPROVED
    created_at = Column(DateTime, default=datetime.utcnow)
