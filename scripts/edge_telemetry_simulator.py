"""
Edge IoT Telemetry Simulator
============================
Simulates an embedded edge gateway (e.g. ESP32 / STM32 + DS18B20 thermistor + Neo-6M GPS + SIM7600 4G LTE)
installed on a dairy milk collection tanker.

Capabilities:
1. Periodic 1-minute telemetry transmission over HTTP/REST.
2. Controlled fault injection (Hatch door open, sensor disconnect/noise spike, GPS lock loss).
3. Edge network blackout simulation with local SQLite queue buffering and store-and-forward batch flush.
"""

import sys
import time
import math
import random
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import SessionLocal
from backend.app.models import Handover, Vehicle, SensorReading
from backend.services.store_and_forward import StoreAndForwardService
from backend.services.audit_service import AuditService


class EdgeTankerSimulator:
    def __init__(self, backend_url: str = "http://127.0.0.1:8000"):
        self.backend_url = backend_url.rstrip("/")
        self.is_online = True
        self.local_buffer = []

    def generate_packet(
        self,
        handover_id: str,
        vehicle_id: str,
        route_id: str,
        timestamp: datetime,
        base_temp: float = 4.2,
        door_status: str = "CLOSED",
        simulate_fault: str = "NONE"
    ) -> dict:
        """
        Synthesizes a realistic 1-minute IoT packet with physics-inspired ambient perturbation.
        """
        hour = timestamp.hour + (timestamp.minute / 60.0)
        ambient_temp = 25.0 + 6.0 * math.sin((hour - 8.0) * math.pi / 12.0)

        # Base thermal drift
        temp = base_temp
        if door_status == "OPEN":
            temp += random.uniform(0.15, 0.45)
        else:
            temp += random.uniform(-0.05, 0.05)

        is_noisy = False
        sensor_status = "OK"
        calibration_status = "VALID"
        latitude = 13.1338 + random.uniform(-0.005, 0.005)
        longitude = 78.1394 + random.uniform(-0.005, 0.005)
        location_available = True
        network_status = "ONLINE" if self.is_online else "OFFLINE"

        if simulate_fault == "SENSOR_NOISE":
            temp += random.choice([8.5, -12.0, 35.0])
            is_noisy = True
            sensor_status = "FAULTY"
        elif simulate_fault == "GPS_LOSS":
            latitude = None
            longitude = None
            location_available = False
        elif simulate_fault == "CALIBRATION_EXPIRED":
            calibration_status = "EXPIRED"

        return {
            "timestamp": timestamp.isoformat(),
            "handover_id": handover_id,
            "vehicle_id": vehicle_id,
            "route_id": route_id,
            "latitude": latitude,
            "longitude": longitude,
            "temperature": round(temp, 2),
            "humidity": round(65.0 + random.uniform(-3.0, 3.0), 1),
            "door_status": door_status,
            "door_event": "OPEN" if door_status == "OPEN" else "NONE",
            "network_status": network_status,
            "sensor_status": sensor_status,
            "calibration_status": calibration_status,
            "battery_status": 92.5,
            "milk_volume": 450.0,
            "location_available": location_available,
            "source": "ACTUAL" if self.is_online else "SYNCHRONIZED",
            "is_noisy": is_noisy,
            "is_delayed": not self.is_online
        }

    def transmit_packet(self, packet: dict) -> bool:
        """
        Simulates transmission to backend; if offline, enqueues to local store-and-forward queue.
        """
        if not self.is_online:
            self.local_buffer.append(packet)
            print(f"[EDGE BUFFERED] Network OFFLINE -> Packet stored in edge queue (Buffer size: {len(self.local_buffer)})")
            return False

        db = SessionLocal()
        try:
            # Direct database ingestion modeling edge receiver
            ts = datetime.fromisoformat(packet["timestamp"])
            reading = SensorReading(
                timestamp=ts,
                handover_id=packet["handover_id"],
                vehicle_id=packet["vehicle_id"],
                route_id=packet["route_id"],
                latitude=packet["latitude"],
                longitude=packet["longitude"],
                temperature=packet["temperature"],
                humidity=packet["humidity"],
                door_status=packet["door_status"],
                door_event=packet["door_event"],
                network_status=packet["network_status"],
                sensor_status=packet["sensor_status"],
                calibration_status=packet["calibration_status"],
                battery_status=packet["battery_status"],
                milk_volume=packet["milk_volume"],
                location_available=packet["location_available"],
                source=packet["source"],
                is_noisy=packet["is_noisy"],
                is_delayed=packet["is_delayed"]
            )
            db.add(reading)
            db.commit()
            print(f"[EDGE TRANSMIT OK] ts={packet['timestamp']} | T={packet['temperature']}°C | Door={packet['door_status']} | GPS={'YES' if packet['location_available'] else 'LOST'}")
            return True
        except Exception as e:
            db.rollback()
            print(f"[EDGE TRANSMIT ERROR] {e} -> Buffering locally")
            self.local_buffer.append(packet)
            return False
        finally:
            db.close()

    def flush_edge_buffer(self) -> int:
        """
        Simulates store-and-forward batch reconciliation once connectivity is restored.
        """
        if not self.local_buffer:
            return 0

        print(f"\n[EDGE RECONNECT] Restoring connectivity. Flushing {len(self.local_buffer)} buffered packets...")
        db = SessionLocal()
        count = 0
        try:
            for pkt in self.local_buffer:
                StoreAndForwardService.enqueue_reading(
                    db=db,
                    reading_dict=pkt
                )
            # Reconcile all via StoreAndForwardService
            res = StoreAndForwardService.synchronize_queue(db=db, user="Edge Tanker Gateway")
            count = res.get("synchronized_count", 0)
            self.local_buffer.clear()
            print(f"[STORE-AND-FORWARD FLUSH COMPLETE] {count} packets successfully synchronized.\n")
            return count
        finally:
            db.close()

    def run_simulation(
        self,
        handover_id: str = "HO-0001",
        vehicle_id: str = "VEH-01",
        route_id: str = "RT-01",
        duration_minutes: int = 15,
        gap_at_minute: int = 5,
        gap_span: int = 4
    ):
        """
        Executes a sequence demonstrating normal telemetry, an offline gap with edge buffering,
        and post-restoration batch reconciliation.
        """
        print(f"=== Starting Edge IoT Simulation for Handover {handover_id} ===")
        print(f"Duration: {duration_minutes} mins | Simulated Gap: Min {gap_at_minute}..{gap_at_minute + gap_span - 1}\n")

        start = datetime.now() - timedelta(minutes=duration_minutes)

        for m in range(duration_minutes):
            ts = start + timedelta(minutes=m)
            # Simulate gap window
            if gap_at_minute <= m < (gap_at_minute + gap_span):
                self.is_online = False
                door = "OPEN" if m == (gap_at_minute + 1) else "CLOSED"
                pkt = self.generate_packet(handover_id, vehicle_id, route_id, ts, base_temp=4.5, door_status=door)
                self.transmit_packet(pkt)
            else:
                if not self.is_online:
                    self.flush_edge_buffer()
                    self.is_online = True
                pkt = self.generate_packet(handover_id, vehicle_id, route_id, ts, base_temp=4.3, door_status="CLOSED")
                self.transmit_packet(pkt)

        # Flush any trailing items
        if self.local_buffer:
            self.flush_edge_buffer()

        print("=== Edge IoT Simulation Completed Successfully ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dairy Cold-Chain Edge IoT Simulator")
    parser.add_argument("--handover", default="HO-0001", help="Handover ID to stream into")
    parser.add_argument("--vehicle", default="VEH-01", help="Vehicle ID")
    parser.add_argument("--duration", type=int, default=10, help="Duration in minutes")
    parser.add_argument("--gap-start", type=int, default=3, help="Minute index where network drops")
    parser.add_argument("--gap-span", type=int, default=4, help="Number of minutes of blackout")
    args = parser.parse_args()

    sim = EdgeTankerSimulator()
    sim.run_simulation(
        handover_id=args.handover,
        vehicle_id=args.vehicle,
        duration_minutes=args.duration,
        gap_at_minute=args.gap_start,
        gap_span=args.gap_span
    )
