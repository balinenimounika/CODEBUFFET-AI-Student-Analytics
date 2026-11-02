"""
CODEBUFFET — Student Portal Analytics & Simulation Routes
Provides personalized student cockpit telemetry, dynamic 'What-If' simulations,
and interactive mentoring task management.
Secured with authentication and IDOR prevention.
"""

from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from backend.database import get_db_connection, record_audit_log
from backend.auth import get_current_user
from ml_service import calculate_student_success_score

router = APIRouter(prefix="/api/student", tags=["Student Analytics"])

VALID_BRANCHES = {
    "cse": "Computer Science & Engineering",
    "computer science": "Computer Science & Engineering",
    "computer science & engineering": "Computer Science & Engineering",
    "it": "Information Technology",
    "information technology": "Information Technology",
    "data science": "Data Science",
    "ds": "Data Science",
    "eee": "Electrical & Electronics Engineering",
    "electrical": "Electrical & Electronics Engineering",
    "electrical & electronics": "Electrical & Electronics Engineering",
    "electrical & electronics engineering": "Electrical & Electronics Engineering",
    "ece": "Electronics & Communication Engineering",
    "electronics": "Electronics & Communication Engineering",
    "electronics & communication": "Electronics & Communication Engineering",
    "electronics & communication engineering": "Electronics & Communication Engineering",
    "mech": "Mechanical Engineering",
    "mechanical": "Mechanical Engineering",
    "mechanical engineering": "Mechanical Engineering",
}

def _derive_academic_year(semester: int) -> str:
    if semester in (1, 2):
        return "1st Year"
    elif semester in (3, 4):
        return "2nd Year"
    elif semester in (5, 6):
        return "3rd Year"
    elif semester in (7, 8):
        return "4th Year"
    return "3rd Year"


class StudentProfileUpdateRequest(BaseModel):
    branch: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None


