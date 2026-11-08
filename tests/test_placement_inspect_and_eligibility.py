"""
CODEBUFFET — Placement Dashboard Stage 2 Verification Tests
Validates:
1. Centered floating modal popup architecture (no inline displacement).
2. Database census (50,008 students, 5 corporate job openings, 8 applications).
3. Eligibility criteria audit across all 5 job openings with mandatory vs preferred distinction.
4. Candidate Arya Raju (STU-09892, CGPA 8.89, Backlogs 0, DSA 7.1, Aptitude 93.2, CSE):
   - When DSA is mandatory (Job 1 Microsoft): Candidate is INELIGIBLE due to DSA 7.1 < 7.5.
     CGPA of 8.89 is verified as PASSED (8.89 >= 8.0).
   - When DSA is preferred: Candidate is NEEDS_REVIEW because all mandatory criteria pass.
5. Accurate explanation of failed vs passed criteria (zero false failures/passes).
6. Consistency between backend matching and frontend data contracts.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db_connection
from backend.routes.placement_routes import match_candidate_to_job, CandidateMatchRequest


def run_coro(coro):
    """Executes a coroutine that contains synchronous database operations without blocking the event loop."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


def test_inspect_modal_floating_popup_geometry():
    """1. Verify that Inspect modal opens as a centered floating popup and never pushes candidate table downward."""
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

    # Confirms no inline diagnostic drawer exists below the candidate table
    assert "Selected Candidate Diagnostic Drawer" not in code
    assert "marginTop: '1.25rem',\n                    padding: '1.25rem'" not in code

    # Confirms centered floating popup positioning and z-index
    assert 'role="dialog"' in code
    assert 'aria-modal="true"' in code
    assert "position: 'fixed'" in code
    assert "inset: 0" in code
    assert "display: 'flex'" in code
    assert "alignItems: 'center'" in code
    assert "justifyContent: 'center'" in code
    assert "zIndex: 1050" in code
    assert "backdropFilter: 'blur(6px)'" in code
    assert "document.body.style.overflow = 'hidden'" in code
    assert "handleKeyDown" in code
    assert "Escape" in code


def test_database_records_census_and_openings():
    """2. Inspect the actual database records and report exact number of candidates and corporate job openings."""
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) as count FROM students")
    tot_students = c.fetchone()["count"]

    c.execute("SELECT record_type, COUNT(*) as count FROM students GROUP BY record_type")
    type_counts = {r["record_type"]: r["count"] for r in c.fetchall()}

    c.execute("SELECT COUNT(*) as count FROM placement_jobs")
    tot_jobs = c.fetchone()["count"]

    c.execute("SELECT COUNT(*) as count FROM placement_applications")
    tot_apps = c.fetchone()["count"]
    conn.close()

    assert tot_students == 50008, f"Expected 50,008 students, found {tot_students}"
    assert type_counts.get("anonymous_cohort", 0) == 50000
    assert type_counts.get("verified_profile", 0) == 8
    assert tot_jobs >= 5, f"Expected at least 5 corporate job openings, found {tot_jobs}"
    assert tot_apps >= 8, f"Expected at least 8 pipeline applications, found {tot_apps}"


