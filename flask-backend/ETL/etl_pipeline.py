import pandas as pd
import psycopg2
import os
import re
from dotenv import load_dotenv

# ------------------ Extract ------------------
def extract_excel(file_name):
    df = pd.read_excel(file_name, header=1, nrows=100, index_col=None)

    year_match = re.search(r'(\d{4})', file_name)

    if not year_match:
        raise ValueError("No 4 digit year found in excel filename\n")
    
    year = int(year_match.group(1))

    df["year"] = year

    return df

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
    # ------------------ caches ------------------
    term_cache = {}
    dept_cache = {}
    course_cache = {}
    instructor_cache = {}
    section_cache = {}

    # ------------------ terms ------------------
    terms = df[["session_code", "year", "start_date", "end_date"]].drop_duplicates()

    for _, row in terms.iterrows():
        cursor.execute("""
            INSERT INTO term (session_code, year, start_date, end_date)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (session_code, year) DO NOTHING
            RETURNING id;
        """, (row.session_code, row.year, row.start_date, row.end_date))

        result = cursor.fetchone()

        if result:
            term_id = result[0]
        else:
            term_id = None

        if term_id is None:
            cursor.execute("""
                SELECT id FROM term 
                WHERE session_code = %s AND year = %s
            """, (row.session_code, row.year))
            term_id = cursor.fetchone()[0]
        term_cache[row.session_code, row.year] = term_id

    # ------------------ departments ------------------
    departments = df[["college", "department_code"]].drop_duplicates()

    for _, row in departments.iterrows():
        cursor.execute("""
            INSERT INTO department (college, department_code)
            VALUES(%s, %s) 
            ON CONFLICT (department_code) DO NOTHING
            RETURNING id;
        """, (row.college, row.department_code))
        
        result = cursor.fetchone()

        if result:
            department_id = result[0]
        else:
            department_id = None
        
        if department_id is None:
            cursor.execute("""
                SELECT id FROM department
                WHERE department_code = %s
            """, (row.department_code, ))   # quick note single value still tuple (val, )
            department_id = cursor.fetchone()[0]
        dept_cache[row.department_code] = department_id

    # ------------------ courses ------------------
    courses = df[["department_code", "subject", "catalog_num", "title", "units"]].drop_duplicates()

    for _, row in courses.iterrows():
        department_id = dept_cache[row.department_code]
        cursor.execute("""
            INSERT INTO course (department_id, subject, catalog_num, title, units)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (subject, catalog_num) DO NOTHING
            RETURNING id;
        """, (department_id, row.subject, row.catalog_num, row.title, row.units))

        result = cursor.fetchone()

        if result:
            course_id = result[0]
        else:
            course_id = None
        
        if course_id is None:
            cursor.execute("""
                SELECT id FROM course
                WHERE subject = %s AND catalog_num = %s;
            """, (row.subject, row.catalog_num))
            course_id = cursor.fetchone()[0]
        course_cache[row.subject, row.catalog_num] = course_id

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

        if result:
            instructor_id = result[0]
        else:
            instructor_id = None

        if instructor_id is None:
            cursor.execute("""
                SELECT id FROM instructor
                WHERE first_name = %s AND last_name = %s;
            """, (row.first_name, row.last_name))
            instructor_id = cursor.fetchone()[0]
        instructor_cache[row.first_name, row.last_name] = instructor_id
        
    # ------------------ sections ------------------
    sections = df[["subject", "catalog_num", "session_code", "year",
                   "section_num", "component", "instruction_mode",
                   "class_days", "start_time", "end_time", "combined",
                   "class_status", "enrollment_capacity", "room_code"]]
    
    for _, row in sections.iterrows():
        course_id = course_cache[row.subject, row.catalog_num]
        term_id = term_cache[row.session_code, row.year]

        cursor.execute("""
            INSERT INTO section (course_id, term_id, section_num, component,
                       instruction_mode, class_days, start_time, end_time,
                       combined, class_status, enrollment_capacity, room_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (course_id, term_id, section_num) DO NOTHING
            RETURNING id;
        """, (course_id, term_id, row.section_num, row.component, row.instruction_mode,
              row.class_days, row.start_time, row.end_time, row.combined, 
              row.class_status, row.enrollment_capacity, row.room_code))
        
        result = cursor.fetchone()

        if result:
            section_id = result[0]
        else:
            section_id = None

        if section_id is None:
            cursor.execute("""
                SELECT id FROM section 
                WHERE course_id = %s AND term_id = %s AND section_num = %s;
            """, (course_id, term_id, row.section_num))
            section_id = cursor.fetchone()[0]
        section_cache[course_id, term_id, row.section_num] = section_id

    # ------------------ section_instructor ------------------
    for _, row in df.iterrows():
        term_id = term_cache[row.session_code, row.year]
        course_id = course_cache[row.subject, row.catalog_num]
        section_id = section_cache[course_id, term_id, row.section_num]
        instructor_id = instructor_cache[row.first_name, row.last_name]

        cursor.execute("""
            INSERT INTO section_instructor (section_id, instructor_id)
            VALUES (%s, %s)
            ON CONFLICT (section_id, instructor_id) DO NOTHING;
        """, (section_id, instructor_id))
    conn.commit()

# ------------------ run the etl process ------------------
load_to_db(df)
print("working \n")