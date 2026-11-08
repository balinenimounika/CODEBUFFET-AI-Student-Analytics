"""
CODEBUFFET — Comprehensive Placement Portal Upgrade Verification Tests
Verifies:
1. All 20 marquee corporate recruitment drives exist in SQLite database with complete criteria.
2. 11-Stage Candidate Recruitment Pipeline (Registered through Rejected) with stage transition history audit trail.
3. Drive CRUD, status toggling (Upcoming, Active, Completed, Cancelled), sorting and filtering.
4. Mock Interviews scheduling, status updates, scoring, and feedback recording.
5. Skill benchmarks across languages (Python, Java, C++, SQL) and competencies (DSA, Aptitude), corporate tiers, and student gap analysis.
6. Placement reports with package tiers, department conversions, and trends.
7. Settings management (profile, season preferences, and password change).
8. Modal geometry: Centered floating Inspect popup and Job Match modal.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db_connection
from backend.routes.placement_routes import (
    list_placement_jobs,
    create_placement_job,
    update_placement_job,
    update_job_status,
    list_recruitment_pipeline,
    update_pipeline_stage,
    get_pipeline_stage_history,
    list_mock_interviews,
    schedule_mock_interview,
    update_mock_interview,
    delete_mock_interview,
    get_placement_skill_benchmarks,
    get_placement_reports,
    get_placement_settings,
    update_placement_settings,
    change_officer_password,
    JobCreateRequest,
    JobUpdateRequest,
    DriveStatusUpdateRequest,
    StageUpdateRequest,
    MockInterviewCreateRequest,
    MockInterviewUpdateRequest,
    PlacementSettingsUpdateRequest,
    PasswordChangeRequest,
    CANONICAL_STAGES
)


def run_coro(coro):
    """Executes a coroutine containing synchronous database calls."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


# ---------------------------------------------------------------------------
# 1. 20 Corporate Companies Verification
# ---------------------------------------------------------------------------

def test_twenty_corporate_companies_exist():
    """Verify all 20 marquee companies are present in the database."""
    expected_companies = [
        "Microsoft", "Google", "Amazon", "Infosys", "TCS",
        "Wipro", "Accenture", "Deloitte", "IBM", "Cognizant",
        "Capgemini", "HCLTech", "Oracle", "Cisco", "Tech Mahindra",
        "Qualcomm", "Adobe", "JPMorgan Chase", "KPMG Global Services",
        "Texas Instruments"
    ]

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT company_name, package_lpa, min_cgpa, min_dsa_score, dsa_mandatory, drive_status, total_vacancies FROM placement_jobs")
    rows = c.fetchall()
    conn.close()

    found_names = [r["company_name"] for r in rows]
    for comp in expected_companies:
        assert comp in found_names, f"Missing corporate company: {comp}"

    assert len(rows) >= 20, f"Expected at least 20 jobs, found {len(rows)}"

    # Check that each job has realistic criteria
    for r in rows:
        assert r["package_lpa"] > 0, "Package must be greater than zero"
        assert r["min_cgpa"] >= 6.0, "Min CGPA must be at least 6.0"
        assert r["drive_status"] in ["ACTIVE", "UPCOMING", "COMPLETED", "CANCELLED"]


def test_list_placement_jobs_api_with_filters():
    """Verify list_placement_jobs API filters by search, status, and package sorting."""
    user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # All jobs
    all_jobs = run_coro(list_placement_jobs(current_user=user))
    assert len(all_jobs) >= 20

    # Search filter
    ms_jobs = run_coro(list_placement_jobs(search="Microsoft", current_user=user))
    assert len(ms_jobs) >= 1
    assert any(j["company_name"] == "Microsoft" for j in ms_jobs)

    # Status filter
    active_jobs = run_coro(list_placement_jobs(status="ACTIVE", current_user=user))
    assert len(active_jobs) > 0
    for j in active_jobs:
        assert j["drive_status"] == "ACTIVE"

    # Package sorting
    sorted_jobs = run_coro(list_placement_jobs(sort_by="package_desc", current_user=user))
    packages = [j["package_lpa"] for j in sorted_jobs]
    assert packages == sorted(packages, reverse=True)


# ---------------------------------------------------------------------------
# 2. Drive CRUD & Status Toggle
# ---------------------------------------------------------------------------

