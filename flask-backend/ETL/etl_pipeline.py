import os
import re
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert

from models.course import Course
from models.department import Department
from models.term import Term
from models.section import Section
from models.instructor import Instructor
from models.section import section_instructor

# helper for batching in load section 
def exec_in_batches(conn, stmt, records, batch_size=200, label=""):
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            conn.execute(stmt, batch)
        except Exception as e:
            raise RuntimeError(
                f"{label} batch failed at rows {i}-{i + len(batch) - 1}"
            ) from e

# connection setup
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, future=True)


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

# replace with Non-copy version to get full master schedule
df = extract_excel("Fall 2025 Master Schedule.xlsx")

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
    # drop columns not needed or can't use ourselves
    df = df.drop(columns=["Class Nbr", "Room Capacity", "Current Enrollment", 
                          "Waitlist Capacity", "Waitlist Total", "Acad Group"])

    # drop columns not needed or can't use ourselves
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

    # replace missing instructor names with TBA (BIG fix)
    df["first_name"] = df["first_name"].fillna("TBA")       
    df["last_name"]  = df["last_name"].fillna("TBA")                         # fix 1, null vals
    df["first_name"] = df["first_name"].replace(r"^\s*$", "TBA", regex=True) # fix 2, empty/white space
    df["last_name"]  = df["last_name"].replace(r"^\s*$", "TBA", regex=True)

    # convert values to match database schema using helper functions
    df["start_time"] = df["start_time"].apply(float_to_time)
    df["end_time"] = df["end_time"].apply(float_to_time)
    df["combined"] = df["combined"].apply(string_to_bool)

    # normalize strings for FK mapping
    df["college"] = df["college"].str.strip().str.upper()
    df["department_code"] = df["department_code"].str.strip().str.upper()
    df["subject"] = df["subject"].str.strip().str.upper()
    df["first_name"] = df["first_name"].str.strip().str.upper()
    df["last_name"] = df["last_name"].str.strip().str.upper()
    df["session_code"] = df["session_code"].astype(str).str.strip().str.upper()
    df["catalog_num"] = df["catalog_num"].astype(str).str.strip().str.upper()
    df["section_num"] = df["section_num"].astype(str).str.strip().str.upper()

    return df

df = transform_data(df)

