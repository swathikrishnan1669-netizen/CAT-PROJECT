from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# --- Thresholds ---
class ThresholdItem(BaseModel):
    key: str
    value: float
    unit: str
    description: str

class ThresholdUpdateRequest(BaseModel):
    key: str
    value: float
    user: str = "Admin"
    reason: str = "Threshold modification via settings"

# --- Producers, Vehicles, Routes ---
class ProducerBase(BaseModel):
    id: str
    name: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact: Optional[str] = None
    daily_volume: float = 150.0
    model_config = ConfigDict(from_attributes=True)

class VehicleBase(BaseModel):
    id: str
    vehicle_number: str
    sensor_id: str
    cooling_type: str
    insulation_rating: str
    capacity_liters: float = 5000.0
    model_config = ConfigDict(from_attributes=True)

class RouteBase(BaseModel):
    id: str
    route_name: str
    start_location: str
    end_location: str
    distance_km: float
    expected_duration_min: int
    model_config = ConfigDict(from_attributes=True)

# --- Sensor Readings ---
class SensorReadingBase(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    handover_id: Optional[str] = None
    vehicle_id: str
    producer_id: Optional[str] = None
    route_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    door_status: str = "CLOSED"
    door_event: str = "NONE"
    network_status: str = "ONLINE"
    sensor_status: str = "OK"
    calibration_status: str = "VALID"
    battery_status: float = 95.0
    milk_volume: float = 0.0
    location_available: bool = True
    source: str = "ACTUAL"
    is_noisy: bool = False
    is_delayed: bool = False
    model_config = ConfigDict(from_attributes=True)

# --- Reconstructed Readings ---
class ReconstructedReadingBase(BaseModel):
    id: Optional[int] = None
    sensor_reading_id: Optional[int] = None
    handover_id: str
    timestamp: datetime
    actual_value: Optional[float] = None
    reconstructed_value: float
    method: str
    confidence: float
    source: str = "RECONSTRUCTED"
    reason: str
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

# --- Uncertain Exposure ---
class UncertainExposureBase(BaseModel):
    id: Optional[int] = None
    handover_id: str
    start_time: datetime
    end_time: datetime
    duration_minutes: float
    estimated_temperature: float
    min_possible_temperature: float
    max_possible_temperature: float
    confidence: float
    risk_level: str
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- Alerts ---
class AlertBase(BaseModel):
    id: Optional[int] = None
    handover_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    timestamp: datetime
    alert_type: str
    severity: str
    value: Optional[float] = None
    threshold: Optional[float] = None
    message: str
    status: str = "ACTIVE"
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class AlertAcknowledgeRequest(BaseModel):
    user: str = "Operator"
    notes: Optional[str] = None

# --- Audit Logs ---
class AuditLogBase(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    user: str
    action: str
    entity: str
    entity_id: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    reconstruction_method: Optional[str] = None
    confidence_before: Optional[float] = None
    confidence_after: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

# --- Sync Queue ---
class SyncQueueItem(BaseModel):
    id: int
    timestamp: datetime
    payload: str
    status: str
    synced_at: Optional[datetime] = None
    retry_count: int = 0
    model_config = ConfigDict(from_attributes=True)

# --- Manual Fallback Entry ---
class ManualReadingCreate(BaseModel):
    vehicle_id: str
    route_id: str
    handover_id: str
    timestamp: Optional[datetime] = None
    manually_entered_temperature: float
    approximate_location: Optional[str] = "Handover Point"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    door_status: str = "CLOSED"
    reason: str = "Sensor reading unavailable during milk transfer"
    operator_name: str = "Operator John"
    notes: Optional[str] = None

# --- Handovers ---
class HandoverListItem(BaseModel):
    id: str
    producer_id: str
    producer_name: Optional[str] = None
    vehicle_id: str
    vehicle_number: Optional[str] = None
    route_id: str
    route_name: Optional[str] = None
    location: str
    start_time: datetime
    end_time: datetime
    duration_minutes: float
    milk_volume: float
    status: str
    overall_confidence: float
    risk_level: str
    total_gaps: int = 0
    active_alerts: int = 0
    model_config = ConfigDict(from_attributes=True)

class HandoverDetail(BaseModel):
    id: str
    producer: ProducerBase
    vehicle: VehicleBase
    route: RouteBase
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: float
    milk_volume: float
    status: str
    overall_confidence: float
    risk_level: str
    sensor_readings: List[SensorReadingBase] = []
    reconstructed_readings: List[ReconstructedReadingBase] = []
    uncertain_exposures: List[UncertainExposureBase] = []
    alerts: List[AlertBase] = []
    audit_history: List[AuditLogBase] = []
    gap_summary: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)

# --- Dashboard Stats ---
class DashboardStats(BaseModel):
    total_handovers: int
    total_sensor_readings: int
    missing_readings: int
    reconstructed_readings: int
    uncertain_exposure_duration_minutes: float
    critical_alerts_count: int
    warning_alerts_count: int
    low_confidence_periods_count: int
    offline_sync_queue_count: int
    manual_fallback_count: int
    average_confidence: float
    system_network_status: str
    routes_risk_summary: List[Dict[str, Any]]
    recent_alerts: List[AlertBase]

# --- Reconstruction Request ---
class ReconstructionRequest(BaseModel):
    method: str = "IMPROVED"  # "BASELINE" or "IMPROVED"
    user: str = "Quality Analyst"
    reason: str = "Operator requested gap reconstruction"
