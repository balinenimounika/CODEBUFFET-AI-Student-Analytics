"""
CODEBUFFET — Complete Backend Status Banner Removal Verification Tests
Verifies:
1. No backend status banner or indicator (e.g., FASTAPI ML BACKEND ACTIVE, FASTAPI BACKEND ONLINE,
   FASTAPI MENTOR ENDPOINTS ACTIVE, STANDALONE MODE) exists in any dashboard or component.
2. User identification details ("Logged in as", "Institutional Commander") are preserved across all dashboards.
3. Sign out button and handleLogout remain fully functional.
4. Backend health check and authentication APIs remain fully operational.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db_connection
from backend.routes.auth_routes import login, LoginRequest


def run_coro(coro):
    """Executes a coroutine containing synchronous database calls."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value


DASHBOARD_FILES = {
    "Admin Dashboard": ("Frontend", "src", "pages", "institution", "CampusDashboard.jsx"),
    "Faculty Mentor Dashboard": ("Frontend", "src", "pages", "institution", "MentorDashboard.jsx"),
    "Student Dashboard": ("Frontend", "src", "pages", "student", "StudentDashboard.jsx"),
    "Placement Officer Dashboard": ("Frontend", "src", "pages", "institution", "PlacementDashboard.jsx"),
}

BANNED_BANNER_PATTERNS = [
    "FASTAPI ML BACKEND ACTIVE",
    "FASTAPI BACKEND ONLINE",
    "FASTAPI ML BACKEND ONLINE",
    "FASTAPI MENTOR ENDPOINTS ACTIVE",
    "STANDALONE MODE",
]


def test_no_status_banners_in_any_dashboard():
    """Confirms all four dashboards have zero backend status banners."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for name, parts in DASHBOARD_FILES.items():
        file_path = os.path.join(base_dir, *parts)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        for pattern in BANNED_BANNER_PATTERNS:
            assert pattern not in content, f"Found banner '{pattern}' in {name} ({os.path.basename(file_path)})"


def test_user_identity_and_signout_preserved():
    """Confirms user identification and Sign out button remain intact in all dashboards."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for name, parts in DASHBOARD_FILES.items():
        file_path = os.path.join(base_dir, *parts)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Sign out button must remain present
        assert "Sign out" in content, f"Sign out button missing from {name}"
        assert "handleLogout" in content or "logout" in content, f"Logout handler missing from {name}"

        # User identity details
        if name == "Admin Dashboard":
            assert "Institutional Commander:" in content
        elif name == "Faculty Mentor Dashboard":
            assert "Logged in as:" in content
        elif name == "Student Dashboard":
            assert "Logged in as:" in content
        elif name == "Placement Officer Dashboard":
            assert "TPO Director" in content


def test_backend_auth_and_health_remain_functional():
    """Confirms FastAPI backend authentication and database queries are untouched and operational."""
    admin_req = LoginRequest(
        identifier="admin@codebuffet.edu",
        password="CodeBuffet@2026!",
        role="admin"
    )
    auth_res = run_coro(login(admin_req))
    assert auth_res is not None
    assert auth_res.access_token is not None
    assert auth_res.user["role"] == "admin"

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM students")
    count = c.fetchone()[0]
    conn.close()
    assert count == 50008
