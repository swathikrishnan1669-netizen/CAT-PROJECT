"""
Benchmark runner executing Experiments A (5m), B (15m), C (30m), D (60m)
and threshold sensitivity analysis.
"""
import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database import SessionLocal
from backend.app.models import ExperimentRun
from backend.services.data_generator import DataGenerator

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

def run_benchmarks():
    db = SessionLocal()
    try:
        print("=" * 65)
        print(" DAIRY COLD-CHAIN SENSOR GAP RECONSTRUCTION BENCHMARKS")
        print("=" * 65)

        DataGenerator.compute_benchmark_experiments(db)
        runs = db.query(ExperimentRun).order_by(ExperimentRun.gap_duration, ExperimentRun.system_type).all()

        results_data = []
        print(f"{'Experiment':<28} | {'Type':<8} | {'MAE':<7} | {'RMSE':<7} | {'Conf':<6} | {'Exposure'}")
        print("-" * 65)
        for r in runs:
            print(f"{r.name:<28} | {r.system_type:<8} | {r.mae:<7.3f} | {r.rmse:<7.3f} | {r.confidence:<5.1f}% | {r.uncertain_exposure:.1f} min")
            results_data.append({
                "name": r.name,
                "system_type": r.system_type,
                "gap_duration": r.gap_duration,
                "mae": r.mae,
                "rmse": r.rmse,
                "confidence": r.confidence,
                "uncertain_exposure": r.uncertain_exposure,
                "precision": r.precision,
                "recall": r.recall
            })

        out_file = RESULTS_DIR / "benchmark_results.json"
        with open(out_file, "w") as f:
            json.dump(results_data, f, indent=2)

        print("-" * 65)
        print(f"Results successfully saved to: {out_file}")
    finally:
        db.close()

if __name__ == "__main__":
    run_benchmarks()
