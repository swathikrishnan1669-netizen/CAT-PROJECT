from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_handovers" in data
    assert data["total_handovers"] > 0
    assert "critical_alerts_count" in data
    assert "average_confidence" in data

def test_api_list_handovers():
    response = client.get("/api/handovers?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "producer_name" in data[0]
    assert "risk_level" in data[0]

def test_api_handover_details():
    # Fetch first handover
    list_res = client.get("/api/handovers?limit=1")
    ho_id = list_res.json()[0]["id"]

    detail_res = client.get(f"/api/handovers/{ho_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == ho_id
    assert "sensor_readings" in detail
    assert "reconstructed_readings" in detail
    assert "gap_summary" in detail

def test_api_alerts_and_acknowledge():
    alerts_res = client.get("/api/alerts?limit=5")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    if alerts:
        a_id = alerts[0]["id"]
        ack_res = client.post(f"/api/alerts/{a_id}/acknowledge", json={"user": "QA Lead", "notes": "Investigated"})
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "ACKNOWLEDGED"

def test_api_experiments_runs():
    exp_res = client.get("/api/experiments/runs")
    assert exp_res.status_code == 200
    runs = exp_res.json()
    assert len(runs) >= 4

def test_api_threshold_tuning():
    th_res = client.get("/api/experiments/threshold-tuning")
    assert th_res.status_code == 200
    th_data = th_res.json()
    assert "results" in th_data
    assert len(th_data["results"]) == 3

def test_api_error_analysis():
    err_res = client.get("/api/experiments/error-analysis")
    assert err_res.status_code == 200
    err_data = err_res.json()
    assert "summary" in err_data
    assert "overall_mae" in err_data["summary"]

def test_api_failure_simulations():
    # 1. Simulate network offline
    net_off = client.post("/api/simulate/network-offline", json={"user": "Tester"})
    assert net_off.status_code == 200
    assert net_off.json()["status"] == "OFFLINE"

    # 2. Simulate network online recovery
    net_on = client.post("/api/simulate/network-online", json={"user": "Tester"})
    assert net_on.status_code == 200
    assert net_on.json()["status"] == "ONLINE"
    assert "sync_result" in net_on.json()
