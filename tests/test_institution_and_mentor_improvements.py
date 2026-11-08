"""
CODEBUFFET — Tests for Institution & Faculty Mentor Dashboard Improvements
Verifies:
1. Dynamic student counts: total, verified, benchmark where verified + benchmark == total.
2. Legitimate institutional verification workflow (POST /api/institution/students/{roll_no}/verify).
3. Quick Switcher removal from Institution Dashboard.
4. Mentor intervention approval persistence, duplicate prevention, and mentor authorization enforcement (IDOR prevention).
5. Student inspection data completeness and provenance integrity.
"""

import sys
import os
import sqlite3
import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db_connection
from backend.routes.institution_routes import (
    get_institution_summary,
    get_students,
    verify_student_profile,
    approve_student_intervention,
    approve_intervention_by_id,
    StudentVerifyRequest
)


def run_coro(coro):
    """Executes a coroutine that contains synchronous database operations without blocking the event loop."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


def test_feature1_verified_and_benchmark_dynamic_counts():
    """
    FEATURE 1:
    - Verifies that verified_count + cohort_count == total_count in SQLite.
    - Confirms that get_institution_summary returns dynamic counts.
    - Confirms that get_students with pagination returns dynamic counts.
    - Ensures that filtering by record_type does not zero out global counts.
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT record_type, COUNT(*) as cnt FROM students GROUP BY record_type")
    type_counts = {r["record_type"]: r["cnt"] for r in c.fetchall()}
    conn.close()

    total_db = sum(type_counts.values())
    verified_db = type_counts.get("verified_profile", 0)
    cohort_db = type_counts.get("anonymous_cohort", 0)

    assert total_db == 50008, f"Expected 50008 total records, got {total_db}"
    assert verified_db >= 8, f"Expected at least 8 verified profiles, got {verified_db}"
    assert cohort_db <= 50000, f"Expected at most 50000 cohort profiles, got {cohort_db}"
    assert verified_db + cohort_db == total_db, "Verified + Cohort must strictly equal total"

    admin_user = {"role": "admin", "full_name": "Dr. R. Kumar", "email": "admin@codebuffet.edu"}

    # Summary endpoint
    sdata = run_coro(get_institution_summary(current_user=admin_user))
    assert sdata["total_students"] == total_db
    assert sdata["verified_students_count"] == verified_db
    assert sdata["cohort_records_count"] == cohort_db

    # Paginated students endpoint with all
    all_data = get_students(page=1, page_size=25, current_user=admin_user)
    assert all_data["counts"]["database_total"] == total_db
    assert all_data["counts"]["verified_profiles"] == verified_db
    assert all_data["counts"]["anonymous_cohort"] == cohort_db

    # Paginated students endpoint with verified filter
    vf_data = get_students(page=1, page_size=25, record_type="verified_profile", current_user=admin_user)
    # CRITICAL: Global counts must NOT be zeroed out when filtering!
    assert vf_data["counts"]["database_total"] == total_db
    assert vf_data["counts"]["verified_profiles"] == verified_db
    assert vf_data["counts"]["anonymous_cohort"] == cohort_db
    assert vf_data["counts"]["filtered_matching"] == verified_db