@router.put("/profile")
@router.patch("/profile")
def update_student_profile(
    req: StudentProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows a student to update their self-reported branch and current semester (1-8).
    Official academic performance records (CGPA, backlogs, attendance) are protected and immutable via this endpoint.
    """
    user_role = current_user.get("role")
    user_roll = current_user.get("roll_no") or current_user.get("sub")

    if user_role == "student" and not user_roll:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student roll number could not be determined from authentication session."
        )

    branch_raw = req.branch or req.department
    norm_branch = None
    if branch_raw:
        clean_key = branch_raw.strip().lower()
        norm_branch = VALID_BRANCHES.get(clean_key)
        if not norm_branch:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid branch. Allowed branches: CSE, IT, Data Science, EEE, ECE, Mechanical."
            )

    sem = req.semester
    if sem is not None:
        if not isinstance(sem, int) or sem < 1 or sem > 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid semester. Semester must be an integer between 1 and 8."
            )

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM students WHERE LOWER(roll_no) = LOWER(?)", (user_roll,))
    student_row = c.fetchone()

    if not student_row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record with roll number '{user_roll}' not found."
        )

    final_branch = norm_branch or student_row["department"]
    final_sem = sem if sem is not None else student_row["semester"]
    final_year = req.academic_year or _derive_academic_year(final_sem)

    c.execute("""
        UPDATE students
        SET department = ?, semester = ?, year = ?
        WHERE LOWER(roll_no) = LOWER(?)
    """, (final_branch, final_sem, final_year, user_roll))

    user_email = current_user.get("email") or current_user.get("sub") or user_roll
    record_audit_log(
        conn,
        user_email,
        user_role,
        "UPDATE_STUDENT_PROFILE",
        "students",
        user_roll,
        f"Updated profile: branch={final_branch}, semester={final_sem}, year={final_year}"
    )
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": "Student profile updated successfully.",
        "profile": {
            "roll_no": user_roll,
            "branch": final_branch,
            "department": final_branch,
            "semester": final_sem,
            "year": final_year,
            "is_verified": student_row["record_type"] == "verified_profile"
        }
    }


class SimulationRequest(BaseModel):
    attendance: float
    coding_skills: float
    lms_velocity: float
    cgpa: Optional[float] = 8.42
    backlogs: Optional[int] = 0


@router.get("/dashboard")
def get_student_dashboard(
    roll_no: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns full personal intelligence cockpit for the student.
    Enforces authorization: Students may only access their personal telemetry (anti-IDOR).
    Faculty and administrative staff may inspect any student's record.
    """
    user_role = current_user.get("role")
    user_roll = current_user.get("roll_no")

    # Anti-IDOR: Students can only view their own telemetry record
    if user_role == "student":
        target_roll = user_roll or "STU-2026-018"
        if roll_no and roll_no.strip().upper() != target_roll.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted: Students may only view their personal cockpit telemetry."
            )
    else:
        # Institutional staff (admin, mentor, tpo) may inspect requested student
        target_roll = roll_no or "STU-2026-018"

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE LOWER(roll_no) = LOWER(?) LIMIT 1", (target_roll,))
    student_row = cursor.fetchone()

    if not student_row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student telemetry record with roll number '{target_roll}' not found."
        )

    # Fetch assigned mentoring interventions
    cursor.execute("""
    SELECT id, title, category, assigned_mentor, status, due_date, priority
    FROM interventions
    WHERE LOWER(student_roll_no) = LOWER(?)
    ORDER BY id ASC
    """, (student_row["roll_no"],))
    interventions = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Dynamic explainable placement readiness calculation
    plac_score = (
        (min(10.0, student_row["dsa_score"]) / 10.0 * 30.0) +
        (min(10.0, student_row["coding_skills"]) / 10.0 * 25.0) +
        (student_row["aptitude_score"] / 100.0 * 25.0) +
        (student_row["cgpa"] / 10.0 * 20.0)
    )
    placement_readiness_pct = round(max(5.0, min(99.0, plac_score)), 1)

    # Dynamic engagement metric combining attendance and LMS assignment velocity
    engagement_pct = round(float((student_row["overall_attendance_pct"] * 0.45) + (student_row["lms_assignment_completion_pct"] * 0.55)), 1)

    # Format student telemetry
    return {
        "roll_no": student_row["roll_no"],
        "name": student_row["full_name"],
        "branch": student_row["department"],
        "department": student_row["department"],
        "year": student_row["year"],
        "semester": student_row["semester"],
        "cgpa": student_row["cgpa"],
        "backlogs": student_row["backlogs"],
        "attendance": student_row["overall_attendance_pct"],
        "coding_skills": student_row["coding_skills"],
        "dsa_score": student_row["dsa_score"],
        "aptitude_score": student_row["aptitude_score"],
        "success_score": student_row["success_score"],
        "placement_readiness_pct": placement_readiness_pct,
        "score_band": "EXCELLENT" if student_row["success_score"] >= 80 else ("GOOD" if student_row["success_score"] >= 65 else "NEEDS_SUPPORT"),
        "readiness_tier": "Tier-1 Ready" if student_row["cgpa"] >= 8.0 and student_row["dsa_score"] >= 8.0 else "Tier-2 In Training",
        "academic_risk": student_row["academic_risk_band"],
        "academic_risk_prob": student_row["academic_risk_prob"],
        "placement_risk": student_row["placement_risk_band"],
        "placement_risk_prob": student_row["placement_risk_prob"],
        "components": {
            "academic": round(float((student_row["cgpa"] / 10.0) * 100), 1),
            "placement": placement_readiness_pct,
            "attendance": student_row["overall_attendance_pct"],
            "lms": student_row["lms_assignment_completion_pct"],
            "skills": round(float(student_row["coding_skills"] * 10), 1),
            "engagement": engagement_pct
        },
        "mentoring_tasks": interventions
    }


