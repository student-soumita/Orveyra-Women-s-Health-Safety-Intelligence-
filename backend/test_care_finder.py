import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_care_finder():
    print("==========================================")
    print("TESTING CARE FINDER INTEGRATION & PRIVACY")
    print("==========================================")

    session = requests.Session()
    ts = int(time.time())
    email = f"care_test_{ts}@orveyra.health"

    # 1. Signup & Auth
    print(f"\n[1] Creating user {email}...")
    res = session.post(f"{BASE_URL}/api/auth/signup", json={
        "email": email,
        "password": "CarePassword2026!",
        "full_name": "Test Care Patient"
    })
    assert res.status_code == 200, f"Signup failed: {res.text}"
    token = res.json()["token"]
    user_id = res.json()["user"]["id"]
    session.headers["Authorization"] = f"Bearer {token}"
    print(f"[OK] Logged in user ID: {user_id}")

    # 2. Add some health records to test selective sharing
    session.post(f"{BASE_URL}/api/logs/cycle", json={"start_date": "2026-07-01", "flow_intensity": "Medium"})
    session.post(f"{BASE_URL}/api/logs/symptom", json={"date": "2026-07-15", "category": "Pelvic", "symptom_name": "Pelvic Pain", "severity": 7})
    session.post(f"{BASE_URL}/api/logs/biomarker", json={"date": "2026-07-20", "test_name": "Serum Ferritin", "numeric_value": 16.5, "unit": "ng/mL"})
    session.post(f"{BASE_URL}/api/logs/medication", json={"medication_name": "Iron Supplement", "dosage": "50mg", "start_date": "2026-07-21"})
    print("[OK] Seeded user health telemetry.")

    # 3. Test Search without params (Defaults to Kolkata center)
    print("\n[2] Testing Provider Search (Default & Radius)...")
    res_search = session.get(f"{BASE_URL}/api/care-finder/search").json()
    assert "providers" in res_search
    assert len(res_search["providers"]) > 0
    print(f"[OK] Found {len(res_search['providers'])} default providers within radius.")

    # 4. Test Search with Specialty filter (Gynecologist)
    res_gyn = session.get(f"{BASE_URL}/api/care-finder/search?specialty=Gynecologist").json()
    for p in res_gyn["providers"]:
        assert "gynec" in p["specialty"].lower() or "gynec" in p["category"].lower() or any("gynec" in s.lower() for s in p.get("services", []))
    print(f"[OK] Specialty filter Gynecologist returned {len(res_gyn['providers'])} verified providers.")

    # 5. Test Search with Location Query (Geocoding)
    res_loc = session.get(f"{BASE_URL}/api/care-finder/search?query=Salt%20Lake&radius=10").json()
    assert len(res_loc["providers"]) > 0
    first_p = res_loc["providers"][0]
    print(f"[OK] Location query 'Salt Lake' resolved center to: {res_loc['center']['location_name']} (Nearest: {first_p['name']} - {first_p['distance_km']} km)")

    # 6. Test Single Provider Details
    prov_id = first_p["id"]
    res_prov = session.get(f"{BASE_URL}/api/care-finder/provider/{prov_id}").json()
    assert res_prov["id"] == prov_id
    assert "name" in res_prov
    assert "address" in res_prov
    print(f"[OK] Provider details fetched for {res_prov['name']}")

    # 7. Test Saved Providers Bookmark
    print("\n[3] Testing Saved Care Bookmarking...")
    res_save = session.post(f"{BASE_URL}/api/care-finder/saved", json={
        "provider_id": prov_id,
        "name": res_prov["name"],
        "specialty": res_prov["specialty"],
        "facility_name": res_prov.get("facility_name"),
        "address": res_prov["address"],
        "phone": res_prov.get("phone"),
        "rating": res_prov.get("rating"),
        "latitude": res_prov["latitude"],
        "longitude": res_prov["longitude"]
    })
    assert res_save.status_code == 200
    
    saved_list = session.get(f"{BASE_URL}/api/care-finder/saved").json()
    assert any(s["provider_id"] == prov_id for s in saved_list)
    print(f"[OK] Provider {prov_id} saved. Total saved: {len(saved_list)}")

    # Remove from saved
    del_save = session.delete(f"{BASE_URL}/api/care-finder/saved/{prov_id}")
    assert del_save.status_code == 200
    saved_after = session.get(f"{BASE_URL}/api/care-finder/saved").json()
    assert not any(s["provider_id"] == prov_id for s in saved_after)
    print("[OK] Provider removed from saved list successfully.")

    # 8. Test Search History
    print("\n[4] Testing Search History...")
    history = session.get(f"{BASE_URL}/api/care-finder/history").json()
    assert len(history) > 0
    print(f"[OK] Search history recorded {len(history)} entries.")
    
    del_hist = session.delete(f"{BASE_URL}/api/care-finder/history")
    assert del_hist.status_code == 200
    hist_after = session.get(f"{BASE_URL}/api/care-finder/history").json()
    assert len(hist_after) == 0
    print("[OK] Search history cleared successfully.")

    # 9. Test Temporary Health Summary Sharing Flow
    print("\n[5] Testing Temporary Health Summary Sharing Flow...")
    res_share = session.post(f"{BASE_URL}/api/care-finder/share", json={
        "provider_id": prov_id,
        "provider_name": res_prov["name"],
        "shared_sections": ["cycle", "symptoms", "biomarkers"],
        "duration_hours": 48
    }).json()
    token = res_share["token"]
    print(f"[OK] Created 48h revocable share token: {token}")

    # Public View of Shared Summary
    pub_view = requests.get(f"{BASE_URL}/api/care-finder/shared-view/{token}").json()
    assert pub_view["authorized_provider"] == res_prov["name"]
    assert "cycle_summary" in pub_view["data"]
    assert "symptoms_summary" in pub_view["data"]
    assert "biomarkers_summary" in pub_view["data"]
    assert "medications_summary" not in pub_view["data"] # Not shared
    print(f"[OK] Shared view verified. Contains selected sections only: {list(pub_view['data'].keys())}")

    # Revoke Share Link
    del_share = session.delete(f"{BASE_URL}/api/care-finder/share/{token}")
    assert del_share.status_code == 200
    
    # Try viewing revoked link
    rev_view = requests.get(f"{BASE_URL}/api/care-finder/shared-view/{token}")
    assert rev_view.status_code == 403
    print("[OK] Revocation verified: Public access rejected with 403 Forbidden.")

    print("\n==========================================")
    print("ALL CARE FINDER API TESTS PASSED 100%!")
    print("==========================================")

if __name__ == "__main__":
    test_care_finder()
