import pandas as pd
import psycopg2
import os
import re
from dotenv import load_dotenv
from psycopg2.extras import execute_batch

# ------------------ Extract ------------------
def extract_excel(file_name):
    df = pd.read_excel(file_name, header=1, index_col=None) # add nrows= for 10k for testing
    year_match = re.search(r'(\d{4})', file_name)

    # ------------------ use the file name to get the year for this dataset ------------------
    if not year_match:
        raise ValueError("No 4 digit year found in excel filename\n")
    
    year = int(year_match.group(1))
    df["year"] = year

    return df

df = extract_excel("Fall 2025 Master Schedule - Copy.xlsx")

# ------------------ Transform ------------------
def float_to_time(value):
    if pd.isnull(value):
        return None
    hour = int(value)
    minute = int(round((value - hour) * 100))
    return pd.to_datetime(f"{hour}:{minute:02d}:00").time()

def string_to_bool(value):
    if pd.isnull(value):
        return None
    value = str(value).lower()
    if value == "yes":
        return True
    elif value == "no":
        return False
    return None

def transform_data(df):
    # ------------------ drop columns not needed or can't use ourselves ------------------
    df = df.drop(columns=["Class Nbr", "Room Capacity", "Current Enrollment", 
                          "Waitlist Capacity", "Waitlist Total", "Acad Group"])

    # ------------------ rename columns to mirror schema ------------------
    column_mapping = {
        "College": "college",
        "Acad Org": "department_code",
        "Subject": "subject",
        "Catalog": "catalog_num",
        "Section": "section_num",
        "Title": "title",
        "Component": "component",
        "Session": "session_code",
        "Instruction Mode": "instruction_mode",
        "Class Days": "class_days",
        "Class Start Time": "start_time",
        "Class End Time": "end_time",
        "Start Date": "start_date",
        "End Date": "end_date",
        "Room": "room_code",
        "Instructor First Name": "first_name",
        "Instructor Last Name": "last_name",
        "Enrollment Capacity": "enrollment_capacity",
        "Combined?": "combined",
        "Class Stat": "class_status",
        "Prgrss Unt": "units",
    }
    df = df.rename(columns=column_mapping)

    # ------------------ convert values to match database schema ------------------
    df["start_time"] = df["start_time"].apply(float_to_time)
    df["end_time"] = df["end_time"].apply(float_to_time)
    df["combined"] = df["combined"].apply(string_to_bool)

    return df

df = transform_data(df)

# ------------------ Load ------------------
load_dotenv()                               # read the .env file
DATABASE_URL = os.getenv("DATABASE_URL")    # update connection string
conn = psycopg2.connect(DATABASE_URL)       # conn is live db connection
cursor = conn.cursor()                      # cursor allows for executing SQL

def load_to_db(df):
    # ---------- replace missing instructor names with TBA (BIG fix) ----------
    df["first_name"] = df["first_name"].fillna("TBA")                       # fix 1, null vals
    df["last_name"]  = df["last_name"].fillna("TBA")
    df["first_name"] = df["first_name"].replace(r"^\s*$", "TBA", regex=True)# fix 2, empty/white space
    df["last_name"]  = df["last_name"].replace(r"^\s*$", "TBA", regex=True)

    # ---------- caches reduce time searching for id's to add foreign keys ----------
    term_cache = {}
    dept_cache = {}
    course_cache = {}
    instructor_cache = {}
    section_cache = {}

    # ---------- TERMS ----------
    terms = df[["session_code", "year", "start_date", "end_date"]].drop_duplicates()

    execute_batch(cursor, """
        INSERT INTO term (session_code, year, start_date, end_date)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (session_code, year) DO NOTHING;
    """, list(terms.itertuples(index=False, name=None)))

    cursor.execute("SELECT id, session_code, year FROM term;")
    for term_id, session_code, year in cursor.fetchall():
        term_cache[(session_code, year)] = term_id

    # ---------- DEPARTMENTS ----------
    departments = df[["college", "department_code"]].drop_duplicates()

    execute_batch(cursor, """
        INSERT INTO department (college, department_code)
        VALUES (%s, %s)
        ON CONFLICT (department_code) DO NOTHING;
    """, list(departments.itertuples(index=False, name=None)))

    cursor.execute("SELECT id, department_code FROM department;")
    for dept_id, dept_code in cursor.fetchall():
        dept_cache[dept_code] = dept_id

    # ---------- COURSES ----------
    courses = df[["department_code", "subject", "catalog_num", "title", "units"]].drop_duplicates()

    course_params = []
    for _, row in courses.iterrows():
        course_params.append((
            dept_cache[row.department_code],
            row.subject,
            row.catalog_num,
            row.title,
            row.units
        ))

    execute_batch(cursor, """
        INSERT INTO course (department_id, subject, catalog_num, title, units)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (subject, catalog_num) DO NOTHING;
    """, course_params)

    cursor.execute("SELECT id, subject, catalog_num FROM course;")
    for cid, subj, catalog in cursor.fetchall():
        course_cache[(subj, catalog)] = cid

    # ---------- INSTRUCTORS ----------
    instructors = df[["first_name", "last_name"]].drop_duplicates()

    execute_batch(cursor, """
        INSERT INTO instructor (first_name, last_name)
        VALUES (%s, %s)
        ON CONFLICT (first_name, last_name) DO NOTHING;
    """, list(instructors.itertuples(index=False, name=None)))

    cursor.execute("SELECT id, first_name, last_name FROM instructor;")
    for iid, fn, ln in cursor.fetchall():
        instructor_cache[(fn, ln)] = iid

    # ---------- SECTIONS ----------
    sections = df[["subject", "catalog_num", "session_code", "year",
                   "section_num", "component", "instruction_mode",
                   "class_days", "start_time", "end_time", "combined",
                   "class_status", "enrollment_capacity", "room_code"]]

    section_params = []
    for _, row in sections.iterrows():
        section_params.append((
            course_cache[(row.subject, row.catalog_num)],
            term_cache[(row.session_code, row.year)],
            row.section_num,
            row.component,
            row.instruction_mode,
            row.class_days,
            row.start_time,
            row.end_time,
            row.combined,
            row.class_status,
            row.enrollment_capacity,
            row.room_code
        ))

    execute_batch(cursor, """
        INSERT INTO section (course_id, term_id, section_num, component,
                             instruction_mode, class_days, start_time, end_time,
                             combined, class_status, enrollment_capacity, room_code)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (course_id, term_id, section_num) DO NOTHING;
    """, section_params)

    cursor.execute("SELECT id, course_id, term_id, section_num FROM section;")
    for sid, cid, tid, snum in cursor.fetchall():
        section_cache[(cid, tid, snum)] = sid

    # ---------- SECTION_INSTRUCTOR ----------
    sect_instructor_params = []
    for _, row in df.iterrows():
        term_id = term_cache[(row.session_code, row.year)]
        course_id = course_cache[(row.subject, row.catalog_num)]
        section_id = section_cache[(course_id, term_id, row.section_num)]
        instructor_id = instructor_cache[(row.first_name, row.last_name)]

        sect_instructor_params.append((section_id, instructor_id))

    execute_batch(cursor, """
        INSERT INTO section_instructor (section_id, instructor_id)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """, sect_instructor_params)

    conn.commit()

load_to_db(df)
print("working...")