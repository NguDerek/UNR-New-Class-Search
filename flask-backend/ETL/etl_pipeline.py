import pandas as pd
import psycopg2
import os
import re
from dotenv import load_dotenv

# ------------------ Extract ------------------
def extract_excel(file_name):
    df = pd.read_excel(file_name, header=1, nrows=70, index_col=None)

    year_match = re.search(r'(\d{4})', file_name)

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
    # ------------------ drop irrelevant columns ------------------
    df = df.drop(columns=["Class Nbr", "Room Capacity", "Current Enrollment", 
                          "Waitlist Capacity", "Waitlist Total", "Acad Group"])

    # ------------------ rename columns ------------------
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

    # ------------------ convert time ------------------
    df["start_time"] = df["start_time"].apply(float_to_time)
    df["end_time"] = df["end_time"].apply(float_to_time)

    # ------------------ convert combined ------------------
    df["combined"] = df["combined"].apply(string_to_bool)

    return df

df = transform_data(df)

# ------------------ Load ------------------
load_dotenv()                               # read the .env file
DATABASE_URL = os.getenv("DATABASE_URL")    # update connection string
conn = psycopg2.connect(DATABASE_URL)       # conn is live db connection
cursor = conn.cursor()                      # cursor allows for executing SQL

def load_to_db(df):
    def safe_str(value):
        if pd.isnull(value):
            return None
        return str(value).strip()

    term_cache = {}
    dept_cache = {}
    course_cache = {}
    instructor_cache = {}
    section_cache = {}

    # ------------------ terms ------------------
    terms = df[["session_code", "year", "start_date", "end_date"]].drop_duplicates()
    for _, row in terms.iterrows():
        session_code = safe_str(row.session_code)
        year = row.year
        cursor.execute("SELECT id FROM term WHERE session_code = %s", (session_code,))
        res = cursor.fetchone()
        if res:
            term_id = res[0]
        else:
            cursor.execute("""
                INSERT INTO term (session_code, start_date, end_date)
                VALUES (%s, %s, %s) RETURNING id;
            """, (session_code, row.start_date, row.end_date))
            term_id = cursor.fetchone()[0]
        term_cache[(session_code, year)] = term_id

    # ------------------ departments ------------------
    departments = df[["college", "department_code"]].drop_duplicates()
    for _, row in departments.iterrows():
        dept_code = safe_str(row.department_code)
        college = safe_str(row.college)
        cursor.execute("SELECT id FROM department WHERE department_code = %s", (dept_code,))
        res = cursor.fetchone()
        if res:
            department_id = res[0]
        else:
            cursor.execute("""
                INSERT INTO department (college, department_code)
                VALUES (%s, %s) RETURNING id;
            """, (college, dept_code))
            department_id = cursor.fetchone()[0]
        dept_cache[dept_code] = department_id

    # ------------------ courses ------------------
    courses = df[["department_code", "subject", "catalog_num", "title", "units"]].drop_duplicates()
    for _, row in courses.iterrows():
        department_id = dept_cache[safe_str(row.department_code)]
        subject = safe_str(row.subject)
        catalog_num = row.catalog_num
        title = safe_str(row.title)
        units = row.units
        cursor.execute("SELECT id FROM course WHERE subject=%s AND catalog_num=%s", (subject, catalog_num))
        res = cursor.fetchone()
        if res:
            course_id = res[0]
        else:
            cursor.execute("""
                INSERT INTO course (department_id, subject, catalog_num, title, units)
                VALUES (%s, %s, %s, %s, %s) RETURNING id;
            """, (department_id, subject, catalog_num, title, units))
            course_id = cursor.fetchone()[0]
        course_cache[(subject, catalog_num)] = course_id

    # ------------------ instructors ------------------
    instructors = df[["first_name", "last_name"]].drop_duplicates()
    for _, row in instructors.iterrows():
        first_name = safe_str(row.first_name)
        last_name = safe_str(row.last_name)
        cursor.execute("SELECT id FROM instructor WHERE first_name=%s AND last_name=%s", (first_name, last_name))
        res = cursor.fetchone()
        if res:
            instructor_id = res[0]
        else:
            cursor.execute("""
                INSERT INTO instructor (first_name, last_name)
                VALUES (%s, %s) RETURNING id;
            """, (first_name, last_name))
            instructor_id = cursor.fetchone()[0]
        instructor_cache[(first_name, last_name)] = instructor_id

    # ------------------ sections ------------------
    sections = df[["subject", "catalog_num", "session_code", "year",
                   "section_num", "component", "instruction_mode",
                   "class_days", "start_time", "end_time", "combined",
                   "class_status", "enrollment_capacity", "room_code"]]
    for _, row in sections.iterrows():
        course_id = course_cache.get((safe_str(row.subject), row.catalog_num))
        term_id = term_cache.get((safe_str(row.session_code), row.year))
        if course_id is None or term_id is None:
            continue
        cursor.execute("""
            SELECT id FROM section WHERE course_id=%s AND term_id=%s AND section_num=%s
        """, (course_id, term_id, row.section_num))
        res = cursor.fetchone()
        if res:
            section_id = res[0]
        else:
            cursor.execute("""
                INSERT INTO section (course_id, term_id, section_num, component,
                                     instruction_mode, class_days, start_time, end_time,
                                     combined, class_status, enrollment_capacity, room_code)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
            """, (
                course_id,
                term_id,
                row.section_num,
                safe_str(row.component),
                safe_str(row.instruction_mode),
                safe_str(row.class_days),
                row.start_time,
                row.end_time,
                row.combined,
                safe_str(row.class_status),
                row.enrollment_capacity,
                safe_str(row.room_code)
            ))
            section_id = cursor.fetchone()[0]
        section_cache[(course_id, term_id, row.section_num)] = section_id

    # ------------------ section_instructor ------------------
    for _, row in df.iterrows():
        course_id = course_cache.get((safe_str(row.subject), row.catalog_num))
        term_id = term_cache.get((safe_str(row.session_code), row.year))
        section_id = section_cache.get((course_id, term_id, row.section_num))
        instructor_id = instructor_cache.get((safe_str(row.first_name), safe_str(row.last_name)))
        if None in (course_id, term_id, section_id, instructor_id):
            continue
        cursor.execute("SELECT 1 FROM section_instructor WHERE section_id=%s AND instructor_id=%s",
                       (section_id, instructor_id))
        if cursor.fetchone():
            continue
        cursor.execute("""
            INSERT INTO section_instructor (section_id, instructor_id)
            VALUES (%s, %s);
        """, (section_id, instructor_id))
    conn.commit()
# ------------------ run the etl process ------------------
load_to_db(df)
print("working \n")