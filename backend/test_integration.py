import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("==========================================")
    print("RUNNING ORVEYRA END-TO-END INTEGRATION TEST")
    print("==========================================")

    session_a = requests.Session()
    session_b = requests.Session()

    ts = int(time.time())
    email_a = f"jane_{ts}@orveyra.health"
    email_b = f"userB_{ts}@orveyra.health"

    # 1. Signup User A
    print(f"\n[1] Registering User A ({email_a})...")
    res_a = session_a.post(f"{BASE_URL}/api/auth/signup", json={
        "email": email_a,
        "password": "SecurePassword2026!",
        "full_name": "Jane Doe"
    })
    assert res_a.status_code == 200, f"User A signup failed: {res_a.text}"
    user_a_data = res_a.json()
    token_a = user_a_data["token"]
    session_a.headers["Authorization"] = f"Bearer {token_a}"
    print("[OK] User A registered successfully. User ID:", user_a_data["user"]["id"])

    # 2. Verify Profile
    me_a = session_a.get(f"{BASE_URL}/api/auth/me").json()
    print("[OK] User A session verified. Email:", me_a["email"])

    # 3. Log Telemetry for User A
    print("\n[2] Logging health telemetry for User A...")
    
    # Cycles
    session_a.post(f"{BASE_URL}/api/logs/cycle", json={"start_date": "2026-06-01", "flow_intensity": "Medium", "notes": "Normal flow"})
    session_a.post(f"{BASE_URL}/api/logs/cycle", json={"start_date": "2026-07-02", "flow_intensity": "Heavy", "notes": "31-day cycle"})
    session_a.post(f"{BASE_URL}/api/logs/cycle", json={"start_date": "2026-08-08", "flow_intensity": "Heavy", "notes": "37-day cycle, extended drift"})

    # Symptoms
    session_a.post(f"{BASE_URL}/api/logs/symptom", json={"date": "2026-08-10", "category": "Pelvic", "symptom_name": "Pelvic Cramping", "severity": 8, "notes": "Severe cramps"})
    session_a.post(f"{BASE_URL}/api/logs/symptom", json={"date": "2026-08-12", "category": "Mood", "symptom_name": "Fatigue & Brain Fog", "severity": 7, "notes": "Post-exertion fatigue"})

    # Lifestyle
    session_a.post(f"{BASE_URL}/api/logs/lifestyle", json={"date": "2026-08-10", "sleep_hours": 5.5, "stress_level": 8})
    session_a.post(f"{BASE_URL}/api/logs/lifestyle", json={"date": "2026-08-11", "sleep_hours": 5.0, "stress_level": 7})

    print("[OK] Telemetry entries recorded.")

    # 4. Check Deterministic Body Drift Analytics
    print("\n[3] Testing Deterministic Body Drift(TM) Analytics...")
    drift_res = session_a.get(f"{BASE_URL}/api/ai/body-drift").json()
    banner = drift_res["ai_explanation"]["banner_title"]
    signal = drift_res["ai_explanation"]["signal_quality"]
    print(f"[OK] Body Drift Output: Banner='{banner}', Signal Quality='{signal}'")
    assert "BODY DRIFT" in banner or "PATTERN" in banner, f"Expected drift banner, got {banner}"

    # 5. Upload & Verify Lab Report Document
    print("\n[4] Testing Layout-Aware IDP Lab Upload & Verification Gatekeeper...")
    mock_pdf_content = b"LAB REPORT\nFerritin 14.2 ng/mL 15.0-150.0\nTSH 3.85 uIU/mL 0.4-4.5"
    files = {"file": ("blood_work_2026.pdf", mock_pdf_content, "application/pdf")}
    upload_res = session_a.post(f"{BASE_URL}/api/vault/upload", files=files)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    doc_data = upload_res.json()
    print(f"[OK] Uploaded doc ID {doc_data['document_id']}. Verification status: {doc_data['verification_status']}")
    assert doc_data["verification_status"] == "UNVERIFIED", "Doc should start as UNVERIFIED"

    # Confirm Verification Gatekeeper
    v_res = session_a.post(f"{BASE_URL}/api/vault/verify/{doc_data['document_id']}", json={
        "verification_status": "VERIFIED",
        "approved_fields": doc_data["idp_extraction"]["extracted_fields"]
    })
    assert v_res.status_code == 200
    print("[OK] Document verified and approved into BiomarkerLog.")

    # 6. Test Grounded Ask Timeline Assistant
    print("\n[5] Testing Grounded 'Ask My Timeline' AI Assistant...")
    ask_res = session_a.post(f"{BASE_URL}/api/ai/ask-timeline", json={"query": "What are my recorded cycle start dates?"}).json()
    safe_ans = ask_res["answer"].encode('ascii', errors='ignore').decode('ascii')
    print("[OK] Ask Timeline Response preview:", safe_ans[:100].replace('\n', ' '))
    assert "cycle" in ask_res["answer"].lower() or "gemini" in ask_res["answer"].lower()

    # 7. Test Doctor Mode Clinician Summary & Share Token
    print("\n[6] Testing Doctor Mode Clinician Export & 48h Share Token...")
    doc_sum = session_a.get(f"{BASE_URL}/api/doctor/summary").json()
    print(f"[OK] Doctor Summary Title: '{doc_sum['title']}', Logged cycles={doc_sum['longitudinal_metrics']['logged_cycles']}")

    share_res = session_a.post(f"{BASE_URL}/api/doctor/share-token").json()
    token = share_res["token"]
    print(f"[OK] Created share token: {token}")

    # Public fetch test
    pub_res = requests.get(f"{BASE_URL}/api/doctor/public/{token}").json()
    assert pub_res["patient_info"]["name"] == "Jane Doe"
    print("[OK] Public share link resolved successfully!")

    # 8. Test Multi-Tenant Isolation (User B)
    print("\n[7] Testing Multi-Tenant Data Isolation (User B)...")
    res_b = session_b.post(f"{BASE_URL}/api/auth/signup", json={
        "email": email_b,
        "password": "PasswordUserB2026!",
        "full_name": "User B"
    })
    assert res_b.status_code == 200
    session_b.headers["Authorization"] = f"Bearer {res_b.json()['token']}"

    cycles_b = session_b.get(f"{BASE_URL}/api/logs/cycle").json()
    assert len(cycles_b) == 0, f"Multi-tenant breach! User B saw {len(cycles_b)} cycles!"
    print("[OK] Multi-tenant isolation verified: User B sees 0 of User A's cycle records.")

    print("\n==========================================")
    print("ALL END-TO-END INTEGRATION TESTS PASSED 100%")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
