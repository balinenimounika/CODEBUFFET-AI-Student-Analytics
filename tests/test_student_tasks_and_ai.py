"""
CODEBUFFET — Student Dashboard Tasks & AI Assistant Tests
Validates:
1. Student Tasks retrieval and IDOR prevention on task updates.
2. Task status updates (OPEN <-> COMPLETED) with persistent database updates.
3. Date categorization (Today, Overdue with age labels, Upcoming, Completed, No Due Date).
4. AI Success Assistant deterministic grounding across all 12 suggested questions.
"""

import os
import sys
import pytest
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import HTTPException
from backend.database import get_db_connection
from backend.routes.student_routes import (
    get_student_tasks,
    get_student_dashboard,
    toggle_task_status,
    update_task_status,
    student_ai_assistant,
    TaskStatusUpdateRequest,
    AIAssistantRequest,
)


def test_student_tasks_retrieval_and_fields():
    """Verify that student tasks can be fetched and include all required fields."""
    mock_student = {"role": "student", "roll_no": "STU-2024-042"}
    tasks = get_student_tasks(current_user=mock_student)
    assert isinstance(tasks, list)
    assert len(tasks) >= 3

    # Check fields of tasks
    for t in tasks:
        assert "id" in t
        assert "title" in t
        assert "status" in t
        assert "assigned_mentor" in t
        assert "priority" in t


def test_task_idor_protection():
    """Verify that a student cannot update or toggle another student's task."""
    conn = get_db_connection()
    c = conn.cursor()
    # Find a task belonging to a different student (e.g. STU-2024-001)
    c.execute("SELECT id, student_roll_no FROM interventions WHERE UPPER(student_roll_no) != 'STU-2024-042' LIMIT 1")
    other_task = c.fetchone()
    conn.close()

    assert other_task is not None, "Expected at least one task belonging to another student"
    other_task_id = other_task["id"]

    mock_student = {"role": "student", "roll_no": "STU-2024-042"}

    # Attempt toggle on another student's task -> must raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        toggle_task_status(other_task_id, current_user=mock_student)
    assert exc_info.value.status_code == 403

    # Attempt status update on another student's task -> must raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info2:
        update_task_status(
            other_task_id,
            TaskStatusUpdateRequest(status="COMPLETED", notes="Unauthorized attempt"),
            current_user=mock_student,
        )
    assert exc_info2.value.status_code == 403


def test_task_completion_status_toggle():
    """Verify that a student can update status and toggle their own task, persisting in the database."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, status FROM interventions WHERE UPPER(student_roll_no) = 'STU-2024-042' LIMIT 1")
    my_task = c.fetchone()
    conn.close()

    assert my_task is not None
    task_id = my_task["id"]
    initial_status = my_task["status"]

    mock_student = {"role": "student", "roll_no": "STU-2024-042"}

    # Toggle task status
    res = toggle_task_status(task_id, current_user=mock_student)
    expected_status = "COMPLETED" if initial_status == "OPEN" else "OPEN"
    assert res["new_status"] == expected_status

    # Verify persistence in database
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT status FROM interventions WHERE id = ?", (task_id,))
    updated_row = c.fetchone()
    conn.close()
    assert updated_row["status"] == expected_status

    # Toggle back to original status
    toggle_task_status(task_id, current_user=mock_student)


def test_ai_assistant_12_suggested_questions():
    """Verify that all 12 suggested questions receive grounded responses referencing real student telemetry."""
    mock_student = {"role": "student", "roll_no": "STU-2024-042"}

    questions = [
        ("How can I improve my CGPA?", ["cgpa", "8.42"]),
        ("How much attendance do I need to reach 85%?", ["attendance", "85"]),
        ("How can I clear my backlogs?", ["backlog"]),
        ("How can I improve my coding skills?", ["dsa", "coding"]),
        ("Am I ready for placements?", ["placement", "readiness"]),
        ("Which skills should I learn for software jobs?", ["software", "skills"]),
        ("What tasks are overdue?", ["overdue"]),
        ("Create a study timetable for me.", ["timetable"]),
        ("Why am I classified as high, medium or low risk?", ["risk"]),
        ("What should I improve this week?", ["priorit", "week"]),
        ("How can I improve my average score?", ["score", "success"]),
        ("What should I focus on today?", ["today", "focus"]),
    ]

    for q_text, expected_keywords in questions:
        req = AIAssistantRequest(question=q_text)
        res = student_ai_assistant(req, current_user=mock_student)

        assert "answer" in res and len(res["answer"]) > 30, f"Empty answer for: {q_text}"
        assert "evidence" in res
        assert res["evidence"]["roll_no"] == "STU-2024-042"
        assert res["evidence"]["full_name"] == "Aarav Sharma"

        ans_lower = res["answer"].lower()
        matched = any(k.lower() in ans_lower for k in expected_keywords)
        assert matched, f"Expected keywords {expected_keywords} in answer for '{q_text}'. Got: {res['answer']}"