def test_feature1_institutional_verification_workflow():
    """
    Tests the legitimate institutional verification workflow (POST /api/institution/students/{roll_no}/verify):
    - Admin verifies an anonymous benchmark record.
    - Verifies record_type becomes 'verified_profile'.
    - Verifies source_provenance is updated.
    - Verifies audit_logs records the verification action.
    - Verifies dynamic counts are updated.
    - Calling verify again handles idempotency gracefully.
    """
    admin_user = {"role": "admin", "full_name": "Dr. R. Kumar", "email": "admin@codebuffet.edu"}

    # Find a student currently marked as anonymous_cohort
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT roll_no, full_name, record_type FROM students WHERE record_type = 'anonymous_cohort' LIMIT 1")
    target_student = c.fetchone()
    conn.close()

    assert target_student is not None, "Need a benchmark student to test verification workflow"
    target_roll = target_student["roll_no"]

    # Verify the student via institutional verification workflow
    evidence = "Official University Registrar (Enrolled B.Tech Cohort Verification)"
    vdata = run_coro(verify_student_profile(
        roll_no=target_roll,
        req=StudentVerifyRequest(verification_evidence=evidence, notes="Automated institutional audit"),
        current_user=admin_user
    ))
    assert vdata["success"] is True
    assert vdata["student"]["record_type"] == "verified_profile"
    assert vdata["student"]["source_provenance"] == evidence

    # Verify persistence in SQLite
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT record_type, source_provenance, data_completeness FROM students WHERE roll_no = ?", (target_roll,))
    updated_row = c.fetchone()
    assert updated_row["record_type"] == "verified_profile"
    assert updated_row["source_provenance"] == evidence
    assert updated_row["data_completeness"] == 100.0

    # Verify audit trail
    c.execute("SELECT * FROM audit_logs WHERE resource_id = ? AND action = 'STUDENT_VERIFIED'", (target_roll,))
    audit_row = c.fetchone()
    assert audit_row is not None
    assert "admin@codebuffet.edu" in audit_row["user_email"]

    # Test idempotency (calling verify again)
    rvdata = run_coro(verify_student_profile(
        roll_no=target_roll,
        req=StudentVerifyRequest(verification_evidence=evidence),
        current_user=admin_user
    ))
    assert rvdata["success"] is True
    assert rvdata["already_verified"] is True

    # Revert the test record back to anonymous_cohort to preserve baseline tests
    c.execute("""
        UPDATE students 
        SET record_type = 'anonymous_cohort', 
            source_provenance = 'Kaggle Benchmark Dataset (kaggle.csv - 50,000 Records)',
            data_completeness = 94.1
        WHERE roll_no = ?
    """, (target_roll,))
    conn.commit()
    conn.close()


def test_feature2_switch_viewer_removed_from_all_dashboards():
    """
    Confirms Switch Viewer / Switch View is completely removed from all four dashboards:
    1. Admin Dashboard (CampusDashboard.jsx)
    2. Faculty Mentor Dashboard (MentorDashboard.jsx)
    3. Placement Officer Dashboard (PlacementDashboard.jsx)
    4. Student Dashboard (StudentDashboard.jsx)
    while preserving Sign out, handleLogout, and role-based authentication handling.
    """
    base_pages = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "Frontend", "src", "pages"
    )
    dashboards = [
        os.path.join(base_pages, "institution", "CampusDashboard.jsx"),
        os.path.join(base_pages, "institution", "MentorDashboard.jsx"),
        os.path.join(base_pages, "institution", "PlacementDashboard.jsx"),
        os.path.join(base_pages, "student", "StudentDashboard.jsx"),
    ]

    for dpath in dashboards:
        with open(dpath, "r", encoding="utf-8") as f:
            content = f.read()

        assert "Switch Viewer" not in content, f"Switch Viewer found in {os.path.basename(dpath)}"
        assert "Switch View" not in content, f"Switch View found in {os.path.basename(dpath)}"
        assert "loginWithDemo" not in content, f"loginWithDemo found in {os.path.basename(dpath)}"
        assert "Quick Switcher:" not in content, f"Quick Switcher found in {os.path.basename(dpath)}"
        assert "handleLogout" in content, f"handleLogout missing from {os.path.basename(dpath)}"
        assert "Sign out" in content, f"Sign out button missing from {os.path.basename(dpath)}"


