"""
CODEBUFFET — Student Dashboard UI Cleanup Verification Tests
Verifies:
1. Gemini 2.5 Flash model label is completely removed from the visible student dashboard.
2. AI Success Assistant heading and "Telemetry Grounded" status indicator are preserved.
3. Edit Program button and icon are completely removed from the student cockpit header.
4. Academic program information (Year, Department, Semester) is preserved.
5. Back to Landing Page link is preserved.
6. AI Assistant chatbot functionality and backend telemetry integration are preserved.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.routes.student_routes import student_ai_assistant, AIAssistantRequest, get_student_dashboard


# ---------------------------------------------------------------------------
# 1. UI Cleanup Verification (Frontend JSX Inspection)
# ---------------------------------------------------------------------------

def test_gemini_model_label_removed():
    """Verify 'Gemini 2.5 Flash' is completely removed while keeping heading and status indicator."""
    dashboard_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "Frontend", "src", "pages", "student", "StudentDashboard.jsx"
    )
    with open(dashboard_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Model name must be removed
    assert "Gemini 2.5 Flash" not in content, "'Gemini 2.5 Flash' must be removed from StudentDashboard.jsx"

    # AI Assistant heading and Telemetry Grounded indicator must be preserved
    assert "AI Success Assistant" in content, "'AI Success Assistant' heading must be preserved"
    assert "Telemetry Grounded" in content, "'Telemetry Grounded' status indicator must be preserved"


def test_edit_program_button_removed():
    """Verify 'Edit Program' button is removed from header while keeping program info and Back link."""
    dashboard_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "Frontend", "src", "pages", "student", "StudentDashboard.jsx"
    )
    with open(dashboard_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Edit Program button and its header icon must be removed
    assert "<span>Edit Program</span>" not in content, "'Edit Program' button must be removed"
    assert "<Edit3 size={11} />" not in content, "Header Edit3 icon must be removed"

    # Academic program information must be preserved
    assert "studentData?.year" in content, "Student year must be preserved"
    assert "studentData?.department" in content, "Student department must be preserved"
    assert "studentData?.semester" in content, "Student semester must be preserved"

    # Back to Landing Page link must be preserved
    assert "Back to Landing Page" in content, "'Back to Landing Page' must be preserved"
    assert 'to="/"' in content, "Link to '/' must be preserved"


# ---------------------------------------------------------------------------
# 2. AI Assistant and Backend Integration Preserved
# ---------------------------------------------------------------------------

def test_ai_assistant_functionality_preserved():
    """Verify AI chatbot logic and backend AI assistant endpoint remain fully functional."""
    dashboard_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "Frontend", "src", "pages", "student", "StudentDashboard.jsx"
    )
    with open(dashboard_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Chatbot frontend handling preserved
    assert "handleAskAI" in content
    assert "api.askStudentAI" in content
    assert "aiConversation" in content

    # Backend AI assistant endpoint responds with telemetry grounding
    student_user = {
        "sub": "stu-2024-042@codebuffet.edu",
        "role": "student",
        "roll_no": "STU-2024-042"
    }
    req = AIAssistantRequest(
        question="How can I prepare for Tier-1 campus placements?",
        simulated_attendance=88.5,
        simulated_coding=8.4,
        simulated_lms=95.0
    )
    ai_res = student_ai_assistant(req, current_user=student_user)

    assert "answer" in ai_res
    assert len(ai_res["answer"]) > 20
    assert "telemetry_grounding" in ai_res
    assert ai_res["telemetry_grounding"]["cgpa"] == 8.42


def test_student_dashboard_endpoint():
    """Verify backend student telemetry data endpoint remains functional."""
    student_user = {
        "sub": "stu-2024-042@codebuffet.edu",
        "role": "student",
        "roll_no": "STU-2024-042"
    }
    dash = get_student_dashboard(roll_no="STU-2024-042", current_user=student_user)

    assert dash["roll_no"] == "STU-2024-042"
    assert dash["name"] == "Aarav Sharma"
    assert dash["cgpa"] == 8.42
    assert dash["attendance"] == 88.5
    assert dash["success_score"] == 85.4
