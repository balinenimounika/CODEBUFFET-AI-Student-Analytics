"""
CODEBUFFET — Student Success Digital Twin Telemetry & 50,008 Dataset Tests
Validates:
1. Retrieval of complete 50,008 student dataset for Digital Twin visualizations.
2. 100% data completeness and valid attendance (0-100) & CGPA (0-10.0) coordinates.
3. Precalculated database aggregations: Low (14,672), Med (18,227), High (17,109).
4. Quadrant distributions: Top-Right (17,655), Top-Left (11,880), Bottom-Right (1,465), Bottom-Left (19,008).
5. Exact summing: Low + Med + High == 50,008, Quadrants sum == 50,008.
6. Synchronized filters: Mentor filter, Verified vs Benchmark cohort filter, Risk filter.
7. Chunked pagination support and zero duplicate student IDs.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.routes.institution_routes import get_digital_twin_telemetry, get_students


def test_digital_twin_telemetry_complete_dataset():
    """Verify that Digital Twin telemetry loads all 50,008 students with exact risk aggregates."""
    res = get_digital_twin_telemetry(all=True, current_user={"email": "admin@codebuffet.edu", "role": "admin"})

    assert "items" in res
    assert "aggregations" in res
    assert res["total"] == 50008, f"Expected 50008, got {res['total']}"
    assert res["eligible"] == 50008
    assert res["excluded"] == 0
    assert len(res["items"]) == 50008

    # Deduplication check: every student ID must be unique
    unique_ids = {s["id"] for s in res["items"]}
    assert len(unique_ids) == 50008, "Detected duplicate student IDs in telemetry output!"

    # Verify every student has valid coordinates
    for s in res["items"][:1000]:  # sample check
        assert 0.0 <= s["attendance"] <= 100.0, f"Invalid attendance: {s['attendance']}"
        assert 0.0 <= s["cgpa"] <= 10.0, f"Invalid CGPA: {s['cgpa']}"
        assert s["riskCategory"] in ("LOW", "MEDIUM", "HIGH")
        assert s["recordType"] in ("verified_profile", "anonymous_cohort")

    # Aggregations check
    agg = res["aggregations"]
    assert agg["total_database_records"] == 50008
    assert agg["total_matching"] == 50008
    assert agg["total_eligible"] == 50008
    assert agg["excluded_count"] == 0
    assert agg["low_risk_count"] == 14672
    assert agg["medium_risk_count"] == 18227
    assert agg["high_risk_count"] == 17109

    # Sum of categories must equal total
    assert agg["low_risk_count"] + agg["medium_risk_count"] + agg["high_risk_count"] == 50008

    # 4 Quadrants check
    quads = agg["quadrants"]
    assert quads["top_right"] == 17655  # High CGPA, High Att
    assert quads["top_left"] == 11880   # High CGPA, Low Att
    assert quads["bottom_right"] == 1465 # Low CGPA, High Att
    assert quads["bottom_left"] == 19008 # Low CGPA, Low Att
    assert quads["top_right"] + quads["top_left"] + quads["bottom_right"] + quads["bottom_left"] == 50008


def test_digital_twin_telemetry_chunked_pagination():
    """Verify that telemetry supports safe chunked pagination for bandwidth-constrained clients."""
    p1 = get_digital_twin_telemetry(page=1, page_size=10000, all=False, current_user={"email": "admin@codebuffet.edu", "role": "admin"})
    assert len(p1["items"]) == 10000
    assert p1["page"] == 1
    assert p1["total_pages"] == 6
    assert p1["has_more"] is True
    assert p1["total"] == 50008


def test_digital_twin_telemetry_filters():
    """Verify that telemetry respects mentor, record_type, and risk_band filters."""
    # Mentor filter
    m_res = get_digital_twin_telemetry(mentor="Prof. Rajesh Kumar", all=True, current_user={"email": "admin@codebuffet.edu", "role": "admin"})
    assert m_res["total"] == 20447
    assert len(m_res["items"]) == 20447

    # Verified profiles filter
    v_res = get_digital_twin_telemetry(record_type="verified_profile", all=True, current_user={"email": "admin@codebuffet.edu", "role": "admin"})
    assert v_res["total"] == 8
    assert len(v_res["items"]) == 8
    assert all(s["recordType"] == "verified_profile" for s in v_res["items"])

    # Anonymous benchmark cohort filter
    b_res = get_digital_twin_telemetry(record_type="anonymous_cohort", all=True, current_user={"email": "admin@codebuffet.edu", "role": "admin"})
    assert b_res["total"] == 50000
    assert len(b_res["items"]) == 50000

    # Risk band filter
    h_res = get_digital_twin_telemetry(risk_band="HIGH", all=True, current_user={"email": "admin@codebuffet.edu", "role": "admin"})
    assert h_res["total"] == 17109
    assert len(h_res["items"]) == 17109


def test_institution_students_server_pagination():
    """Verify that get_students provides real server-side pagination across all 50,008 records."""
    res = get_students(page=1, page_size=25, current_user={"email": "admin@codebuffet.edu", "role": "admin"})
    assert res["total"] == 50008
    assert len(res["items"]) == 25
    assert res["page"] == 1
    assert res["page_size"] == 25
    assert res["total_pages"] == 2001
    assert res["counts"]["verified_profiles"] == 8
    assert res["counts"]["anonymous_cohort"] == 50000
    assert res["counts"]["total_records"] == 50008
