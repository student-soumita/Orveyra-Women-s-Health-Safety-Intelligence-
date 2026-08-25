# -*- coding: utf-8 -*-
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.services.risk_engine import DynamicRiskEngine, get_risk_level, RISK_THRESHOLDS

client = TestClient(app)

def test_risk_engine_all_scenarios():
    print("==========================================")
    print("TESTING DYNAMIC SAFETY RISK ENGINE SCENARIOS")
    print("==========================================")

    # 1. Config endpoint
    res_cfg = client.get("/api/safety-risk/config")
    assert res_cfg.status_code == 200
    cfg = res_cfg.json()
    assert "LOW" in cfg["thresholds"]
    assert "ELEVATED" in cfg["thresholds"]
    print("[OK] /api/safety-risk/config returned valid centralized thresholds.")

    # 2. Scenario 1: Daytime + Populated Area + No Incidents
    # 2:00 PM (14:00)
    day_ts = "2026-08-25T14:00:00"
    res_s1 = client.get(f"/api/safety-risk/assess?lat=22.5726&lon=88.4331&crowd=high&lighting=well_lit&timestamp={day_ts}")
    assert res_s1.status_code == 200
    d1 = res_s1.json()
    print(f"[OK] Scenario 1 (Daytime 2PM + High Crowd + Well Lit): Score={d1['risk_score']}, Level={d1['risk_level']}")
    assert d1["risk_score"] <= 34, f"Expected LOW risk (<=34), got {d1['risk_score']}"
    assert d1["risk_level"] == "LOW"

    # 3. Scenario 2: Evening + Moderate Activity
    eve_ts = "2026-08-25T19:30:00"
    res_s2 = client.get(f"/api/safety-risk/assess?lat=22.5726&lon=88.4331&crowd=moderate&lighting=moderate&timestamp={eve_ts}")
    assert res_s2.status_code == 200
    d2 = res_s2.json()
    print(f"[OK] Scenario 2 (Evening 7:30PM + Moderate Activity): Score={d2['risk_score']}, Level={d2['risk_level']}")
    assert d2["risk_level"] in ["LOW", "MODERATE"]

    # 4. Scenario 3: Late Night + Isolated Area + Poor Lighting
    night_ts = "2026-08-25T23:30:00"
    res_s3 = client.get(f"/api/safety-risk/assess?lat=22.5820&lon=88.4210&crowd=isolated&lighting=poor&timestamp={night_ts}")
    assert res_s3.status_code == 200
    d3 = res_s3.json()
    print(f"[OK] Scenario 3 (Late Night 11:30PM + Isolated Area + Poor Lighting): Score={d3['risk_score']}, Level={d3['risk_level']}")
    assert d3["risk_score"] >= 70, f"Expected ELEVATED risk (>=70), got {d3['risk_score']}"
    assert d3["risk_level"] == "ELEVATED"

    # 5. Scenario 4: Missing Lighting Data (Lighting = unavailable)
    res_s4 = client.get(f"/api/safety-risk/assess?lat=22.5726&lon=88.4331&lighting=unavailable&timestamp={night_ts}")
    assert res_s4.status_code == 200
    d4 = res_s4.json()
    print(f"[OK] Scenario 4 (Lighting Unavailable): Score={d4['risk_score']}, Confidence={d4['confidence']}%")
    assert d4["confidence"] < d1["confidence"], "Confidence should drop when lighting data is unavailable"
    assert any("unavailable" in f.lower() for f in d4["data_quality"]["flags"])

    # 6. Spatial Risk Zones endpoint
    res_zones = client.get("/api/safety-risk/zones")
    assert res_zones.status_code == 200
    zones = res_zones.json()["risk_zones"]
    assert len(zones) >= 1
    print(f"[OK] /api/safety-risk/zones returned {len(zones)} spatial risk zones.")

    # 7. Route Risk Assessment
    route_req = {
      "origin": {"lat": 22.5726, "lon": 88.4331},
      "destination": {"lat": 22.5695, "lon": 88.4022}
    }
    res_route = client.post("/api/safety-risk/route-assess", json=route_req)
    assert res_route.status_code == 200
    r_data = res_route.json()
    print(f"[OK] Route Risk Assessment: Overall={r_data['overall_route_score']}/100, Level={r_data['overall_route_level']}")
    assert "highest_risk_segment" in r_data
    assert len(r_data["segments"]) == 5

    print("\n==========================================")
    print("ALL DYNAMIC RISK ENGINE SCENARIOS PASSED 100%")
    print("==========================================")

if __name__ == "__main__":
    test_risk_engine_all_scenarios()