def test_audit_eligibility_criteria_of_all_job_openings():
    """3. Audit the eligibility criteria of every job opening and verify mandatory vs preferred distinctions."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT id, company_name, job_title, min_cgpa, max_backlogs,
               min_dsa_score, dsa_mandatory, min_aptitude_score, aptitude_mandatory,
               mandatory_skills, preferred_skills, department_eligibility, package_lpa
        FROM placement_jobs
        ORDER BY id ASC
    """)
    jobs = [dict(r) for r in c.fetchall()]
    conn.close()

    assert len(jobs) >= 5

    # Job 1: Microsoft
    j1 = jobs[0]
    assert j1["company_name"] == "Microsoft"
    assert j1["min_cgpa"] == 8.0
    assert j1["max_backlogs"] == 0
    assert j1["min_dsa_score"] == 7.5
    assert j1["dsa_mandatory"] == 1, "Microsoft SDE must have DSA as mandatory"
    assert "Computer Science" in j1["department_eligibility"]

    # Job 2: KPMG Global Services
    j2 = jobs[1]
    assert j2["company_name"] == "KPMG Global Services"
    assert j2["min_cgpa"] == 7.0
    assert j2["min_dsa_score"] == 6.0
    assert j2["dsa_mandatory"] == 0, "KPMG Consulting must have DSA as preferred"
    assert j2["min_aptitude_score"] == 65.0
    assert j2["aptitude_mandatory"] == 1, "KPMG Consulting must have Aptitude as mandatory"

    # Job 3: Amazon
    j3 = jobs[2]
    assert j3["company_name"] == "Amazon"
    assert j3["min_cgpa"] == 7.5
    assert j3["min_dsa_score"] == 7.0
    assert j3["dsa_mandatory"] == 1, "Amazon SDE Intern must have DSA as mandatory"

    # Job 4: Texas Instruments
    j4 = jobs[3]
    assert j4["company_name"] == "Texas Instruments"
    assert j4["min_cgpa"] == 7.5
    assert "Electronics" in j4["department_eligibility"]
    assert j4["aptitude_mandatory"] == 1

    # Job 5: Infosys
    j5 = jobs[4]
    assert j5["company_name"] == "Infosys"
    assert j5["min_cgpa"] == 6.5
    assert j5["max_backlogs"] == 1


def test_arya_raju_actual_database_record_and_cgpa_verification():
    """7. Verify that Arya Raju's CGPA of 8.89 correctly passes a minimum CGPA requirement of 8.0."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT roll_no, full_name, cgpa, backlogs, department, dsa_score, aptitude_score, coding_skills
        FROM students
        WHERE LOWER(full_name) = 'arya raju'
    """)
    arya = dict(c.fetchone())
    conn.close()

    assert arya is not None, "Arya Raju record not found in students table"
    assert arya["roll_no"] == "STU-09892"
    assert arya["cgpa"] == 8.89
    assert arya["backlogs"] == 0
    assert "Computer Science" in arya["department"]
    assert arya["dsa_score"] == 7.1
    assert arya["aptitude_score"] == 93.2

    # Math check: 8.89 >= 8.0 is strictly True
    assert arya["cgpa"] >= 8.0


def test_arya_raju_dsa_mandatory_scenario_is_ineligible():
    """5. If DSA is mandatory for a job, a candidate scoring 7.1/10 against a mandatory requirement of 7.5/10 must be INELIGIBLE."""
    tpo_user = {"role": "tpo", "sub": "tpo@codebuffet.edu"}
    req = CandidateMatchRequest(job_id=1, student_roll_no="STU-09892", dsa_mandatory=True)
    res = run_coro(match_candidate_to_job(req, current_user=tpo_user))

    # Mandatory criteria check
    assert res["eligibility_status"] == "INELIGIBLE"
    assert res["drive_status_label"] == "CRITERIA NOT MET — DRIVE DISQUALIFIED"
    assert res["is_drive_eligible"] is False
    assert res["is_academically_eligible"] is True

    # 7. CGPA of 8.89 correctly passes minimum CGPA requirement of 8.0
    assert res["criteria_breakdown"]["cgpa"]["passed"] is True
    assert res["criteria_breakdown"]["cgpa"]["actual"] == 8.89
    assert res["criteria_breakdown"]["cgpa"]["required"] == 8.0
    assert any("CGPA: 8.89 >= 8.0 required (Passed)" in s for s in res["satisfied_criteria"])

    # 8. Failed criterion is explained accurately
    assert len(res["hard_eligibility_failures"]) == 1
    assert "Mandatory DSA cutoff not met: 7.1/10 < 7.5/10 required" in res["hard_eligibility_failures"][0]

    # No passed criterion is incorrectly marked as failed
    assert not any("CGPA" in f for f in res["hard_eligibility_failures"])
    assert not any("Backlog" in f for f in res["hard_eligibility_failures"])
    assert not any("Department" in f for f in res["hard_eligibility_failures"])


