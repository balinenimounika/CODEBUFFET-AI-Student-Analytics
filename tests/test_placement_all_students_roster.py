"""
CODEBUFFET — Complete 50,008 Student Candidate Roster Verification Tests
Verifies:
1. SQLite Database Census: Exactly 50,008 student records and 50,008 unique roll numbers.
2. Server-Side Pagination: Default limit 50, offsets, total pages calculation, disjoint pages.
3. Filtering & Sorting: Multi-field filters (search, department, CGPA, DSA, aptitude, risk, backlogs) and sorting.
4. Placement Analytics Metrics: Authoritative counts for registered (50,008), verified (8), eligible (7,766), ready (42,403), placed (1).
5. Inspect & Match Job across full roster: Works for any student from the 50,008 population.
6. Frontend Architecture: Route /placement/candidates, 13-column roster, UI indicators, and modal geometry.
"""

import os
import sys
import time
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db_connection
from backend.routes.placement_routes import (
    list_placement_candidates,
    get_placement_analytics,
    match_candidate_to_job,
    CandidateMatchRequest,
)


def run_coro(coro):
    """Executes a coroutine containing synchronous database calls."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


# ---------------------------------------------------------------------------
# 1. Database Census and Uniqueness
# ---------------------------------------------------------------------------

def test_database_50008_census_and_uniqueness():
    """Verify exactly 50,008 students exist in SQLite and roll numbers are 100% unique."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM students")
    total_students = c.fetchone()[0]

    c.execute("SELECT COUNT(DISTINCT roll_no) FROM students")
    unique_roll_nos = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM students WHERE record_type = 'anonymous_cohort'")
    benchmark_cohort = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM students WHERE record_type = 'verified_profile'")
    verified_cohort = c.fetchone()[0]

    conn.close()

    assert total_students == 50008, f"Expected 50008 total students, found {total_students}"
    assert unique_roll_nos == 50008, f"Expected 50008 unique roll numbers, found {unique_roll_nos}"
    assert benchmark_cohort == 50000, f"Expected 50000 benchmark students, found {benchmark_cohort}"
    assert verified_cohort == 8, f"Expected 8 verified students, found {verified_cohort}"


# ---------------------------------------------------------------------------
# 2. Server-side Pagination & Performance
# ---------------------------------------------------------------------------

def test_backend_candidates_pagination_and_performance():
    """Verify server-side pagination across the 50,008 records with B-tree index performance."""
    user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # Page 1 (default limit 50)
    t0 = time.time()
    page1 = run_coro(list_placement_candidates(page=1, limit=50, current_user=user))
    p1_time = time.time() - t0

    assert page1["total"] == 50008
    assert page1["page"] == 1
    assert page1["limit"] == 50
    assert page1["total_pages"] == 1001
    assert len(page1["candidates"]) == 50
    assert p1_time < 0.20, f"Paginated query took too long: {p1_time:.3f}s"

    # Page 2 (next 50)
    page2 = run_coro(list_placement_candidates(page=2, limit=50, current_user=user))
    assert page2["page"] == 2
    assert len(page2["candidates"]) == 50

    p1_rolls = {s["roll_no"] for s in page1["candidates"]}
    p2_rolls = {s["roll_no"] for s in page2["candidates"]}
    assert len(p1_rolls.intersection(p2_rolls)) == 0, "Pages 1 and 2 must have zero overlap"

    # Last Page 1001 (should contain remaining 8 students)
    page1001 = run_coro(list_placement_candidates(page=1001, limit=50, current_user=user))
    assert page1001["page"] == 1001
    assert len(page1001["candidates"]) == 8

    # Alternate page sizes
    res_25 = run_coro(list_placement_candidates(page=1, limit=25, current_user=user))
    assert res_25["total_pages"] == 2001
    assert len(res_25["candidates"]) == 25

    res_100 = run_coro(list_placement_candidates(page=1, limit=100, current_user=user))
    assert res_100["total_pages"] == 501
    assert len(res_100["candidates"]) == 100

    res_200 = run_coro(list_placement_candidates(page=1, limit=200, current_user=user))
    assert res_200["total_pages"] == 251
    assert len(res_200["candidates"]) == 200

    # Validate required candidate attributes for each student
    first_candidate = page1["candidates"][0]
    required_keys = [
        "id", "full_name", "roll_no", "department", "cgpa", "dsa_score",
        "aptitude_score", "attendance_percentage", "active_backlogs",
        "placement_readiness_score", "placement_risk_band", "eligibility_status",
        "recruitment_stage"
    ]
    for key in required_keys:
        assert key in first_candidate, f"Missing required candidate key: {key}"


# ---------------------------------------------------------------------------
# 3. Parameterized Filtering and Sorting
# ---------------------------------------------------------------------------

