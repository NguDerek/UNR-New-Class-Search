-- Initial file to create database tables only ran once (this file is reference)
SET search_path TO public;  -- later we'll have restricted schema for user credentials 

CREATE TABLE term (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_code VARCHAR(10),
    start_date DATE,
    end_date DATE
);

CREATE TABLE department (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college VARCHAR(50),
    department_code VARCHAR(20)  -- acad_org renamed to be more clear
);

CREATE TABLE course (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_id INT REFERENCES department(id) ON DELETE CASCADE,
    subject VARCHAR(50),
    catalog_num INT,
    title VARCHAR(100),
    description TEXT,
    units SMALLINT
);

CREATE TABLE section (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id INT REFERENCES course(id) ON DELETE CASCADE,
    term_id INT REFERENCES term(id) ON DELETE CASCADE,
    section_num INT,
    component VARCHAR(20),
    instruction_mode VARCHAR(10),
    class_days VARCHAR(10),
    start_time TIME,
    end_time TIME,
    combined BOOLEAN,
    class_status VARCHAR(10),
    enrollment_capacity INT,
    room_code VARCHAR(20)
);

CREATE TABLE instructor (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50)
);

CREATE TABLE section_instructor (
    section_id INT REFERENCES section(id) ON DELETE CASCADE,
    instructor_id INT REFERENCES instructor(id) ON DELETE CASCADE,
    PRIMARY KEY(section_id, instructor_id)
);