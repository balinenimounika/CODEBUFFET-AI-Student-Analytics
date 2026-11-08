"""
CODEBUFFET — Database & Persistence Module
Manages SQLite schema initialization, parameterized queries,
and development seed synchronization for user accounts and student telemetry.
"""

import os
import sqlite3
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from backend.auth import hash_password

# Resolve database path relative to repository
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
DB_PATH = os.path.join(BASE_DIR, os.getenv("DATABASE_PATH", "backend/codebuffet.db"))


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with row factory enabled."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        roll_no TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        role TEXT NOT NULL, -- 'admin', 'mentor', 'tpo', 'student'
        role_label TEXT NOT NULL,
        department TEXT NOT NULL,
        avatar_url TEXT,
        status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'PENDING_APPROVAL', 'INACTIVE'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Safe upgrade of users table columns if upgrading existing database
    cursor.execute("PRAGMA table_info(users)")
    existing_user_cols = {col[1] for col in cursor.fetchall()}
    if "first_name" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN first_name TEXT")
    if "last_name" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN last_name TEXT")
    if "phone_number" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN phone_number TEXT")
    if "status" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE'")
    if "updated_at" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP")

    cursor.execute("""
    UPDATE users 
    SET status = 'ACTIVE' 
    WHERE status IS NULL OR status = ''
    """)
    cursor.execute("""
    UPDATE users 
    SET phone_number = '+91 9876543210' 
    WHERE phone_number IS NULL OR phone_number = ''
    """)
    cursor.execute("""
    UPDATE users 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE updated_at IS NULL
    """)
    cursor.execute("""
    UPDATE users 
    SET first_name = substr(full_name, 1, instr(full_name || ' ', ' ') - 1),
        last_name = substr(full_name, instr(full_name || ' ', ' ') + 1)
    WHERE first_name IS NULL OR first_name = ''
    """)

    # 2. Students Telemetry Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_no TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        full_name TEXT NOT NULL,
        department TEXT NOT NULL,
        year TEXT NOT NULL,
        semester INTEGER NOT NULL,
        cgpa REAL NOT NULL,
        backlogs INTEGER NOT NULL,
        overall_attendance_pct REAL NOT NULL,
        coding_skills REAL NOT NULL,
        dsa_score REAL NOT NULL,
        aptitude_score REAL NOT NULL,
        communication_skills REAL NOT NULL,
        lms_assignment_completion_pct REAL NOT NULL,
        success_score REAL NOT NULL,
        academic_risk_prob REAL NOT NULL,
        academic_risk_band TEXT NOT NULL,
        placement_risk_prob REAL NOT NULL,
        placement_risk_band TEXT NOT NULL,
        avatar_url TEXT,
        assigned_mentor TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    # Backwards-compatible schema evolution: ensure new columns and indexes exist
    cursor.execute("PRAGMA table_info(students)")
    existing_cols = {col[1] for col in cursor.fetchall()}
    if "assigned_mentor" not in existing_cols:
        cursor.execute("ALTER TABLE students ADD COLUMN assigned_mentor TEXT")
    if "record_type" not in existing_cols:
        cursor.execute("ALTER TABLE students ADD COLUMN record_type TEXT DEFAULT 'verified_profile'")
    if "source_provenance" not in existing_cols:
        cursor.execute("ALTER TABLE students ADD COLUMN source_provenance TEXT DEFAULT 'Official University Registrar'")
    if "placement_status" not in existing_cols:
        cursor.execute("ALTER TABLE students ADD COLUMN placement_status INTEGER")
    if "data_completeness" not in existing_cols:
        cursor.execute("ALTER TABLE students ADD COLUMN data_completeness REAL DEFAULT 100.0")
    if "notes" not in existing_cols:
        cursor.execute("ALTER TABLE students ADD COLUMN notes TEXT")

    # Fast indexes for server-side pagination, search, and cohort intelligence
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_record_type ON students(record_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_acad_risk ON students(academic_risk_band);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_place_risk ON students(placement_risk_band);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_mentor ON students(assigned_mentor);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_score ON students(success_score);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_cgpa ON students(cgpa);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_dsa ON students(dsa_score);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_aptitude ON students(aptitude_score);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_name ON students(full_name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_backlogs ON students(backlogs);")

    # Categorize verified enrolled student records cleanly (only if not already set)
    cursor.execute("""
        UPDATE students
        SET record_type = 'verified_profile',
            source_provenance = 'Official University Registrar (Enrolled B.Tech Cohort)',
            data_completeness = 100.0
        WHERE (user_id IS NOT NULL 
           OR roll_no IN ('STU-2024-042', 'STU-2024-001', 'STU-2024-019', 'STU-2024-088', 'STU-2024-112', 'STU-2024-054', 'STU-2024-067', 'STU-2024-093'))
          AND (record_type IS NULL OR record_type != 'verified_profile')
    """)
    cursor.execute("""
        UPDATE students
        SET record_type = 'anonymous_cohort',
            source_provenance = 'Kaggle Benchmark Dataset (kaggle.csv - 50,000 Records)',
            data_completeness = 94.1
        WHERE user_id IS NULL
          AND roll_no NOT IN ('STU-2024-042', 'STU-2024-001', 'STU-2024-019', 'STU-2024-088', 'STU-2024-112', 'STU-2024-054', 'STU-2024-067', 'STU-2024-093')
          AND (record_type IS NULL OR (record_type != 'anonymous_cohort' AND record_type != 'verified_profile'))
    """)

    # 3. Interventions & Mentoring Tasks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_roll_no TEXT NOT NULL,
        student_name TEXT NOT NULL,
        department TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        assigned_mentor TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'COMPLETED'
        approval_status TEXT DEFAULT 'APPROVED', -- 'APPROVED', 'PENDING'
        due_date TEXT NOT NULL,
        priority TEXT DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
        owner_role TEXT DEFAULT 'mentor', -- 'student', 'mentor', 'tpo'
        completion_notes TEXT,
        completed_at TIMESTAMP,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Add missing columns to interventions if upgrading existing database
    cursor.execute("PRAGMA table_info(interventions)")
    existing_inter_cols = {col[1] for col in cursor.fetchall()}
    if "priority" not in existing_inter_cols:
        cursor.execute("ALTER TABLE interventions ADD COLUMN priority TEXT DEFAULT 'MEDIUM'")
    if "owner_role" not in existing_inter_cols:
        cursor.execute("ALTER TABLE interventions ADD COLUMN owner_role TEXT DEFAULT 'mentor'")
    if "completion_notes" not in existing_inter_cols:
        cursor.execute("ALTER TABLE interventions ADD COLUMN completion_notes TEXT")
    if "completed_at" not in existing_inter_cols:
        cursor.execute("ALTER TABLE interventions ADD COLUMN completed_at TIMESTAMP")
    if "created_by" not in existing_inter_cols:
        cursor.execute("ALTER TABLE interventions ADD COLUMN created_by TEXT")
    if "approval_status" not in existing_inter_cols:
        cursor.execute("ALTER TABLE interventions ADD COLUMN approval_status TEXT DEFAULT 'APPROVED'")

    # 4. Student Historical Telemetry (Performance & Attendance Progression)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_roll_no TEXT NOT NULL,
        metric_type TEXT NOT NULL, -- 'cgpa', 'attendance', 'success_score', 'coding_skills', 'dsa_score', 'risk_band'
        semester INTEGER,
        period_label TEXT NOT NULL, -- e.g. 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'
        value REAL NOT NULL,
        notes TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_roll_no) REFERENCES students (roll_no)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_roll ON student_history(student_roll_no);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_metric ON student_history(metric_type);")

    # 5. Placement Jobs & Company Management
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS placement_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        job_title TEXT NOT NULL,
        description TEXT,
        min_cgpa REAL DEFAULT 7.0,
        max_backlogs INTEGER DEFAULT 0,
        min_dsa_score REAL DEFAULT 6.0,
        min_aptitude_score REAL DEFAULT 60.0,
        dsa_mandatory INTEGER DEFAULT 1,
        aptitude_mandatory INTEGER DEFAULT 0,
        mandatory_skills TEXT DEFAULT 'DSA',
        preferred_skills TEXT DEFAULT 'System Design',
        required_skills TEXT,
        department_eligibility TEXT DEFAULT 'ALL',
        deadline TEXT,
        package_lpa REAL,
        recruitment_stage TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_placement_jobs_company ON placement_jobs(company_name);")

    # 6. Placement Recruitment Pipeline & Applications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS placement_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        student_roll_no TEXT NOT NULL,
        student_name TEXT NOT NULL,
        department TEXT NOT NULL,
        stage TEXT NOT NULL DEFAULT 'REGISTERED',
        -- Pipeline: REGISTERED, ELIGIBILITY_CHECK, TRAINING, ASSESSMENT, SHORTLISTED, APPLIED, INTERVIEW, OFFERED, ACCEPTED, REJECTED
        match_score REAL,
        eligibility_status TEXT DEFAULT 'ELIGIBLE',
        notes TEXT,
        updated_by TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES placement_jobs (id),
        FOREIGN KEY (student_roll_no) REFERENCES students (roll_no)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_applications_job ON placement_applications(job_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_applications_student ON placement_applications(student_roll_no);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_applications_stage ON placement_applications(stage);")

    # Safe upgrade of placement_jobs columns if upgrading existing database
    cursor.execute("PRAGMA table_info(placement_jobs)")
    existing_job_cols = {col[1] for col in cursor.fetchall()}
    for col_name, col_def in [
        ("location", "TEXT DEFAULT 'Bengaluru, Hyderabad'"),
        ("job_type", "TEXT DEFAULT 'Full Time'"),
        ("open_date", "TEXT DEFAULT 'Oct 15, 2026'"),
        ("close_date", "TEXT DEFAULT 'Nov 30, 2026'"),
        ("interview_schedule", "TEXT DEFAULT 'Dec 05 - Dec 10, 2026'"),
        ("drive_status", "TEXT DEFAULT 'ACTIVE'"),
        ("logo_url", "TEXT"),
        ("total_vacancies", "INTEGER DEFAULT 15"),
    ]:
        if col_name not in existing_job_cols:
            cursor.execute(f"ALTER TABLE placement_jobs ADD COLUMN {col_name} {col_def}")

    # 6. Pipeline Stage History
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pipeline_stage_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL,
        from_stage TEXT,
        to_stage TEXT NOT NULL,
        notes TEXT,
        changed_by TEXT DEFAULT 'TPO Officer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES placement_applications(id)
    );
    """)

    # 7. Mock Interviews Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mock_interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_roll_no TEXT NOT NULL,
        student_name TEXT NOT NULL,
        department TEXT NOT NULL,
        interviewer_name TEXT NOT NULL,
        interviewer_email TEXT,
        interview_type TEXT NOT NULL,
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        status TEXT DEFAULT 'Scheduled',
        attendance_status TEXT DEFAULT 'Pending',
        score REAL,
        strengths TEXT,
        weaknesses TEXT,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. Placement Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS placement_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        officer_email TEXT UNIQUE NOT NULL,
        officer_name TEXT,
        designation TEXT DEFAULT 'Senior Head of Training & Placement',
        department TEXT DEFAULT 'Training & Placement Cell',
        phone TEXT,
        academic_year TEXT DEFAULT '2025-2026',
        placement_season TEXT DEFAULT 'Phase-1 (Autumn / Winter 2026)',
        email_notifications INTEGER DEFAULT 1,
        sms_notifications INTEGER DEFAULT 0,
        auto_shortlist_threshold REAL DEFAULT 75.0,
        allow_multi_offers INTEGER DEFAULT 0,
        max_offers_per_student INTEGER DEFAULT 2,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("SELECT id FROM placement_settings WHERE officer_email = 'tpo@codebuffet.edu'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO placement_settings (
            officer_email, officer_name, designation, department, phone,
            academic_year, placement_season, email_notifications, sms_notifications,
            auto_shortlist_threshold, allow_multi_offers, max_offers_per_student
        ) VALUES (
            'tpo@codebuffet.edu', 'Vikram Malhotra', 'Director & Chief Placement Officer',
            'Corporate Relations & Placement Cell', '+91 98765 43210',
            '2025-2026', 'Phase-1 (Autumn / Winter 2026)', 1, 1, 75.0, 1, 2
        )
        """)


    # 7. Security Audit History
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        user_role TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);")

    # 4. Seed Historical Telemetry (Real Semester Progression for Verified Students)
    historical_telemetry = [
        # Aarav Sharma (STU-2024-042, Sem 6, CS)
        ("STU-2024-042", "cgpa", 1, "Sem 1", 7.85, "First year foundations"),
        ("STU-2024-042", "cgpa", 2, "Sem 2", 8.02, "Data Structures introduction"),
        ("STU-2024-042", "cgpa", 3, "Sem 3", 8.20, "Algorithms & OOP"),
        ("STU-2024-042", "cgpa", 4, "Sem 4", 8.31, "Operating Systems & DBMS"),
        ("STU-2024-042", "cgpa", 5, "Sem 5", 8.40, "Computer Networks & Cloud"),
        ("STU-2024-042", "cgpa", 6, "Sem 6", 8.42, "Current active semester"),
        ("STU-2024-042", "attendance", 1, "Sem 1", 82.0, None),
        ("STU-2024-042", "attendance", 2, "Sem 2", 85.0, None),
        ("STU-2024-042", "attendance", 3, "Sem 3", 86.5, None),
        ("STU-2024-042", "attendance", 4, "Sem 4", 87.0, None),
        ("STU-2024-042", "attendance", 5, "Sem 5", 88.0, None),
        ("STU-2024-042", "attendance", 6, "Sem 6", 88.5, None),
        ("STU-2024-042", "success_score", 1, "Sem 1", 74.0, None),
        ("STU-2024-042", "success_score", 2, "Sem 2", 77.5, None),
        ("STU-2024-042", "success_score", 3, "Sem 3", 80.2, None),
        ("STU-2024-042", "success_score", 4, "Sem 4", 82.5, None),
        ("STU-2024-042", "success_score", 5, "Sem 5", 84.1, None),
        ("STU-2024-042", "success_score", 6, "Sem 6", 85.4, None),

        # Rajesh Kumar (STU-2024-001, Sem 6, CS - In At-Risk Remedial)
        ("STU-2024-001", "cgpa", 1, "Sem 1", 7.10, "Initial enrollment"),
        ("STU-2024-001", "cgpa", 2, "Sem 2", 6.80, "Declined in Core Math"),
        ("STU-2024-001", "cgpa", 3, "Sem 3", 6.45, "DSA backlogs acquired"),
        ("STU-2024-001", "cgpa", 4, "Sem 4", 6.20, "Attendance shortage flagged"),
        ("STU-2024-001", "cgpa", 5, "Sem 5", 6.12, "Remedial coaching started"),
        ("STU-2024-001", "cgpa", 6, "Sem 6", 6.10, "Current active semester"),
        ("STU-2024-001", "attendance", 1, "Sem 1", 76.0, None),
        ("STU-2024-001", "attendance", 2, "Sem 2", 72.0, None),
        ("STU-2024-001", "attendance", 3, "Sem 3", 68.0, None),
        ("STU-2024-001", "attendance", 4, "Sem 4", 65.5, None),
        ("STU-2024-001", "attendance", 5, "Sem 5", 63.8, None),
        ("STU-2024-001", "attendance", 6, "Sem 6", 64.0, None),

        # Sneha Reddy (STU-2024-019, Sem 4, ECE)
        ("STU-2024-019", "cgpa", 1, "Sem 1", 7.60, None),
        ("STU-2024-019", "cgpa", 2, "Sem 2", 7.50, None),
        ("STU-2024-019", "cgpa", 3, "Sem 3", 7.35, None),
        ("STU-2024-019", "cgpa", 4, "Sem 4", 7.40, None),

        # Ananya Verma (STU-2024-112, Sem 6, CSE - Top Tier-1)
        ("STU-2024-112", "cgpa", 1, "Sem 1", 8.90, None),
        ("STU-2024-112", "cgpa", 2, "Sem 2", 9.00, None),
        ("STU-2024-112", "cgpa", 3, "Sem 3", 9.08, None),
        ("STU-2024-112", "cgpa", 4, "Sem 4", 9.12, None),
        ("STU-2024-112", "cgpa", 5, "Sem 5", 9.14, None),
        ("STU-2024-112", "cgpa", 6, "Sem 6", 9.15, None),
    ]

    for item in historical_telemetry:
        cursor.execute("""
        SELECT id FROM student_history
        WHERE student_roll_no = ? AND metric_type = ? AND period_label = ?
        """, (item[0], item[1], item[3]))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO student_history (student_roll_no, metric_type, semester, period_label, value, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """, item)

    # 5. Seed Placement Corporate Openings
    jobs_to_seed = [
        ("Microsoft", "Software Development Engineer (Full Time)", "Core distributed systems, cloud microservices, and high-performance algorithms.", 8.0, 0, 7.5, 75.0, "Python, C++, DSA, Cloud Architecture", "Computer Science & Engineering, Information Technology, Artificial Intelligence & Machine Learning", "Nov 30, 2026", 44.0, "ACTIVE"),
        ("KPMG Global Services", "Cloud & Analytics Consultant", "Enterprise transformation, big data pipeline engineering, predictive models.", 7.0, 0, 6.0, 65.0, "SQL, Python, Data Analytics, Cloud Fundamentals", "ALL", "Dec 15, 2026", 14.5, "ACTIVE"),
        ("Amazon", "SDE Intern (Summer 2027)", "Full-stack cloud applications, DynamoDB, resilient microservices.", 7.5, 0, 7.0, 70.0, "Java, DSA, Object-Oriented Design, AWS", "Computer Science & Engineering, Information Technology, Electronics & Communication", "Nov 20, 2026", 28.0, "ACTIVE"),
        ("Texas Instruments", "Embedded Systems Engineer", "Real-time operating systems, microcontroller architecture, low-power IoT circuits.", 7.5, 0, 6.0, 65.0, "Embedded C, Microcontrollers, RTOS, Circuit Design", "Electronics & Communication, Electrical & Electronics", "Dec 05, 2026", 22.0, "ACTIVE"),
        ("Infosys", "Specialist Programmer", "High-velocity product development, modern web frameworks, scalable APIs.", 6.5, 1, 5.5, 60.0, "JavaScript, Python, Algorithms, Database Management", "ALL", "Dec 20, 2026", 9.5, "ACTIVE"),
    ]

    for job in jobs_to_seed:
        cursor.execute("SELECT id FROM placement_jobs WHERE company_name = ? AND job_title = ?", (job[0], job[1]))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO placement_jobs (company_name, job_title, description, min_cgpa, max_backlogs, min_dsa_score, min_aptitude_score, required_skills, department_eligibility, deadline, package_lpa, recruitment_stage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, job)

    # 6. Seed Initial Recruitment Pipeline Applications
    cursor.execute("SELECT id, company_name FROM placement_jobs")
    job_map = {r["company_name"]: r["id"] for r in cursor.fetchall()}

    pipeline_to_seed = [
        # Aarav Sharma applied to Microsoft
        (job_map.get("Microsoft", 1), "STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "INTERVIEW", 92.5, "ELIGIBLE", "Passed Technical Screen with 92% DSA score", "System"),
        # Ananya Verma applied to Microsoft
        (job_map.get("Microsoft", 1), "STU-2024-112", "Ananya Verma", "Computer Science & Engineering", "OFFERED", 96.0, "ELIGIBLE", "Final interview cleared, offer letter released", "System"),
        # Vamsi Krishna applied to KPMG
        (job_map.get("KPMG Global Services", 2), "STU-2024-088", "Vamsi Krishna", "Information Technology", "SHORTLISTED", 89.0, "ELIGIBLE", "Shortlisted for Round 2 Analytics assessment", "System"),
        # Sneha Reddy applied to Texas Instruments
        (job_map.get("Texas Instruments", 4), "STU-2024-019", "Sneha Reddy", "Electronics & Communication", "TRAINING", 76.0, "ELIGIBLE", "In Embedded systems preparation cohort", "System"),
        # Pooja Hegde applied to Texas Instruments
        (job_map.get("Texas Instruments", 4), "STU-2024-067", "Pooja Hegde", "Electrical & Electronics", "ASSESSMENT", 81.5, "ELIGIBLE", "Completed Online Technical Assessment", "System"),
        # Priya Sharma applied to Amazon
        (job_map.get("Amazon", 3), "STU-2024-101", "Priya Sharma", "Computer Science & Engineering", "APPLIED", 88.0, "ELIGIBLE", "Resume screened and approved", "System"),
        # Arjun Nair applied to Amazon
        (job_map.get("Amazon", 3), "STU-2024-102", "Arjun Nair", "Artificial Intelligence & Machine Learning", "SHORTLISTED", 84.5, "ELIGIBLE", "Coding round cleared", "System"),
        # Rajesh Kumar applied to Infosys
        (job_map.get("Infosys", 5), "STU-2024-001", "Rajesh Kumar", "Computer Science & Engineering", "ELIGIBILITY_CHECK", 54.0, "NEEDS_REVIEW", "CGPA 6.1 meets minimum, requires backlog clearance", "System"),
    ]

    for app_item in pipeline_to_seed:
        cursor.execute("""
        SELECT id FROM placement_applications
        WHERE job_id = ? AND student_roll_no = ?
        """, (app_item[0], app_item[1]))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO placement_applications (job_id, student_roll_no, student_name, department, stage, match_score, eligibility_status, notes, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, app_item)

    conn.commit()
    conn.close()


def seed_benchmark_kaggle_dataset(cursor, conn):
    """
    Safely and efficiently loads the remaining rows from kaggle.csv (rows 43 to 50,000)
    into the students table as anonymous benchmark cohort data.
    Preserves all 8 verified students and the 42 active benchmark cohort students.
    Brings total students count in SQLite database to exactly 50,008.
    """
    kaggle_csv_path = os.path.join(BASE_DIR, "kaggle.csv")
    if not os.path.exists(kaggle_csv_path):
        print(f"[BENCHMARK SEED NOTICE] {kaggle_csv_path} not found. Skipping bulk benchmark import.")
        return

    try:
        import pandas as pd
        df = pd.read_csv(kaggle_csv_path)
        branch_map = {
            "CSE": "Computer Science & Engineering",
            "IT": "Information Technology",
            "ECE": "Electronics & Communication",
            "EE": "Electrical & Electronics",
            "ME": "Mechanical Engineering",
            "CE": "Civil Engineering",
            "Chemical": "Chemical Engineering"
        }

        from backend.identity_service import get_deterministic_student_name, get_deterministic_avatar_url
        records = []
        # Index 42 onwards corresponds to STU-00043 to STU-50000 (49,958 records)
        for row in df.iloc[42:].itertuples():
            idx = row.Index
            roll_no = f"STU-{idx + 1:05d}"
            raw_b = str(getattr(row, "branch", "CSE")).strip()
            dept = branch_map.get(raw_b, raw_b)
            cgpa = float(row.cgpa) if pd.notnull(row.cgpa) else 7.0
            backlogs = int(row.backlogs) if pd.notnull(row.backlogs) else 0
            coding = float(row.coding_skills) if pd.notnull(row.coding_skills) else 5.0
            dsa = float(row.dsa_score) if pd.notnull(row.dsa_score) else 5.0
            apt = float(row.aptitude_score) if pd.notnull(row.aptitude_score) else 60.0
            comm = float(row.communication_skills) if pd.notnull(row.communication_skills) else 6.0
            att = round(max(55.0, min(97.8, 65.0 + (cgpa - 5.5) * 6.0 - (backlogs * 5.5))), 1)

            score = round(max(10.0, min(99.0, (cgpa * 4.0) + (coding * 2.5) + (dsa * 2.0) + (apt * 0.15) + (att * 0.15) - (backlogs * 3.5))), 1)

            if backlogs >= 2 or (backlogs >= 1 and att < 75.0) or (att < 65.0 and cgpa < 6.5):
                acad_band = "HIGH"
                acad_prob = 0.75
            elif backlogs == 1 or att < 75.0 or cgpa < 6.5:
                acad_band = "MEDIUM"
                acad_prob = 0.45
            else:
                acad_band = "LOW"
                acad_prob = 0.15

            plac_prob = min(0.95, max(0.05, 0.10 + (max(0, 6.0 - coding) * 0.12) + (max(0, 6.5 - cgpa) * 0.10)))
            plac_band = "HIGH" if plac_prob >= 0.6 else ("MEDIUM" if plac_prob >= 0.3 else "LOW")

            mentor = "Prof. Vihaan Singh" if ("computer" in dept.lower() or "information" in dept.lower()) else ("Dr. Sunita Sharma" if "elec" in dept.lower() else "Prof. K. Murthy")

            full_name = get_deterministic_student_name(roll_no)
            avatar_url = get_deterministic_avatar_url(roll_no)

            records.append((
                roll_no, None, full_name, dept, "3rd Year", 6, cgpa, backlogs,
                att, coding, dsa, apt, comm, 80.0, score, acad_prob, acad_band, round(plac_prob, 2), plac_band,
                avatar_url,
                mentor, "anonymous_cohort", "Kaggle Benchmark Dataset (kaggle.csv - 50,000 Records)", 94.1
            ))

        cursor.executemany("""
        INSERT OR IGNORE INTO students (
            roll_no, user_id, full_name, department, year, semester, cgpa, backlogs,
            overall_attendance_pct, coding_skills, dsa_score, aptitude_score,
            communication_skills, lms_assignment_completion_pct, success_score,
            academic_risk_prob, academic_risk_band, placement_risk_prob, placement_risk_band,
            avatar_url, assigned_mentor, record_type, source_provenance, data_completeness
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)
        conn.commit()
        print(f"[BENCHMARK SEED SUCCESS] Successfully loaded {len(records)} benchmark records from {kaggle_csv_path}")
    except Exception as e:
        print(f"[BENCHMARK SEED ERROR] Failed to load kaggle.csv: {e}")


def seed_initial_data():
    """
    Seeds initial hackathon/demo user accounts, 3 faculty mentors, and verified students.
    Passwords are encrypted via PBKDF2 with unique salts.
    Idempotent: inserts missing accounts without disrupting existing data.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Seed Accounts (Admin, 3 Faculty Mentors, TPO Director, Verified Student)
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    if user_count < 6:
        admin_pass = os.getenv("DEFAULT_ADMIN_PASSWORD", "CodeBuffet@2026!")
        student_pass = os.getenv("DEFAULT_STUDENT_PASSWORD", "Student@2026!")
        mentor_pass = os.getenv("DEFAULT_MENTOR_PASSWORD", "Mentor@2026!")
        tpo_pass = os.getenv("DEFAULT_TPO_PASSWORD", "TPO@2026!")

        users_to_seed = [
            (
                os.getenv("DEFAULT_ADMIN_EMAIL", "admin@codebuffet.edu"),
                "EMP-ADMIN-01",
                hash_password(admin_pass),
                "Dr. R. Kumar",
                "admin",
                "Institution Admin",
                "Institutional Planning & Academics",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            ),
            (
                os.getenv("DEFAULT_MENTOR_EMAIL", "rajesh.kumar@codebuffet.edu"),
                "FAC-CSE-104",
                hash_password(mentor_pass),
                "Prof. Rajesh Kumar",
                "mentor",
                "Senior Faculty Mentor (CSE)",
                "Computer Science & Engineering",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
            ),
            (
                "sunita.sharma@codebuffet.edu",
                "FAC-ECE-201",
                hash_password(mentor_pass),
                "Dr. Sunita Sharma",
                "mentor",
                "Faculty Mentor (ECE & IT)",
                "Electronics & Communication",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
            ),
            (
                "k.murthy@codebuffet.edu",
                "FAC-ME-305",
                hash_password(mentor_pass),
                "Prof. K. Murthy",
                "mentor",
                "Faculty Mentor (Mech & Civil)",
                "Mechanical Engineering",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
            ),
            (
                os.getenv("DEFAULT_TPO_EMAIL", "vikram.tpo@codebuffet.edu"),
                "TPO-OFFICER-02",
                hash_password(tpo_pass),
                "Vikram Malhotra",
                "tpo",
                "Placement Director",
                "Career & Corporate Relations",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
            ),
            (
                os.getenv("DEFAULT_STUDENT_EMAIL", "stu-2024-042@codebuffet.edu"),
                "STU-2024-042",
                hash_password(student_pass),
                "Aarav Sharma",
                "student",
                "Student (B.Tech)",
                "Computer Science & Engineering",
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
            ),
        ]

        for u in users_to_seed:
            seed_email = u[0]
            seed_roll_no = u[1]

            existing_by_email = None
            if seed_email:
                cursor.execute("SELECT id, email, roll_no, role FROM users WHERE LOWER(email) = LOWER(?)", (seed_email,))
                existing_by_email = cursor.fetchone()

            existing_by_roll = None
            if seed_roll_no:
                cursor.execute("SELECT id, email, roll_no, role FROM users WHERE roll_no IS NOT NULL AND LOWER(roll_no) = LOWER(?)", (seed_roll_no,))
                existing_by_roll = cursor.fetchone()

            if existing_by_email or existing_by_roll:
                continue

            cursor.execute("""
            INSERT INTO users (email, roll_no, password_hash, full_name, role, role_label, department, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, u)

    # 2. Seed Student Cohort (Verified Identifiable Profiles)
    students_to_seed = [
        ("STU-2024-042", 4, "Aarav Sharma", "Computer Science & Engineering", "3rd Year", 6, 8.42, 0, 88.5, 8.2, 8.5, 78.0, 7.5, 89.0, 85.4, 0.05, "LOW", 0.12, "LOW", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80", "Prof. Rajesh Kumar", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0),
        ("STU-2024-001", None, "Rajesh Kumar", "Computer Science & Engineering", "3rd Year", 6, 6.10, 2, 64.0, 4.0, 3.8, 48.0, 5.2, 58.0, 51.4, 0.72, "HIGH", 0.78, "HIGH", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", "Prof. Rajesh Kumar", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0),
        ("STU-2024-019", None, "Sneha Reddy", "Electronics & Communication", "2nd Year", 4, 7.40, 0, 68.0, 6.5, 6.0, 65.0, 6.8, 72.0, 69.2, 0.38, "MEDIUM", 0.32, "MEDIUM", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", "Dr. Sunita Sharma", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0),
        ("STU-2024-088", None, "Vamsi Krishna", "Information Technology", "4th Year", 8, 8.90, 0, 92.0, 9.2, 9.0, 88.0, 8.5, 94.0, 91.8, 0.05, "LOW", 0.08, "LOW", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80", "Dr. Sunita Sharma", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0),
        ("STU-2024-112", None, "Ananya Verma", "Computer Science & Engineering", "3rd Year", 6, 9.15, 0, 95.0, 9.5, 9.4, 92.0, 9.0, 96.0, 94.5, 0.05, "LOW", 0.06, "LOW", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", "Prof. Rajesh Kumar", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0),
        ("STU-2024-054", None, "Rohan Das", "Mechanical Engineering", "3rd Year", 6, 5.80, 3, 59.0, 3.5, 3.2, 42.0, 4.8, 51.0, 46.2, 0.85, "HIGH", 0.89, "HIGH", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80", "Prof. K. Murthy", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0),
        ("STU-2024-067", None, "Pooja Hegde", "Electrical & Electronics", "2nd Year", 4, 7.85, 0, 82.0, 7.0, 6.8, 70.0, 7.2, 80.0, 77.4, 0.15, "LOW", 0.22, "LOW", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80", "Dr. Sunita Sharma", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0),
        ("STU-2024-093", None, "Aditya Rao", "Civil Engineering", "4th Year", 8, 6.90, 1, 71.0, 5.8, 5.5, 60.0, 6.0, 67.0, 64.8, 0.42, "MEDIUM", 0.48, "MEDIUM", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80", "Prof. K. Murthy", "verified_profile", "Official University Registrar (Enrolled B.Tech Cohort)", 100.0)
    ]

    for s in students_to_seed:
        cursor.execute("SELECT id FROM students WHERE roll_no = ?", (s[0],))
        if cursor.fetchone():
            cursor.execute("""
            UPDATE students
            SET assigned_mentor = ?, record_type = ?, source_provenance = ?, data_completeness = ?
            WHERE roll_no = ?
            """, (s[20], s[21], s[22], s[23], s[0]))
        else:
            cursor.execute("""
            INSERT INTO students (
                roll_no, user_id, full_name, department, year, semester, cgpa, backlogs,
                overall_attendance_pct, coding_skills, dsa_score, aptitude_score,
                communication_skills, lms_assignment_completion_pct, success_score,
                academic_risk_prob, academic_risk_band, placement_risk_prob, placement_risk_band,
                avatar_url, assigned_mentor, record_type, source_provenance, data_completeness
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, s)

    # 2b. Seed Benchmark Cohort (42 Synthetic Records composing the 50-student selected roster)
    from backend.cohort_data import BENCHMARK_COHORT_STUDENTS
    for b in BENCHMARK_COHORT_STUDENTS:
        cursor.execute("SELECT id FROM students WHERE roll_no = ?", (b[0],))
        if cursor.fetchone():
            cursor.execute("""
            UPDATE students
            SET assigned_mentor = ?, record_type = ?, source_provenance = ?, data_completeness = ?
            WHERE roll_no = ?
            """, (b[20], b[21], b[22], b[23], b[0]))
        else:
            cursor.execute("""
            INSERT INTO students (
                roll_no, user_id, full_name, department, year, semester, cgpa, backlogs,
                overall_attendance_pct, coding_skills, dsa_score, aptitude_score,
                communication_skills, lms_assignment_completion_pct, success_score,
                academic_risk_prob, academic_risk_band, placement_risk_prob, placement_risk_band,
                avatar_url, assigned_mentor, record_type, source_provenance, data_completeness
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, b)

    # 3. Seed Mentoring Interventions (Distributed across mentors & life-cycle stages)
    interventions_to_seed = [
        # Today's deliverables (Demo date: Oct 31, 2026)
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Submit System Design Architecture Whitepaper", "ACADEMIC", "Prof. Rajesh Kumar", "OPEN", "Oct 31, 2026 5:00 PM", "HIGH"),
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Complete Cloud Native Microservices Quiz", "SKILL_GAP", "Dr. R. Kumar", "OPEN", "Oct 31, 2026 11:59 PM", "MEDIUM"),
        # Overdue deliverables (Yesterday, Day-before, and older)
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Review Mock Technical Interview Feedback", "PLACEMENT", "Vikram Malhotra", "OPEN", "Oct 30, 2026", "HIGH"),
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Submit Compiler Design Lab Manual 4", "ACADEMIC", "Prof. Rajesh Kumar", "OPEN", "Oct 29, 2026", "MEDIUM"),
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Complete LeetCode Top 50 DSA practice set", "SKILL_GAP", "Prof. Rajesh Kumar", "OPEN", "Oct 15, 2026", "HIGH"),
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Submit Microservices Architecture case study on LMS", "ACADEMIC", "Prof. Rajesh Kumar", "OPEN", "Oct 22, 2026", "MEDIUM"),
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Attend Corporate Mock Technical Interview Session", "PLACEMENT", "Vikram Malhotra", "OPEN", "Oct 28, 2026", "HIGH"),
        # Upcoming deliverables
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Corporate Mock Technical Interview (DSA & System Design)", "PLACEMENT", "Aarush Dev (TPO)", "OPEN", "Nov 12, 2026", "HIGH"),
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Advanced Competitive Hackathon & Honors Project Track", "PROJECT", "Prof. Rajesh Kumar", "OPEN", "Nov 25, 2026", "LOW"),
        # Completed deliverables
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Attend Academic Progress Review with Faculty Mentor", "MENTORING", "Prof. Rajesh Kumar", "COMPLETED", "Oct 10, 2026", "MEDIUM"),
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Verify University Placement Portal Profile & Resume Upload", "PLACEMENT", "Vikram Malhotra", "COMPLETED", "Oct 20, 2026", "HIGH"),
        # Ongoing / No Due Date
        ("STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "Weekly Peer Study Group on Advanced Distributed Algorithms", "GENERAL", "Prof. Rajesh Kumar", "OPEN", "Ongoing", "LOW"),
        # Other students
        ("STU-2024-001", "Rajesh Kumar", "Computer Science & Engineering", "Urgent Attendance Counseling & Arrears Remedial", "ATTENDANCE", "Prof. Rajesh Kumar", "OPEN", "Oct 12, 2026", "HIGH"),
        ("STU-2024-019", "Sneha Reddy", "Electronics & Communication", "Analog Circuit Design Simulation & Viva Practice", "ACADEMIC", "Dr. Sunita Sharma", "OPEN", "Oct 18, 2026", "MEDIUM"),
        ("STU-2024-067", "Pooja Hegde", "Electrical & Electronics", "Power Systems Assignment & Attendance Catchup", "ATTENDANCE", "Dr. Sunita Sharma", "OPEN", "Oct 20, 2026", "MEDIUM"),
        ("STU-2024-054", "Rohan Das", "Mechanical Engineering", "Special Faculty Mentorship for Core Arrear Subjects", "ACADEMIC", "Prof. K. Murthy", "OPEN", "Oct 14, 2026", "MEDIUM"),
        ("STU-2024-093", "Aditya Rao", "Civil Engineering", "Structural Analysis Practice & Placement Readiness Review", "PLACEMENT", "Prof. K. Murthy", "OPEN", "Oct 25, 2026", "MEDIUM"),
    ]

    for item in interventions_to_seed:
        cursor.execute("SELECT id FROM interventions WHERE LOWER(student_roll_no) = LOWER(?) AND title = ?", (item[0], item[3]))
        if not cursor.fetchone():
            if len(item) == 9:
                cursor.execute("""
                INSERT INTO interventions (student_roll_no, student_name, department, title, category, assigned_mentor, status, due_date, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, item)
            else:
                cursor.execute("""
                INSERT INTO interventions (student_roll_no, student_name, department, title, category, assigned_mentor, status, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, item)

    # 4. Seed Historical Telemetry (Real Semester Progression for Verified Students)
    historical_telemetry = [
        # Aarav Sharma (STU-2024-042, Sem 6, CS)
        ("STU-2024-042", "cgpa", 1, "Sem 1", 7.85, "First year foundations"),
        ("STU-2024-042", "cgpa", 2, "Sem 2", 8.02, "Data Structures introduction"),
        ("STU-2024-042", "cgpa", 3, "Sem 3", 8.20, "Algorithms & OOP"),
        ("STU-2024-042", "cgpa", 4, "Sem 4", 8.31, "Operating Systems & DBMS"),
        ("STU-2024-042", "cgpa", 5, "Sem 5", 8.40, "Computer Networks & Cloud"),
        ("STU-2024-042", "cgpa", 6, "Sem 6", 8.42, "Current active semester"),
        ("STU-2024-042", "attendance", 1, "Sem 1", 82.0, None),
        ("STU-2024-042", "attendance", 2, "Sem 2", 85.0, None),
        ("STU-2024-042", "attendance", 3, "Sem 3", 86.5, None),
        ("STU-2024-042", "attendance", 4, "Sem 4", 87.0, None),
        ("STU-2024-042", "attendance", 5, "Sem 5", 88.0, None),
        ("STU-2024-042", "attendance", 6, "Sem 6", 88.5, None),
        ("STU-2024-042", "success_score", 1, "Sem 1", 74.0, None),
        ("STU-2024-042", "success_score", 2, "Sem 2", 77.5, None),
        ("STU-2024-042", "success_score", 3, "Sem 3", 80.2, None),
        ("STU-2024-042", "success_score", 4, "Sem 4", 82.5, None),
        ("STU-2024-042", "success_score", 5, "Sem 5", 84.1, None),
        ("STU-2024-042", "success_score", 6, "Sem 6", 85.4, None),

        # Rajesh Kumar (STU-2024-001, Sem 6, CS - In At-Risk Remedial)
        ("STU-2024-001", "cgpa", 1, "Sem 1", 7.10, "Initial enrollment"),
        ("STU-2024-001", "cgpa", 2, "Sem 2", 6.80, "Declined in Core Math"),
        ("STU-2024-001", "cgpa", 3, "Sem 3", 6.45, "DSA backlogs acquired"),
        ("STU-2024-001", "cgpa", 4, "Sem 4", 6.20, "Attendance shortage flagged"),
        ("STU-2024-001", "cgpa", 5, "Sem 5", 6.12, "Remedial coaching started"),
        ("STU-2024-001", "cgpa", 6, "Sem 6", 6.10, "Current active semester"),
        ("STU-2024-001", "attendance", 1, "Sem 1", 76.0, None),
        ("STU-2024-001", "attendance", 2, "Sem 2", 72.0, None),
        ("STU-2024-001", "attendance", 3, "Sem 3", 68.0, None),
        ("STU-2024-001", "attendance", 4, "Sem 4", 65.5, None),
        ("STU-2024-001", "attendance", 5, "Sem 5", 63.8, None),
        ("STU-2024-001", "attendance", 6, "Sem 6", 64.0, None),

        # Sneha Reddy (STU-2024-019, Sem 4, ECE)
        ("STU-2024-019", "cgpa", 1, "Sem 1", 7.60, None),
        ("STU-2024-019", "cgpa", 2, "Sem 2", 7.50, None),
        ("STU-2024-019", "cgpa", 3, "Sem 3", 7.35, None),
        ("STU-2024-019", "cgpa", 4, "Sem 4", 7.40, None),

        # Ananya Verma (STU-2024-112, Sem 6, CSE - Top Tier-1)
        ("STU-2024-112", "cgpa", 1, "Sem 1", 8.90, None),
        ("STU-2024-112", "cgpa", 2, "Sem 2", 9.00, None),
        ("STU-2024-112", "cgpa", 3, "Sem 3", 9.08, None),
        ("STU-2024-112", "cgpa", 4, "Sem 4", 9.12, None),
        ("STU-2024-112", "cgpa", 5, "Sem 5", 9.14, None),
        ("STU-2024-112", "cgpa", 6, "Sem 6", 9.15, None),
    ]

    for item in historical_telemetry:
        cursor.execute("""
        SELECT id FROM student_history
        WHERE student_roll_no = ? AND metric_type = ? AND period_label = ?
        """, (item[0], item[1], item[3]))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO student_history (student_roll_no, metric_type, semester, period_label, value, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """, item)

    # 5. Seed Placement Corporate Openings
    jobs_to_seed = [
        ("Microsoft", "Software Development Engineer (Full Time)", "Core distributed systems, cloud microservices, and high-performance algorithms.", 8.0, 0, 7.5, 75.0, "Python, C++, DSA, Cloud Architecture", "Computer Science & Engineering, Information Technology, Artificial Intelligence & Machine Learning", "Nov 30, 2026", 44.0, "ACTIVE"),
        ("KPMG Global Services", "Cloud & Analytics Consultant", "Enterprise transformation, big data pipeline engineering, predictive models.", 7.0, 0, 6.0, 65.0, "SQL, Python, Data Analytics, Cloud Fundamentals", "ALL", "Dec 15, 2026", 14.5, "ACTIVE"),
        ("Amazon", "SDE Intern (Summer 2027)", "Full-stack cloud applications, DynamoDB, resilient microservices.", 7.5, 0, 7.0, 70.0, "Java, DSA, Object-Oriented Design, AWS", "Computer Science & Engineering, Information Technology, Electronics & Communication", "Nov 20, 2026", 28.0, "ACTIVE"),
        ("Texas Instruments", "Embedded Systems Engineer", "Real-time operating systems, microcontroller architecture, low-power IoT circuits.", 7.5, 0, 6.0, 65.0, "Embedded C, Microcontrollers, RTOS, Circuit Design", "Electronics & Communication, Electrical & Electronics", "Dec 05, 2026", 22.0, "ACTIVE"),
        ("Infosys", "Specialist Programmer", "High-velocity product development, modern web frameworks, scalable APIs.", 6.5, 1, 5.5, 60.0, "JavaScript, Python, Algorithms, Database Management", "ALL", "Dec 20, 2026", 9.5, "ACTIVE"),
    ]

    for job in jobs_to_seed:
        cursor.execute("SELECT id FROM placement_jobs WHERE company_name = ? AND job_title = ?", (job[0], job[1]))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO placement_jobs (company_name, job_title, description, min_cgpa, max_backlogs, min_dsa_score, min_aptitude_score, required_skills, department_eligibility, deadline, package_lpa, recruitment_stage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, job)

    # 6. Seed Initial Recruitment Pipeline Applications
    cursor.execute("SELECT id, company_name FROM placement_jobs")
    job_map = {r["company_name"]: r["id"] for r in cursor.fetchall()}

    pipeline_to_seed = [
        # Aarav Sharma applied to Microsoft
        (job_map.get("Microsoft", 1), "STU-2024-042", "Aarav Sharma", "Computer Science & Engineering", "INTERVIEW", 92.5, "ELIGIBLE", "Passed Technical Screen with 92% DSA score", "System"),
        # Ananya Verma applied to Microsoft
        (job_map.get("Microsoft", 1), "STU-2024-112", "Ananya Verma", "Computer Science & Engineering", "OFFERED", 96.0, "ELIGIBLE", "Final interview cleared, offer letter released", "System"),
        # Vamsi Krishna applied to KPMG
        (job_map.get("KPMG Global Services", 2), "STU-2024-088", "Vamsi Krishna", "Information Technology", "SHORTLISTED", 89.0, "ELIGIBLE", "Shortlisted for Round 2 Analytics assessment", "System"),
        # Sneha Reddy applied to Texas Instruments
        (job_map.get("Texas Instruments", 4), "STU-2024-019", "Sneha Reddy", "Electronics & Communication", "TRAINING", 76.0, "ELIGIBLE", "In Embedded systems preparation cohort", "System"),
        # Pooja Hegde applied to Texas Instruments
        (job_map.get("Texas Instruments", 4), "STU-2024-067", "Pooja Hegde", "Electrical & Electronics", "ASSESSMENT", 81.5, "ELIGIBLE", "Completed Online Technical Assessment", "System"),
        # Priya Sharma applied to Amazon
        (job_map.get("Amazon", 3), "STU-2024-101", "Priya Sharma", "Computer Science & Engineering", "APPLIED", 88.0, "ELIGIBLE", "Resume screened and approved", "System"),
        # Arjun Nair applied to Amazon
        (job_map.get("Amazon", 3), "STU-2024-102", "Arjun Nair", "Artificial Intelligence & Machine Learning", "SHORTLISTED", 84.5, "ELIGIBLE", "Coding round cleared", "System"),
        # Rajesh Kumar applied to Infosys
        (job_map.get("Infosys", 5), "STU-2024-001", "Rajesh Kumar", "Computer Science & Engineering", "ELIGIBILITY_CHECK", 54.0, "NEEDS_REVIEW", "CGPA 6.1 meets minimum, requires backlog clearance", "System"),
    ]

    for app_item in pipeline_to_seed:
        cursor.execute("""
        SELECT id FROM placement_applications
        WHERE job_id = ? AND student_roll_no = ?
        """, (app_item[0], app_item[1]))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO placement_applications (job_id, student_roll_no, student_name, department, stage, match_score, eligibility_status, notes, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, app_item)

    # 7. Seed Bulk Benchmark Dataset from kaggle.csv (49,958 rows to reach full 50,008 dataset)
    cursor.execute("SELECT COUNT(*) FROM students")
    total_student_count = cursor.fetchone()[0]
    if total_student_count < 50008:
        seed_benchmark_kaggle_dataset(cursor, conn)

    # 8. Ensure all benchmark students have unique realistic identities & avatars
    cursor.execute("""
        SELECT COUNT(*) FROM students 
        WHERE record_type = 'anonymous_cohort' 
          AND (full_name LIKE 'Benchmark%' OR full_name LIKE 'Student %' OR full_name IS NULL)
    """)
    placeholder_count = cursor.fetchone()[0]
    if placeholder_count > 0:
        from backend.identity_service import update_database_student_identities
        update_database_student_identities()

    conn.commit()
    conn.close()


def record_audit_log(
    conn_or_cursor,
    user_email: Optional[str],
    user_role: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Appends a security and workflow audit event to the audit_logs table."""
    try:
        sql = """
        INSERT INTO audit_logs (user_email, user_role, action, resource_type, resource_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        params = (user_email, user_role, action, resource_type, str(resource_id) if resource_id else None, details, ip_address)
        if isinstance(conn_or_cursor, sqlite3.Connection):
            c = conn_or_cursor.cursor()
            c.execute(sql, params)
            conn_or_cursor.commit()
        else:
            conn_or_cursor.execute(sql, params)
    except Exception as e:
        print(f"[AUDIT LOG WARNING] Failed to record audit log: {e}")