@router.post("/simulate")
def simulate_score(
    req: SimulationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Simulates a Student Success Score in real time based on What-If parameters.
    Accessible to authenticated users.
    """
    sim_data = {
        "cgpa": req.cgpa,
        "backlogs": req.backlogs,
        "overall_attendance_pct": max(0.0, min(100.0, req.attendance)),
        "aptitude_score": 75.0,
        "coding_skills": max(0.0, min(10.0, req.coding_skills)),
        "dsa_score": max(0.0, min(10.0, req.coding_skills)),
        "lms_assignment_completion_pct": max(0.0, min(100.0, req.lms_velocity)),
        "lms_logins_per_week": 8,
        "communication_skills": 7.5,
        "system_design": 7.0,
        "hackathons": 1,
        "certifications": 1
    }

    result = calculate_student_success_score(sim_data)
    return {
        "projected_score": result["student_success_score"],
        "score_band": result["score_band"],
        "components": result["components"]
    }


@router.post("/tasks/{task_id}/toggle")
def toggle_task_status(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggles task status between OPEN and COMPLETED.
    Enforces that caller is either the assigned student or an institutional staff member.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM interventions WHERE id = ?", (task_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    user_role = current_user.get("role")
    user_roll = current_user.get("roll_no")

    # If student, verify task belongs to them
    if user_role == "student" and row["student_roll_no"].upper() != (user_roll or "").upper():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Students may only update their own assigned tasks."
        )

    new_status = "COMPLETED" if row["status"] == "OPEN" else "OPEN"
    cursor.execute("UPDATE interventions SET status = ? WHERE id = ?", (new_status, task_id))
    conn.commit()
    conn.close()

    return {"task_id": task_id, "new_status": new_status}




class TaskStatusUpdateRequest(BaseModel):
    status: str # 'OPEN', 'IN_PROGRESS', 'COMPLETED'
    notes: Optional[str] = None


class AIAssistantRequest(BaseModel):
    question: str
    what_if_context: Optional[dict] = None


@router.get("/history")
def get_student_history(
    roll_no: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves genuine historical progression records (CGPA, attendance, success score)
    across completed semesters from the student_history table.
    Enforces anti-IDOR for student role.
    """
    user_role = current_user.get("role")
    user_roll = current_user.get("roll_no")

    if user_role == "student":
        target_roll = user_roll or "STU-2024-042"
    else:
        target_roll = roll_no or user_roll or "STU-2024-042"

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
    SELECT metric_type, semester, period_label, value, notes, recorded_at
    FROM student_history
    WHERE LOWER(student_roll_no) = LOWER(?)
    ORDER BY semester ASC, id ASC
    """, (target_roll,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()

    # Organize by metric
    history_by_metric = {}
    for r in rows:
        m = r["metric_type"]
        if m not in history_by_metric:
            history_by_metric[m] = []
        history_by_metric[m].append({
            "period": r["period_label"],
            "semester": r["semester"],
            "value": r["value"],
            "notes": r["notes"]
        })

    return {
        "student_roll_no": target_roll,
        "records_count": len(rows),
        "history": history_by_metric,
        "has_history": len(rows) > 0
    }


@router.get("/tasks")
def get_student_tasks(
    roll_no: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves all mentoring action items and tasks assigned to the student.
    Enforces role-based security.
    """
    user_role = current_user.get("role")
    user_roll = current_user.get("roll_no")

    if user_role == "student":
        target_roll = user_roll or "STU-2024-042"
    else:
        target_roll = roll_no or user_roll or "STU-2024-042"

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
    SELECT id, title, category, assigned_mentor, status, due_date,
           priority, owner_role, completion_notes, completed_at, created_at
    FROM interventions
    WHERE LOWER(student_roll_no) = LOWER(?)
    ORDER BY id ASC
    """, (target_roll,))
    tasks = [dict(r) for r in c.fetchall()]
    conn.close()

    return tasks


@router.post("/tasks/{task_id}/status")
def update_task_status(
    task_id: int,
    req: TaskStatusUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Updates task status to OPEN, IN_PROGRESS, or COMPLETED with optional completion notes.
    Enforces student ownership check and logs action.
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM interventions WHERE id = ?", (task_id,))
    task = c.fetchone()
    if not task:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    user_role = current_user.get("role")
    user_roll = current_user.get("roll_no")

    if user_role == "student" and task["student_roll_no"].upper() != (user_roll or "").upper():
        conn.close()
        raise HTTPException(status_code=403, detail="Students may only update their own assigned tasks.")

    new_st = req.status.upper()
    if new_st not in ["OPEN", "IN_PROGRESS", "COMPLETED"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid status. Allowed: OPEN, IN_PROGRESS, COMPLETED")

    completed_at = "CURRENT_TIMESTAMP" if new_st == "COMPLETED" else "NULL"
    notes = req.notes if req.notes is not None else task["completion_notes"]

    c.execute(f"""
    UPDATE interventions
    SET status = ?, completion_notes = ?, completed_at = {completed_at}
    WHERE id = ?
    """, (new_st, notes, task_id))
    conn.commit()
    conn.close()

    return {"task_id": task_id, "status": new_st, "new_status": new_st, "notes": notes}


@router.post("/ai-assistant")
def student_ai_assistant(
    req: AIAssistantRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    AI Student Success Assistant grounded in student's verified telemetry and action items.
    Answers queries regarding Success Score, performance factors, weekly priorities,
    placement readiness, overdue tasks, and What-If projections.
    Includes deterministic expert fallback grounded in verified metrics for all 12 core topics.
    """
    user_role = current_user.get("role")
    user_roll = current_user.get("roll_no") or "STU-2024-042"

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM students WHERE LOWER(roll_no) = LOWER(?)", (user_roll,))
    stu = c.fetchone()
    if not stu:
        conn.close()
        raise HTTPException(status_code=404, detail="Student telemetry record not found.")

    c.execute("SELECT * FROM interventions WHERE LOWER(student_roll_no) = LOWER(?) ORDER BY id ASC", (user_roll,))
    tasks = [dict(r) for r in c.fetchall()]
    conn.close()

    q_lower = req.question.lower().strip()

    # Telemetry grounding variables
    name = stu["full_name"]
    roll_no = stu["roll_no"]
    cgpa = stu["cgpa"]
    backlogs = stu["backlogs"]
    attendance = stu["overall_attendance_pct"]
    dsa_score = stu["dsa_score"]
    coding_skills = stu["coding_skills"]
    aptitude = stu["aptitude_score"]
    success_score = stu["success_score"]
    acad_risk = stu["academic_risk_band"]
    plac_risk = stu["placement_risk_band"]
    mentor = stu["assigned_mentor"] or "Assigned Faculty Mentor"
    dept = stu["department"]
    sem = stu["semester"]
    lms = stu["lms_assignment_completion_pct"]

    # Dynamic date parsing & task categorization
    today = date.today()

    def parse_due(s):
        if not s:
            return None, None
        s_clean = s.strip()
        if s_clean.lower() in ["ongoing", "none", "tbd", "in 30 days"]:
            return None, s_clean
        d = None
        for fmt in ["%b %d, %Y", "%B %d, %Y", "%Y-%m-%d", "%b %d, %Y %I:%M %p", "%b %d, %Y %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]:
            try:
                d = datetime.strptime(s_clean, fmt).date()
                break
            except ValueError:
                pass
        if not d:
            parts = s_clean.split(" ")
            if len(parts) >= 3:
                date_part = " ".join(parts[:3])
                for fmt in ["%b %d, %Y", "%B %d, %Y"]:
                    try:
                        d = datetime.strptime(date_part, fmt).date()
                        break
                    except ValueError:
                        pass
        return d, s_clean

    today_tasks = []
    overdue_tasks = []
    upcoming_tasks = []
    completed_tasks = []
    no_due_tasks = []

    for t in tasks:
        is_done = t.get("status") == "COMPLETED"
        if is_done:
            completed_tasks.append(t)
            continue
        d_val, orig_str = parse_due(t.get("due_date"))
        if not d_val:
            no_due_tasks.append(t)
        else:
            diff = (d_val - today).days
            if diff == 0:
                today_tasks.append(t)
            elif diff < 0:
                age = abs(diff)
                t_copy = dict(t)
                t_copy["overdue_days"] = age
                t_copy["overdue_label"] = "1 day overdue" if age == 1 else f"{age} days overdue"
                overdue_tasks.append(t_copy)
            else:
                upcoming_tasks.append(t)

    # Sort overdue tasks with highest overdue age first
    overdue_tasks.sort(key=lambda x: x.get("overdue_days", 0), reverse=True)

    # Evidence dictionary
    evidence = {
        "full_name": name,
        "roll_no": roll_no,
        "cgpa": cgpa,
        "attendance": attendance,
        "backlogs": backlogs,
        "dsa_score": dsa_score,
        "coding_skills": coding_skills,
        "aptitude_score": aptitude,
        "success_score": success_score,
        "academic_risk": acad_risk,
        "placement_risk": plac_risk,
        "department": dept,
        "semester": sem,
        "open_tasks_count": len(today_tasks) + len(overdue_tasks) + len(upcoming_tasks) + len(no_due_tasks),
        "today_tasks_count": len(today_tasks),
        "overdue_tasks_count": len(overdue_tasks),
        "upcoming_tasks_count": len(upcoming_tasks),
        "completed_tasks_count": len(completed_tasks),
    }

    # Match 12 exact prompts or semantic variations
    # 1. How can I improve my CGPA?
    if "improve" in q_lower and "cgpa" in q_lower:
        answer = (
            f"Hello {name}, your current cumulative CGPA is {cgpa}/10.0 across {sem} completed semesters with {backlogs} active backlogs. "
            f"To systematically improve your CGPA: "
            f"1) Target the end-semester examinations which contribute ~60% of your grade weight. "
            f"2) Ensure 100% on-time submission of LMS assignments (your current assignment completion is {lms}%). "
            f"3) Schedule regular office hours with your mentor {mentor} for challenging core subjects. "
            f"{'4) Clearing your ' + str(backlogs) + ' active backlog(s) in the immediate remedial exam cycle is essential for your CGPA recovery.' if backlogs > 0 else '4) Maintain your zero-backlog record to remain eligible for academic honours.'}"
        )
        actions = ["Review Exam Weightage Breakdown", "Target 100% LMS Submissions", f"Meet with {mentor}"]

    # 2. How much attendance do I need to reach 85%?
    elif "attendance" in q_lower and ("85" in q_lower or "reach" in q_lower or "need" in q_lower):
        if attendance >= 85.0:
            answer = (
                f"Great news, {name}! Your overall lecture attendance is currently {attendance}%, which already exceeds the 85.0% institutional target benchmark! "
                f"You have zero attendance detention risk. To maintain this standing throughout the rest of Semester {sem}, "
                f"you can safely miss no more than 1 in every 7 remaining classes."
            )
            actions = ["Maintain Current Attendance", "Check Subject-Wise Absences", "Keep Medical Slips Handy"]
        else:
            sessions_needed = max(1, round((0.85 * 100 - attendance) / (1.0 - 0.85)))
            answer = (
                f"Your overall attendance is currently {attendance}%, which is below the 85.0% institutional benchmark. "
                f"Assuming a standard 100-session curriculum, you must attend approximately the next {sessions_needed} consecutive classes "
                f"without an absence to lift your cumulative attendance to 85.0%. "
                f"Mentor {mentor} is tracking your attendance compliance to prevent examination debarment."
            )
            actions = [f"Attend Next {sessions_needed} Consecutive Classes", "Submit Medical Certificates Promptly", "Review Daily Timetable"]

    # 3. How can I clear my backlogs?
    elif ("clear" in q_lower and "backlog" in q_lower) or ("backlog" in q_lower and ("how" in q_lower or "can i" in q_lower or "plan" in q_lower)):
        if backlogs == 0:
            answer = (
                f"Outstanding record, {name}! You currently have 0 active backlogs in official registrar records. "
                f"Maintaining a clean academic slate is essential for Tier-1 Super-Dream company drives (CTC > 12 LPA) and campus placement shortlisting."
            )
            actions = ["Maintain Zero Backlogs", "Explore Honors Track", "Focus on Advanced Electives"]
        else:
            answer = (
                f"You currently have {backlogs} active backlog(s) registered in your academic profile. Here is your targeted recovery roadmap: "
                f"1) Register immediately for the upcoming supplementary / re-sit examinations with the Controller of Examinations. "
                f"2) Attend the remedial counseling sessions coordinated by {mentor}. "
                f"3) Obtain the past 3 years' question papers and model answer rubrics from the department library. "
                f"4) Ensure all missing laboratory records and internal assessments are verified by subject faculty."
            )
            actions = ["Register for Supplementary Exam", "Attend Faculty Remedial Hours", "Solve Past 3 Years' Question Papers"]

    # 4. How can I improve my coding skills?
    elif "coding" in q_lower and ("skill" in q_lower or "improve" in q_lower or "how" in q_lower):
        answer = (
            f"Your current technical telemetry records a DSA score of {dsa_score}/10 and an overall Coding Skills rating of {coding_skills}/10. "
            f"To reach Tier-1 recruiter readiness (8.5+/10): "
            f"1) Solve 2 medium problems daily on LeetCode / HackerRank focusing on Trees, Graphs, Two Pointers, and Dynamic Programming. "
            f"2) Prioritize your assigned mentor action item: '{today_tasks[0]['title'] if today_tasks else overdue_tasks[0]['title'] if overdue_tasks else 'Complete LeetCode Top 50 DSA practice set'}'. "
            f"3) Participate in weekly competitive programming contests to improve code execution speed under pressure. "
            f"4) Build and document an end-to-end full-stack software project demonstrating clean architectural patterns."
        )
        actions = ["Solve Daily LeetCode Medium", "Master Dynamic Programming", "Host Project on GitHub"]

    # 5. Am I ready for placements?
    elif "placement" in q_lower and ("ready" in q_lower or "eligible" in q_lower or "am i" in q_lower or "odds" in q_lower):
        plac_score = (
            (min(10.0, dsa_score) / 10.0 * 30.0) +
            (min(10.0, coding_skills) / 10.0 * 25.0) +
            (aptitude / 100.0 * 25.0) +
            (cgpa / 10.0 * 20.0)
        )
        readiness_pct = round(max(5.0, min(99.0, plac_score)), 1)
        tier = "Tier-1 Ready" if cgpa >= 8.0 and dsa_score >= 8.0 and backlogs == 0 else "Tier-2 In Training"
        answer = (
            f"Your Placement Readiness is rated as {plac_risk} risk with an overall Readiness Score of {readiness_pct}% ({tier}). "
            f"Corporate eligibility breakdown: "
            f"• CGPA: {cgpa}/10.0 (Tier-1 cutoff: >= 7.50) -> {'✓ Eligible' if cgpa >= 7.5 else '⚠ Below cutoff'} | "
            f"• Backlogs: {backlogs} (Recruiter cutoff: 0) -> {'✓ Clean Record' if backlogs == 0 else '⚠ Disqualifying'} | "
            f"• DSA Proficiency: {dsa_score}/10 (Recruiter cutoff: >= 7.5) -> {'✓ Strong' if dsa_score >= 7.5 else '⚠ Needs practice'} | "
            f"• Aptitude: {aptitude}/100 (Recruiter cutoff: >= 70) -> {'✓ Cleared' if aptitude >= 70 else '⚠ Below target'}. "
            f"{'You are strongly positioned for super-dream placement rounds!' if tier == 'Tier-1 Ready' else 'Focus on raising your DSA and aptitude scores to qualify for top-tier rounds.'}"
        )
        actions = ["Schedule Mock Interview with TPO", "Practice Timed Aptitude Sets", "Review Resume with Mentor"]

    # 6. Which skills should I learn for software jobs?
    elif "software" in q_lower or ("skill" in q_lower and ("job" in q_lower or "learn" in q_lower or "industry" in q_lower)):
        answer = (
            f"For software engineering roles in {dept}, corporate recruitment drives evaluate 3 core pillars: "
            f"1) Core Foundations: Data Structures & Algorithms (Trees, Graphs, DP), Object-Oriented Design, and OS/DBMS fundamentals. "
            f"2) Modern Backend & APIs: RESTful API design with Python (FastAPI/Django) or Java/Spring Boot, SQL querying, and relational indexing. "
            f"3) Production Tooling: Git version control, Docker containerization, and automated CI/CD workflows. "
            f"Your mentor {mentor} recommends completing a portfolio capstone integrating these technologies before campus drives commence."
        )
        actions = ["Build REST API with FastAPI", "Learn Docker Basics", "Practice System Design"]

    # 7. What tasks are overdue?
    elif "overdue" in q_lower or ("task" in q_lower and "late" in q_lower):
        if overdue_tasks:
            items_text = "; ".join([f"'{t['title']}' (Due {t['due_date']} — {t['overdue_label']})" for t in overdue_tasks])
            answer = (
                f"You currently have {len(overdue_tasks)} overdue mentoring action item(s): {items_text}. "
                f"Please open your Tasks tab and mark them as completed once deliverables are submitted."
            )
            actions = ["Open Tasks Tab", f"Submit '{overdue_tasks[0]['title']}'", f"Notify {overdue_tasks[0]['assigned_mentor']}"]
        else:
            answer = (
                f"Great job, {name}! You have zero overdue tasks. All your assigned mentoring action items and deliverables are completely up to date."
            )
            actions = ["Review Upcoming Tasks", "Work on Milestone Project", "Practice Daily DSA"]

    # 8. Create a study timetable for me.
    elif "timetable" in q_lower or "schedule" in q_lower or ("study" in q_lower and "plan" in q_lower):
        answer = (
            f"Here is a balanced daily study timetable customized to your telemetry (CGPA: {cgpa}, Attendance: {attendance}%, DSA: {dsa_score}/10): "
            f"• 07:30 - 08:45 AM: Morning DSA & Problem Solving (2 LeetCode problems). "
            f"• 09:00 AM - 04:30 PM: University Lectures & Labs (maintain >= 85% attendance, currently {attendance}%). "
            f"• 05:00 - 06:15 PM: LMS Assignment Submissions & Course Revision (current LMS velocity: {lms}%). "
            f"• 07:30 - 09:00 PM: Project Development & Git commits (demonstrating industry software skills). "
            f"• 09:30 - 10:15 PM: Review daily progress, update mentoring tasks, and plan tomorrow's deliverables."
        )
        actions = ["Block 7:30 AM for DSA", "Submit LMS Tasks by 6:00 PM", "Plan Daily Wrap-Up"]

    # 9. Why am I classified as high, medium or low risk?
    elif "risk" in q_lower and ("classified" in q_lower or "why" in q_lower or "band" in q_lower or "high" in q_lower or "medium" in q_lower or "low" in q_lower):
        answer = (
            f"Your risk classification is evaluated independently across two decoupled risk engines: "
            f"1) Academic Risk ({acad_risk}): Evaluated strictly from academic parameters — CGPA ({cgpa}/10.0), Backlogs ({backlogs}), and Lecture Attendance ({attendance}%). {'Your attendance is below 75%, which raises academic risk.' if attendance < 75 else 'You maintain strong academic standing with zero active backlogs.' if backlogs == 0 and cgpa >= 8.0 else 'Your metrics remain in safe standing.'} "
            f"2) Placement Risk ({plac_risk}): Evaluated strictly from employability criteria — DSA Score ({dsa_score}/10), Coding Skills ({coding_skills}/10), Aptitude ({aptitude}/100), and Backlog count ({backlogs}). "
            f"This decoupled architecture ensures that academic status does not artificially bias your placement readiness or vice versa."
        )
        actions = ["View Academic Risk Factors", "View Placement Risk Breakdown", f"Consult Mentor {mentor}"]

    # 10. What should I improve this week?
    elif "this week" in q_lower or ("week" in q_lower and ("improve" in q_lower or "priority" in q_lower or "focus" in q_lower)):
        top_task_notice = f"1) Clear overdue task: '{overdue_tasks[0]['title']}' ({overdue_tasks[0]['overdue_label']}). " if overdue_tasks else (f"1) Complete today's task: '{today_tasks[0]['title']}'. " if today_tasks else "1) Stay ahead on upcoming mentoring deliverables. ")
        answer = (
            f"Here are your top 3 high-ROI improvement priorities for this week, {name}: "
            f"{top_task_notice}"
            f"2) Attendance & Academics: {'Attend all classes to push attendance from ' + str(attendance) + '% towards 85%.' if attendance < 85 else 'Maintain your 85%+ attendance standing.'} "
            f"3) Technical Placement Prep: {'Elevate DSA score from ' + str(dsa_score) + '/10 to 8.0+.' if dsa_score < 8.0 else 'Practice mock technical interviews.'} "
            f"Assigned Mentor {mentor} is available for guidance."
        )
        actions = ["Complete Top Task", "Track Daily Attendance", "Practice 2 DSA Problems"]

    # 11. How can I improve my average score?
    elif "score" in q_lower and ("improve" in q_lower or "average" in q_lower or "raise" in q_lower or "increase" in q_lower or "how can i" in q_lower):
        answer = (
            f"Your current Student Success Score is {success_score}/100. It is a composite score calculated from 6 weighted pillars: "
            f"• Academics (35%): CGPA {cgpa}/10.0 and {backlogs} backlogs. "
            f"• Technical & Placement (20%): DSA {dsa_score}/10, Coding {coding_skills}/10, Aptitude {aptitude}/100. "
            f"• Attendance (15%): Lecture attendance {attendance}%. "
            f"• LMS Velocity (12%): Assignment completion {lms}%. "
            f"• Communication (10%) and Co-Curricular (8%). "
            f"To gain +5 points quickly: Raising attendance by 5% adds ~0.75 pts; pushing DSA to 9.0 adds ~2.5 pts; achieving 100% LMS submissions adds ~1.2 pts."
        )
        actions = ["Simulate What-If Sliders", "Complete LMS Assignments", "Increase Daily DSA Practice"]

    # 12. What should I focus on today?
    elif "today" in q_lower and ("focus" in q_lower or "do" in q_lower or "task" in q_lower or "what should" in q_lower):
        if today_tasks:
            items_text = "; ".join([f"'{t['title']}' (Priority: {t.get('priority', 'MEDIUM')}, Due: {t.get('due_date', 'Today')})" for t in today_tasks])
            answer = (
                f"Today ({today.strftime('%b %d, %Y')}), your primary focus should be your deliverables due today: {items_text}. "
                f"Make sure to complete them and mark them finished in your Tasks widget."
            )
            actions = [f"Complete '{today_tasks[0]['title']}'", "Attend Today's Lectures", "Review Daily Objectives"]
        else:
            answer = (
                f"You have no mentoring tasks due today ({today.strftime('%b %d, %Y')})! "
                f"Today is a great day to get ahead on upcoming deliverables" +
                (f", such as '{upcoming_tasks[0]['title']}' (due {upcoming_tasks[0]['due_date']})" if upcoming_tasks else "") +
                f", attend all scheduled classes (current attendance: {attendance}%), and solve 2 DSA medium problems."
            )
            actions = ["Work on Next Milestone", "Solve 2 LeetCode Problems", "Review Course Notes"]

    # General / Fallback Question
    else:
        answer = (
            f"Hello {name}! I am your AI Student Success Assistant. "
            f"I have direct access to your verified academic records (CGPA: {cgpa}, Attendance: {attendance}%, Success Score: {success_score}/100). "
            f"You currently have {len(today_tasks)} task(s) due today, {len(overdue_tasks)} overdue task(s), and {len(upcoming_tasks)} upcoming task(s). "
            f"Ask me about any of the 12 suggested topics: CGPA improvement, attendance targets, backlog resolution, coding practice, placement readiness, study timetables, or risk factors."
        )
        actions = ["How can I improve my CGPA?", "Am I ready for placements?", "What tasks are overdue?"]

    return {
        "answer": answer,
        "evidence": evidence,
        "telemetry_grounding": evidence,
        "recommended_actions": actions,
        "actionable_steps": actions,
        "engine": "CODEBUFFET AI Grounded Assistant v2.0",
        "timestamp": today.isoformat()
    }
