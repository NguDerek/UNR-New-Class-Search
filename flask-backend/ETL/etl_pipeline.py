import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

########## extract the data from our excel sheet ##########
df = pd.read_excel("Fall_2025_excel.xlsx", header=1, nrows=12, index_col=None)  # adjust nrows for testing

########## begin transforming the data ##########

# 1.) drop irrelevant columns
df = df.drop(columns=["Class Nbr", "Room Capacity", "Current Enrollment", 
                      "Waitlist Capacity", "Waitlist Total", "Acad Group"])

# 2.) rename columns
column_mapping = {
    "College": "college",
    "Acad Org": "dept_code",
    "Subject": "subject",
    "Catalog": "catalog",
    "Section": "section_number",
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
    "Prgrss Unt": "units"
}
df.rename(columns=column_mapping, inplace=True)

# 3.) convert time float hh.mm to hh:mm:ss
def float_to_time(value):
    if pd.isnull(value):
        return None
    hour = int(value)
    minute = int(round((value - hour) * 100))
    return pd.to_datetime(f"{hour}:{minute:02d}:00").time()

df["start_time"] = df["start_time"].apply(float_to_time)
df["end_time"] = df["end_time"].apply(float_to_time)

# 4.) convert combined to bool
def string_to_bool(value):
    if pd.isnull(value):
        return None
    value = str(value).lower()
    if value == "yes":
        return True
    elif value == "no":
        return False
    return None

df["combined"] = df["combined"].apply(string_to_bool)

########## load the data into the database ##########
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

def load_to_db(df):
    # ------------------ caches ------------------
    term_cache = {}
    dept_cache = {}
    course_cache = {}
    instructor_cache = {}

    # ------------------ terms ------------------
    terms = df[["session_code", "start_date", "end_date"]].drop_duplicates()
    for _, row in terms.iterrows():
        cursor.execute("""
            INSERT INTO term (session_code, start_date, end_date)
            VALUES (%s, %s, %s)
            ON CONFLICT (session_code) DO NOTHING
            RETURNING id;
        """, (row.session_code, row.start_date, row.end_date))
        result = cursor.fetchone()
        term_id = result[0] if result else None
        if term_id is None:
            cursor.execute("SELECT id FROM term WHERE session_code = %s", (row.session_code,))
            term_id = cursor.fetchone()[0]
        term_cache[row.session_code] = term_id
    conn.commit()

    # ------------------ departments ------------------
    departments = df[["college", "dept_code"]].drop_duplicates()
    for _, row in departments.iterrows():
        cursor.execute("""
            INSERT INTO department (college, department_code)
            VALUES (%s, %s)
            ON CONFLICT (department_code) DO NOTHING
            RETURNING id;
        """, (row.college, row.dept_code))
        result = cursor.fetchone()
        dept_id = result[0] if result else None
        if dept_id is None:
            cursor.execute("SELECT id FROM department WHERE department_code = %s", (row.dept_code,))
            dept_id = cursor.fetchone()[0]
        dept_cache[row.dept_code] = dept_id
    conn.commit()

    # ------------------ courses ------------------
    courses = df[["dept_code", "subject", "catalog", "title", "units", "description"]].drop_duplicates()
    for _, row in courses.iterrows():
        dept_id = dept_cache[row.dept_code]
        cursor.execute("""
            INSERT INTO course (department_id, subject, catalog_num, title, units, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (department_id, subject, catalog_num) DO NOTHING
            RETURNING id;
        """, (dept_id, row.subject, row.catalog, row.title, row.units, row.description))
        result = cursor.fetchone()
        course_id = result[0] if result else None
        if course_id is None:
            cursor.execute("""
                SELECT id FROM course
                WHERE department_id=%s AND subject=%s AND catalog_num=%s
            """, (dept_id, row.subject, row.catalog))
            course_id = cursor.fetchone()[0]
        course_cache[(row.subject, row.catalog)] = course_id
    conn.commit()

    # ------------------ instructors ------------------
    instructors = df[["first_name", "last_name"]].drop_duplicates()
    for _, row in instructors.iterrows():
        cursor.execute("""
            INSERT INTO instructor (first_name, last_name)
            VALUES (%s, %s)
            ON CONFLICT (first_name, last_name) DO NOTHING
            RETURNING id;
        """, (row.first_name, row.last_name))
        result = cursor.fetchone()
        inst_id = result[0] if result else None
        if inst_id is None:
            cursor.execute("SELECT id FROM instructor WHERE first_name=%s AND last_name=%s", (row.first_name, row.last_name))
            inst_id = cursor.fetchone()[0]
        instructor_cache[(row.first_name, row.last_name)] = inst_id
    conn.commit()

    # ------------------ sections & section_instructor ------------------
    for _, row in df.iterrows():
        course_id = course_cache[(row.subject, row.catalog)]
        term_id = term_cache[row.session_code]
        cursor.execute("""
            INSERT INTO section (course_id, term_id, section_num, component, instruction_mode,
                                 class_days, start_time, end_time, combined, class_status,
                                 enrollment_capacity, room_code)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (course_id, term_id, section_num) DO NOTHING
            RETURNING id;
        """, (course_id, term_id, row.section_number, row.component, row.instruction_mode,
              row.class_days, row.start_time, row.end_time, row.combined, row.class_status,
              row.enrollment_capacity, row.room_code))
        result = cursor.fetchone()
        section_id = result[0] if result else None
        if section_id is None:
            cursor.execute("""
                SELECT id FROM section
                WHERE course_id=%s AND term_id=%s AND section_num=%s
            """, (course_id, term_id, row.section_number))
            section_id = cursor.fetchone()[0]

        instructor_id = instructor_cache[(row.first_name, row.last_name)]
        cursor.execute("""
            INSERT INTO section_instructor (section_id, instructor_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (section_id, instructor_id))
    conn.commit()

# -------------------------
# Run ETL
load_to_db(df)
print("ETL completed successfully!")