def test_arya_raju_dsa_preferred_scenario_is_needs_review():
    """6. If DSA is preferred rather than mandatory, the candidate may be NEEDS_REVIEW if all mandatory criteria pass."""
    tpo_user = {"role": "tpo", "sub": "tpo@codebuffet.edu"}
    req = CandidateMatchRequest(job_id=1, student_roll_no="STU-09892", dsa_mandatory=False)
    res = run_coro(match_candidate_to_job(req, current_user=tpo_user))

    # All mandatory criteria pass (CGPA 8.89 >= 8.0, 0 Backlogs, CSE Department)
    assert res["eligibility_status"] == "NEEDS_REVIEW"
    assert res["drive_status_label"] == "ELIGIBLE FOR DRIVE • SKILL REVIEW RECOMMENDED"
    assert res["is_drive_eligible"] is True
    assert res["is_academically_eligible"] is True
    assert len(res["hard_eligibility_failures"]) == 0

    # Skill gap in preferred DSA
    assert len(res["skill_gaps"]) == 1
    assert "Preferred DSA Score gap" in res["skill_gaps"][0]
    assert "-0.4 pts" in res["skill_gaps"][0]

    # 7. CGPA of 8.89 correctly passes minimum CGPA requirement of 8.0
    assert res["criteria_breakdown"]["cgpa"]["passed"] is True
    assert res["criteria_breakdown"]["cgpa"]["actual"] == 8.89


def test_accuracy_of_failed_vs_passed_criteria():
    """8. Ensure every failed criterion is explained accurately and no passed criterion is incorrectly marked as failed."""
    conn = get_db_connection()
    c = conn.cursor()

    # Candidate with backlogs and low CGPA: STU-2024-001 (CGPA: 6.1, Backlogs: 2)
    c.execute("SELECT * FROM students WHERE roll_no = 'STU-2024-001'")
    stud = dict(c.fetchone())
    conn.close()

    tpo_user = {"role": "tpo", "sub": "tpo@codebuffet.edu"}
    req = CandidateMatchRequest(job_id=1, student_roll_no=stud["roll_no"])
    res = run_coro(match_candidate_to_job(req, current_user=tpo_user))

    assert res["eligibility_status"] == "INELIGIBLE"
    # Failed: CGPA and Backlogs
    assert any("CGPA shortage" in f for f in res["hard_eligibility_failures"])
    assert any("Active backlogs exceed limit" in f for f in res["hard_eligibility_failures"])
    # Department passed:
    assert res["criteria_breakdown"]["department"]["passed"] is True
    assert any("Department: Computer Science & Engineering is eligible" in s for s in res["satisfied_criteria"])
    # Passed department is NOT in hard_eligibility_failures
    assert not any("Department" in f for f in res["hard_eligibility_failures"])


def test_consistency_across_match_inspect_and_database():
    """9. Verify that Match Job, Inspect, and candidate eligibility reports use consistent backend results."""
    tpo_user = {"role": "tpo", "sub": "tpo@codebuffet.edu"}

    # Test top verified candidate Aarav Sharma (STU-2024-042)
    req = CandidateMatchRequest(job_id=1, student_roll_no="STU-2024-042")
    res = run_coro(match_candidate_to_job(req, current_user=tpo_user))

    # All criteria pass (CGPA 8.42 >= 8.0, 0 Backlogs, DSA 8.5 >= 7.5, Aptitude 78 >= 75)
    assert res["eligibility_status"] == "ELIGIBLE"
    assert res["is_drive_eligible"] is True
    assert res["match_score"] >= 90.0
    assert len(res["hard_eligibility_failures"]) == 0
    assert len(res["skill_gaps"]) == 0