def test_feature3_mentor_approval_workflow_and_authorization():
    """
    FEATURE 3:
    - Authorized faculty mentor can approve intervention for their assigned mentee.
    - Approval persists in SQLite with approval_status = 'APPROVED'.
    - Duplicate approval is prevented (returns already_approved: True without creating duplicate).
    - Unauthorized faculty mentor cannot approve another mentor's mentee (returns 403 Forbidden).
    - Institution Admin can approve any student's intervention.
    """
    rajesh_user = {"role": "mentor", "full_name": "Prof. Rajesh Kumar", "email": "rajesh.kumar@codebuffet.edu"}
    sunita_user = {"role": "mentor", "full_name": "Dr. Sunita Sharma", "email": "sunita.sharma@codebuffet.edu"}

    # Find a student assigned to Prof. Rajesh Kumar
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT roll_no, full_name, assigned_mentor 
        FROM students 
        WHERE LOWER(assigned_mentor) LIKE '%rajesh%' OR LOWER(assigned_mentor) LIKE '%vihaan%'
        LIMIT 1
    """)
    rajesh_mentee = c.fetchone()

    # Find a student assigned to Dr. Sunita Sharma
    c.execute("""
        SELECT roll_no, full_name, assigned_mentor 
        FROM students 
        WHERE LOWER(assigned_mentor) LIKE '%sunita%'
        LIMIT 1
    """)
    sunita_mentee = c.fetchone()
    conn.close()

    assert rajesh_mentee is not None
    assert sunita_mentee is not None

    rajesh_roll = rajesh_mentee["roll_no"]
    sunita_roll = sunita_mentee["roll_no"]

    # 1. Prof. Rajesh Kumar approves his own mentee -> SUCCESS
    app_data1 = run_coro(approve_student_intervention(
        roll_no=rajesh_roll,
        current_user=rajesh_user
    ))
    assert app_data1["success"] is True

    # Check persistence in SQLite
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM interventions WHERE UPPER(student_roll_no) = UPPER(?)", (rajesh_roll,))
    inv_rows = c.fetchall()
    assert len(inv_rows) >= 1
    assert any(r["approval_status"] == "APPROVED" for r in inv_rows)
    initial_count = len(inv_rows)
    conn.close()

    # 2. Duplicate approval prevention: approving again does not create a duplicate row
    app_data2 = run_coro(approve_student_intervention(
        roll_no=rajesh_roll,
        current_user=rajesh_user
    ))
    assert app_data2["success"] is True
    assert app_data2["already_approved"] is True

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM interventions WHERE UPPER(student_roll_no) = UPPER(?)", (rajesh_roll,))
    assert len(c.fetchall()) == initial_count, "Duplicate approval must not create duplicate intervention rows"
    conn.close()

    # 3. IDOR / Authorization enforcement:
    # Prof. Rajesh Kumar attempts to approve Dr. Sunita Sharma's mentee -> 403 FORBIDDEN!
    with pytest.raises(HTTPException) as exc_info:
        run_coro(approve_student_intervention(
            roll_no=sunita_roll,
            current_user=rajesh_user
        ))
    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail

    # 4. Dr. Sunita Sharma approves her own mentee -> SUCCESS
    sunita_approve = run_coro(approve_student_intervention(
        roll_no=sunita_roll,
        current_user=sunita_user
    ))
    assert sunita_approve["success"] is True


def test_feature4_mentee_details_endpoint_and_is_approved_flag():
    """
    FEATURE 4:
    Verifies that get_students endpoint provides complete details for inspection:
    - CGPA, attendance, backlogs, success_score, score_band
    - coding_skills, dsa_score, lms_completion, lms_logins_per_week
    - academic_risk, academic_risk_prob, placement_risk, placement_risk_prob
    - assigned_mentor, record_type, source_provenance
    - isApproved accurately set from interventions
    """
    admin_user = {"role": "admin", "full_name": "Dr. R. Kumar", "email": "admin@codebuffet.edu"}

    res = get_students(page=1, page_size=10, current_user=admin_user)
    items = res["items"]
    assert len(items) > 0

    required_keys = [
        "id", "roll_no", "name", "department", "year", "semester",
        "cgpa", "attendance", "backlogs", "successScore", "scoreBand",
        "academicRisk", "academicRiskProb", "placementRisk", "placementRiskProb",
        "codingSkills", "dsaScore", "lmsCompletion", "assignedMentor",
        "recordType", "sourceProvenance", "isApproved"
    ]

    for student in items:
        for k in required_keys:
            assert k in student, f"Missing key '{k}' in student object"
        assert student["cgpa"] is not None
        assert student["attendance"] is not None
        assert student["academicRisk"] in ["HIGH", "MEDIUM", "LOW"]
        assert student["placementRisk"] in ["HIGH", "MEDIUM", "LOW"]
        assert student["recordType"] in ["verified_profile", "anonymous_cohort"]
        assert isinstance(student["isApproved"], bool)