def test_drive_crud_and_status_toggle():
    """Verify TPO can create a new drive, edit it, and toggle its status."""
    tpo_user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # Create drive
    new_req = JobCreateRequest(
        company_name="Stripe India",
        job_title="Software Engineer — Core Payments",
        min_cgpa=8.0,
        max_backlogs=0,
        min_dsa_score=8.0,
        min_aptitude_score=75.0,
        package_lpa=48.0,
        department_eligibility="Computer Science & Engineering, Information Technology",
        deadline="Dec 28, 2026",
        location="Bengaluru",
        drive_status="UPCOMING",
        total_vacancies=10
    )
    create_res = run_coro(create_placement_job(new_req, current_user=tpo_user))
    assert create_res["success"] is True
    job_id = create_res["id"]

    # Toggle status to ACTIVE
    status_req = DriveStatusUpdateRequest(drive_status="ACTIVE")
    toggle_res = run_coro(update_job_status(job_id, status_req, current_user=tpo_user))
    assert toggle_res["success"] is True
    assert toggle_res["drive_status"] == "ACTIVE"

    # Update drive
    upd_req = JobUpdateRequest(package_lpa=50.0, total_vacancies=12)
    upd_res = run_coro(update_placement_job(job_id, upd_req, current_user=tpo_user))
    assert upd_res["success"] is True

    # Verify update in DB and clean up
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT package_lpa, drive_status, total_vacancies FROM placement_jobs WHERE id = ?", (job_id,))
    row = dict(c.fetchone())
    assert row["package_lpa"] == 50.0
    assert row["drive_status"] == "ACTIVE"
    assert row["total_vacancies"] == 12

    # Clean up test row
    c.execute("DELETE FROM placement_jobs WHERE id = ?", (job_id,))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# 3. 11-Stage Candidate Recruitment Pipeline
# ---------------------------------------------------------------------------

def test_eleven_stage_pipeline_and_transition_history():
    """Verify the 11-stage recruitment pipeline and transition history recording."""
    tpo_user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # Canonical stages check
    expected_stages = [
        "REGISTERED", "APPLIED", "RESUME_SHORTLISTED", "APTITUDE_TEST",
        "TECHNICAL_ASSESSMENT", "TECHNICAL_INTERVIEW", "HR_INTERVIEW",
        "SELECTED", "OFFERED", "JOINED", "REJECTED"
    ]
    for s in expected_stages:
        assert s in CANONICAL_STAGES

    # Fetch pipeline
    pipe_res = run_coro(list_recruitment_pipeline(current_user=tpo_user))
    assert "applications" in pipe_res
    assert "stage_counts" in pipe_res
    apps = pipe_res["applications"]
    assert len(apps) > 0

    first_app = apps[0]
    app_id = first_app["id"]

    # Advance stage to HR_INTERVIEW
    stage_req = StageUpdateRequest(
        application_id=app_id,
        stage="HR_INTERVIEW",
        notes="Candidate passed technical round with 9.2 score"
    )
    upd_res = run_coro(update_pipeline_stage(stage_req, current_user=tpo_user))
    assert upd_res["success"] is True
    assert upd_res["new_stage"] == "HR_INTERVIEW"

    # Fetch transition history
    hist = run_coro(get_pipeline_stage_history(app_id, current_user=tpo_user))
    assert len(hist) > 0
    latest = hist[-1]
    assert latest["to_stage"] == "HR_INTERVIEW"
    assert "technical round" in latest["notes"]


# ---------------------------------------------------------------------------
# 4. Mock Interviews CRUD
# ---------------------------------------------------------------------------

def test_mock_interviews_crud():
    """Verify scheduling, updating, and evaluating mock interview sessions."""
    tpo_user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # Schedule mock interview
    sched_req = MockInterviewCreateRequest(
        student_roll_no="STU-2024-042",
        interviewer_name="Dr. Alan Turing",
        interview_type="Coding",
        scheduled_date="2026-11-20",
        scheduled_time="02:00 PM"
    )
    create_res = run_coro(schedule_mock_interview(sched_req, current_user=tpo_user))
    assert create_res["success"] is True
    interview_id = create_res["id"]

    # Update feedback & score
    feedback_req = MockInterviewUpdateRequest(
        status="Completed",
        attendance_status="Present",
        score=94.0,
        strengths="Exceptional algorithmic intuition in Graph Theory",
        feedback="Recommended for direct Google MTS-2 interview"
    )
    upd_res = run_coro(update_mock_interview(interview_id, feedback_req, current_user=tpo_user))
    assert upd_res["success"] is True

    # List interviews
    interviews = run_coro(list_mock_interviews(current_user=tpo_user))
    found = [i for i in interviews if i["id"] == interview_id]
    assert len(found) == 1
    assert found[0]["score"] == 94.0
    assert found[0]["status"] == "Completed"

    # Delete interview
    del_res = run_coro(delete_mock_interview(interview_id, current_user=tpo_user))
    assert del_res["success"] is True


