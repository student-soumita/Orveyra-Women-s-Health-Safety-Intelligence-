# -*- coding: utf-8 -*-
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_manual_location_engine():
    print("==========================================")
    print("TESTING ADVANCED MANUAL LOCATION SAFETY ENGINE")
    print("==========================================")

    # 1. Test Geocoding API
    geo_res = client.get("/api/safety-risk/geocode?q=sector%20v")
    assert geo_res.status_code == 200
    gdata = geo_res.json()
    assert "Sector V" in gdata["name"]
    print(f"[OK] Geocoding resolved 'sector v' to: {gdata['name']} ({gdata['latitude']}, {gdata['longitude']})")

    # 2. Test Manual Analysis: Solo Night Walking (High Risk Context)
    req_high_risk = {
        "location_name": "Kasba Industrial Belt",
        "latitude": 22.5820,
        "longitude": 88.4210,
        "date_str": "2026-08-25",
        "time_str": "23:30",
        "travel_companion": "alone",
        "travel_mode": "walking",
        "travel_purpose": "travel",
        "is_demo_mode": False
    }
    res_hr = client.post("/api/safety-risk/manual-analyze", json=req_high_risk)
    assert res_hr.status_code == 200
    d_hr = res_hr.json()
    print(f"[OK] Manual Analysis (Solo Night Walking at Industrial Belt): Score={d_hr['risk']['score']}/100 ({d_hr['risk']['level']})")
    assert d_hr["risk"]["score"] >= 60, "Expected HIGH or ELEVATED risk for solo night walking in industrial area"
    assert "dimensions" in d_hr
    assert len(d_hr["spatial_radius_analysis"]) == 4
    assert len(d_hr["hourly_risk_trend"]) == 24
    assert len(d_hr["risk_factors"]) >= 1

    # 3. Test Manual Analysis: Daytime Group Travel (Low Risk Context)
    req_low_risk = {
        "location_name": "Sector V Tech Corridor",
        "latitude": 22.5726,
        "longitude": 88.4331,
        "date_str": "2026-08-25",
        "time_str": "14:00",
        "travel_companion": "group",
        "travel_mode": "car",
        "travel_purpose": "work",
        "is_demo_mode": False
    }
    res_lr = client.post("/api/safety-risk/manual-analyze", json=req_low_risk)
    assert res_lr.status_code == 200
    d_lr = res_lr.json()
    print(f"[OK] Manual Analysis (Daytime Group Car Travel at Sector V): Score={d_lr['risk']['score']}/100 ({d_lr['risk']['level']})")
    assert d_lr["risk"]["score"] < d_hr["risk"]["score"], "Group daytime car travel should have lower risk score than solo night walking"

    # 4. Test Triple Route Comparison (Fastest vs Safer vs Balanced)
    route_cmp_req = {
        "origin": {"lat": 22.5820, "lon": 88.4210, "name": "Industrial Belt East"},
        "destination": {"lat": 22.5530, "lon": 88.3520, "name": "Park Street Commercial District"}
    }
    res_route_cmp = client.post("/api/safety-risk/route-compare", json=route_cmp_req)
    assert res_route_cmp.status_code == 200
    rc_data = res_route_cmp.json()
    routes = rc_data["routes"]
    assert len(routes) == 3
    fastest_r = next(r for r in routes if r["id"] == "fastest")
    safer_r = next(r for r in routes if r["id"] == "safer")
    print(f"[OK] Route Comparison: Fastest Score={fastest_r['risk_score']}, Safer Score={safer_r['risk_score']}")
    assert safer_r["risk_score"] < fastest_r["risk_score"], "Safer route should have lower risk score than fastest route"

    print("\n==========================================")
    print("ALL MANUAL LOCATION ENGINE TESTS PASSED 100%")
    print("==========================================")

if __name__ == "__main__":
    test_manual_location_engine()