# ------------------ Load ------------------
def load_to_db(df):
    # ---------- TERMS ----------
    terms = df[["session_code", "year", "start_date", "end_date"]].drop_duplicates()
    term_records = terms.to_dict("records")

    stmt = insert(Term.__table__).on_conflict_do_nothing(
        index_elements=["session_code", "year"]
    )

    with engine.begin() as conn:
        exec_in_batches(conn, stmt, term_records, label="term")
        rows = conn.execute(Term.__table__.select()).fetchall()

    term_cache = {(r.session_code, r.year): r.id for r in rows}

    # ---------- DEPARTMENTS ----------
    departments = df[["college", "department_code"]].drop_duplicates()
    department_records = departments.to_dict("records")

    stmt = insert(Department.__table__).on_conflict_do_nothing(
        index_elements=["college", "department_code"]
    )

    with engine.begin() as conn:
        exec_in_batches(conn, stmt, department_records, label="department")
        rows = conn.execute(Department.__table__.select()).fetchall()

    dept_cache = {(r.college, r.department_code): r.id for r in rows}

    # ---------- COURSES ----------
    courses = df[
        ["college", "department_code", "subject", "catalog_num", "title", "units"]
    ].drop_duplicates()

    courses["department_id"] = list(
        map(dept_cache.get, zip(courses["college"], courses["department_code"]))
    )

    if courses["department_id"].isna().any():
        raise ValueError("Course department FK failed")

    courses["catalog_num_int"] = pd.to_numeric(
        courses["catalog_num"], errors="coerce"
    ).astype("Int64")

    courses = courses[
        ["department_id", "subject", "catalog_num", "catalog_num_int", "title", "units"]
    ]
    course_records = courses.to_dict("records")

    stmt = insert(Course.__table__).on_conflict_do_nothing(
        index_elements=["department_id", "subject", "catalog_num"]
    )

    with engine.begin() as conn:
        exec_in_batches(conn, stmt, course_records, label="course")
        rows = conn.execute(Course.__table__.select()).fetchall()

    course_cache = {(r.department_id, r.subject, r.catalog_num): r.id for r in rows}

    # ---------- INSTRUCTORS ----------
    instructors = df[["first_name", "last_name"]].drop_duplicates()
    instructor_records = instructors.to_dict("records")

    stmt = insert(Instructor.__table__).on_conflict_do_nothing(
        index_elements=["first_name", "last_name"]
    )

    with engine.begin() as conn:
        exec_in_batches(conn, stmt, instructor_records, label="instructor")
        rows = conn.execute(Instructor.__table__.select()).fetchall()

    instructor_cache = {(r.first_name, r.last_name): r.id for r in rows}

    # ---------- SECTIONS ----------
    sections = df[
        ["college", "subject", "catalog_num", "session_code", "year",
         "department_code", "section_num", "component", "instruction_mode",
         "class_days", "start_time", "end_time", "combined",
         "class_status", "enrollment_capacity", "room_code"
        ]
    ].drop_duplicates()

    sections["department_id"] = list(
        map(dept_cache.get, zip(sections["college"], sections["department_code"]))
    )
    sections["course_id"] = list(
        map(course_cache.get, zip(
            sections["department_id"], sections["subject"], sections["catalog_num"]
        ))
    )
    sections["term_id"] = list(
        map(term_cache.get, zip(sections["session_code"], sections["year"]))
    )

    if sections[["course_id", "term_id"]].isna().any().any():
        raise ValueError("Section FK lookup failed")

    sections = sections[
        [
            "course_id", "term_id", "section_num", "component",
            "instruction_mode", "class_days", "start_time", "end_time",
            "combined", "class_status", "enrollment_capacity", "room_code",
        ]
    ]
    section_records = sections.to_dict("records")

    stmt = insert(Section.__table__).on_conflict_do_nothing(
        index_elements=["course_id", "term_id", "section_num"]
    )

    with engine.begin() as conn:
        exec_in_batches(conn, stmt, section_records, label="section")
        rows = conn.execute(Section.__table__.select()).fetchall()

    section_cache = {(r.course_id, r.term_id, r.section_num): r.id for r in rows}

    # ---------- SECTION_INSTRUCTOR ----------
    sect_inst = df[
        [
            "college", "department_code", "subject", "catalog_num",
            "session_code", "year", "section_num", "first_name", "last_name",
        ]
    ].drop_duplicates()

    sect_inst["department_id"] = list(
        map(dept_cache.get, zip(sect_inst["college"], sect_inst["department_code"]))
    )
    sect_inst["course_id"] = list(
        map(course_cache.get, zip(
            sect_inst["department_id"], sect_inst["subject"], sect_inst["catalog_num"]
        ))
    )
    sect_inst["term_id"] = list(
        map(term_cache.get, zip(sect_inst["session_code"], sect_inst["year"]))
    )
    sect_inst["section_id"] = list(
        map(section_cache.get, zip(
            sect_inst["course_id"], sect_inst["term_id"], sect_inst["section_num"]
        ))
    )
    sect_inst["instructor_id"] = list(
        map(instructor_cache.get, zip(sect_inst["first_name"], sect_inst["last_name"]))
    )

    if sect_inst[["section_id", "instructor_id"]].isna().any().any():
        raise ValueError("Section Instructor FK lookup failed")

    sect_inst_records = sect_inst[["section_id", "instructor_id"]].to_dict("records")

    stmt = insert(section_instructor).on_conflict_do_nothing()

    with engine.begin() as conn:
        exec_in_batches(conn, stmt, sect_inst_records, label="section_instructor")

load_to_db(df)
print("working...")