# ---------------------------------------------------------------------------
# 5. Skill Benchmarks & Gap Analysis
# ---------------------------------------------------------------------------

def test_skill_benchmarks_and_gap_analysis():
    """Verify skill benchmarking across languages, departments, and corporate tiers."""
    tpo_user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    benchmarks = run_coro(get_placement_skill_benchmarks(current_user=tpo_user))
    assert "departments" in benchmarks
    assert "benchmark_skills" in benchmarks
    assert "corporate_tiers" in benchmarks
    assert "students_needing_improvement" in benchmarks

    depts = benchmarks["departments"]
    assert len(depts) > 0
    for d in depts:
        assert "python" in d
        assert "java" in d
        assert "cpp" in d
        assert "sql" in d
        assert "dsa" in d
        assert "aptitude" in d

    tiers = benchmarks["corporate_tiers"]
    assert len(tiers) == 4
    assert any("Tier 1: Dream Super" in t["tier"] for t in tiers)


# ---------------------------------------------------------------------------
# 6. Placement Reports & Salary Tiers
# ---------------------------------------------------------------------------

def test_placement_reports_and_salary_tiers():
    """Verify comprehensive placement reporting and package tier calculations."""
    tpo_user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    reports = run_coro(get_placement_reports(current_user=tpo_user))
    assert "kpis" in reports
    assert "salary_tiers" in reports
    assert "department_conversions" in reports
    assert "company_outcomes" in reports
    assert "trends" in reports

    kpis = reports["kpis"]
    assert kpis["total_drives"] >= 20
    assert kpis["highest_package_lpa"] >= 44.0
    assert len(reports["salary_tiers"]) == 5


# ---------------------------------------------------------------------------
# 7. Placement Officer Settings & Password Change
# ---------------------------------------------------------------------------

def test_placement_settings_and_password_change():
    """Verify settings retrieval, updates, and password verification."""
    tpo_user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # Fetch settings
    settings = run_coro(get_placement_settings(current_user=tpo_user))
    assert settings["officer_email"] == "tpo@codebuffet.edu"

    # Update settings
    upd_req = PlacementSettingsUpdateRequest(
        officer_name="Vikram Malhotra",
        placement_season="Phase-1 (Autumn / Winter 2026)"
    )
    upd_res = run_coro(update_placement_settings(upd_req, current_user=tpo_user))
    assert upd_res["success"] is True

    # Test password verification failure on wrong password
    bad_req = PasswordChangeRequest(current_password="wrong_password", new_password="new_secret_123")
    with pytest.raises(Exception):
        run_coro(change_officer_password(bad_req, current_user=tpo_user))


# ---------------------------------------------------------------------------
# 8. Floating Centered Modals Geometry in Frontend
# ---------------------------------------------------------------------------

def test_frontend_placement_dashboard_floating_modals():
    """Verify frontend code maintains centered floating popups and all 7 route sections."""
    dashboard_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "Frontend",
        "src",
        "pages",
        "institution",
        "PlacementDashboard.jsx",
    )
    with open(dashboard_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Floating centered modal geometry
    assert 'role="dialog"' in code
    assert 'aria-modal="true"' in code
    assert "position: 'fixed'" in code
    assert "inset: 0" in code
    assert "display: 'flex'" in code
    assert "alignItems: 'center'" in code
    assert "justifyContent: 'center'" in code
    assert "zIndex: 1050" in code
    assert "backdropFilter: 'blur(6px)'" in code

    # All 7 Views supported in dashboard
    assert "activeView === 'hub'" in code
    assert "activeView === 'pipeline'" in code
    assert "activeView === 'drives'" in code
    assert "activeView === 'benchmarks'" in code
    assert "activeView === 'interviews'" in code
    assert "activeView === 'reports'" in code
    assert "activeView === 'settings'" in code

    # All 7 sidebar paths navigate correctly
    assert "'/placement/dashboard'" in code
    assert "'/placement/pipeline'" in code
    assert "'/placement/drives'" in code
    assert "'/placement/benchmarks'" in code
    assert "'/placement/interviews'" in code
    assert "'/placement/reports'" in code
    assert "'/placement/settings'" in code