def test_backend_candidates_filtering_and_sorting():
    """Verify search, department, academic cutoffs, risk level, stage filters and sorting."""
    user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # Search by Roll Number
    search_res = run_coro(list_placement_candidates(search="STU-00707", current_user=user))
    assert search_res["total"] == 1
    assert search_res["candidates"][0]["roll_no"] == "STU-00707"

    # Department Filter
    cs_res = run_coro(list_placement_candidates(department="Computer Science", current_user=user))
    assert cs_res["total"] == 12541
    for c in cs_res["candidates"]:
        assert "Computer Science" in c["department"]

    # CGPA Range Filter
    cgpa_res = run_coro(list_placement_candidates(min_cgpa=9.0, max_cgpa=10.0, current_user=user))
    for c in cgpa_res["candidates"]:
        assert 9.0 <= c["cgpa"] <= 10.0

    # Backlogs Filter (zero backlogs only)
    clean_res = run_coro(list_placement_candidates(max_backlogs=0, current_user=user))
    for c in clean_res["candidates"]:
        assert c["active_backlogs"] == 0

    # Sorting: Highest CGPA first
    sort_cgpa_desc = run_coro(list_placement_candidates(sort_by="cgpa", sort_order="desc", current_user=user))
    cgpas = [c["cgpa"] for c in sort_cgpa_desc["candidates"]]
    assert cgpas == sorted(cgpas, reverse=True)

    # Sorting: Lowest CGPA first
    sort_cgpa_asc = run_coro(list_placement_candidates(sort_by="cgpa", sort_order="asc", current_user=user))
    cgpas_asc = [c["cgpa"] for c in sort_cgpa_asc["candidates"]]
    assert cgpas_asc == sorted(cgpas_asc)

    # Sorting: Name Alphabetical
    sort_name_asc = run_coro(list_placement_candidates(sort_by="name", sort_order="asc", current_user=user))
    names = [c["full_name"] for c in sort_name_asc["candidates"]]
    assert names == sorted(names)


# ---------------------------------------------------------------------------
# 4. Authoritative Placement Analytics Metrics
# ---------------------------------------------------------------------------

def test_authoritative_placement_analytics():
    """Verify placement analytics returns exact authoritative metrics across the 50,008 dataset."""
    user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}
    analytics = run_coro(get_placement_analytics(current_user=user))
    metrics = analytics["metrics"]

    assert metrics["total_registered_students"] == 50008
    assert metrics["verified_students"] == 8
    assert metrics["placement_eligible_students"] == 7766
    assert metrics["placement_ready_students"] == 42403
    assert metrics["actually_placed_students"] == 1


# ---------------------------------------------------------------------------
# 5. Inspect & Match Job Across Full Roster
# ---------------------------------------------------------------------------

def test_match_job_for_arbitrary_student_in_roster():
    """Verify Match Job evaluation logic functions accurately for any student in the 50,008 roster."""
    user = {"sub": "tpo@codebuffet.edu", "role": "tpo"}

    # Test student from deep in the dataset
    req = CandidateMatchRequest(student_roll_no="STU-00707", job_id=1)
    res = run_coro(match_candidate_to_job(req, current_user=user))

    assert res["student_roll_no"] == "STU-00707"
    assert res["student_name"] == "Karan Negi"
    assert res["company_name"] == "Microsoft"
    assert res["match_score"] >= 80.0
    assert res["eligibility_status"] in ["ELIGIBLE", "NEEDS_REVIEW", "INELIGIBLE"]
    assert res["status"] in ["ELIGIBLE", "NEEDS_REVIEW", "INELIGIBLE"]
    assert "criteria_breakdown" in res
    assert len(res["criteria_breakdown"]) >= 4


# ---------------------------------------------------------------------------
# 6. Frontend Candidate Roster Architecture
# ---------------------------------------------------------------------------

def test_frontend_candidate_roster_architecture():
    """Verify frontend routing, UI links, 13-column table, and server pagination integration."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dashboard_path = os.path.join(base_dir, "Frontend", "src", "pages", "institution", "PlacementDashboard.jsx")
    router_path = os.path.join(base_dir, "Frontend", "src", "app", "router.jsx")
    api_path = os.path.join(base_dir, "Frontend", "src", "services", "api.js")

    with open(router_path, "r", encoding="utf-8") as f:
        router_code = f.read()
    with open(dashboard_path, "r", encoding="utf-8") as f:
        dashboard_code = f.read()
    with open(api_path, "r", encoding="utf-8") as f:
        api_code = f.read()

    # Route registered in router
    assert '/placement/candidates' in router_code

    # API method implemented
    assert "getPlacementCandidates" in api_code

    # Candidate Roster view and nav buttons
    assert "activeView === 'candidates'" in dashboard_code
    assert "Candidate Roster" in dashboard_code
    assert "View All 50,008 Students" in dashboard_code
    assert "View All Students" in dashboard_code

    # Authoritative counts displayed
    assert "50,008" in dashboard_code
    assert "7766" in dashboard_code or "7,766" in dashboard_code
    assert "42403" in dashboard_code or "42,403" in dashboard_code

    # Table columns
    assert "Roll Number" in dashboard_code
    assert "Placement Risk" in dashboard_code
    assert "Readiness" in dashboard_code
    assert "Stage" in dashboard_code
    assert "Match Job" in dashboard_code

    # Server pagination controls
    assert "rosterPage" in dashboard_code
    assert "rosterData.total_pages" in dashboard_code
    assert "rosterData.total" in dashboard_code

    # Modals and auth preservation
    assert "handleLogout" in dashboard_code
    assert "Sign out" in dashboard_code
    assert 'role="dialog"' in dashboard_code
    assert 'aria-modal="true"' in dashboard_code
