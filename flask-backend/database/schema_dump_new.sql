--
-- PostgreSQL database dump
--

\restrict m1fYhe2BpKJcBixYeOLmyG6ntiv8egOUXkwp1nwfzMwYSgcWpiziuW2azyeMcd5

-- Dumped from database version 17.8 (a284a84)
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: restricted; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA restricted;


ALTER SCHEMA restricted OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: course; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.course (
    id integer NOT NULL,
    department_id integer NOT NULL,
    subject character varying(50) NOT NULL,
    catalog_num character varying(10) NOT NULL,
    title character varying(100),
    description text,
    units smallint,
    catalog_num_int integer
);


ALTER TABLE public.course OWNER TO neondb_owner;

--
-- Name: course_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.course ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.course_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: department; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.department (
    id integer NOT NULL,
    college character varying(50) NOT NULL,
    department_code character varying(20) NOT NULL
);


ALTER TABLE public.department OWNER TO neondb_owner;

--
-- Name: department_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.department ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: instructor; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.instructor (
    id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL
);


ALTER TABLE public.instructor OWNER TO neondb_owner;

--
-- Name: instructor_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.instructor ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.instructor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: section; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.section (
    id integer NOT NULL,
    course_id integer NOT NULL,
    term_id integer NOT NULL,
    section_num character varying(10) NOT NULL,
    component character varying(20),
    instruction_mode character varying(10),
    class_days character varying(10),
    start_time time without time zone,
    end_time time without time zone,
    combined boolean,
    class_status character varying(10),
    enrollment_capacity integer,
    room_code character varying(20)
);


ALTER TABLE public.section OWNER TO neondb_owner;

--
-- Name: section_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.section ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: section_instructor; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.section_instructor (
    section_id integer NOT NULL,
    instructor_id integer NOT NULL
);


ALTER TABLE public.section_instructor OWNER TO neondb_owner;

--
-- Name: term; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.term (
    id integer NOT NULL,
    session_code character varying(10) NOT NULL,
    year integer NOT NULL,
    start_date date,
    end_date date
);


ALTER TABLE public.term OWNER TO neondb_owner;

--
-- Name: term_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.term ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.term_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_planned_section; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_planned_section (
    user_id integer NOT NULL,
    section_id integer NOT NULL,
    added_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_planned_section OWNER TO neondb_owner;

--
-- Name: role; Type: TABLE; Schema: restricted; Owner: neondb_owner
--

CREATE TABLE restricted.role (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE restricted.role OWNER TO neondb_owner;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: restricted; Owner: neondb_owner
--

ALTER TABLE restricted.role ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME restricted.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: restricted; Owner: neondb_owner
--

CREATE TABLE restricted.users (
    id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE restricted.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: restricted; Owner: neondb_owner
--

ALTER TABLE restricted.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME restricted.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: course course_department_id_subject_catalog_num_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_department_id_subject_catalog_num_key UNIQUE (department_id, subject, catalog_num);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_pkey PRIMARY KEY (id);


--
-- Name: department department_college_department_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_college_department_code_key UNIQUE (college, department_code);


--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);


--
-- Name: instructor instructor_first_name_last_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT instructor_first_name_last_name_key UNIQUE (first_name, last_name);


--
-- Name: instructor instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT instructor_pkey PRIMARY KEY (id);


--
-- Name: section section_course_id_term_id_section_num_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_course_id_term_id_section_num_key UNIQUE (course_id, term_id, section_num);


--
-- Name: section_instructor section_instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section_instructor
    ADD CONSTRAINT section_instructor_pkey PRIMARY KEY (section_id, instructor_id);


--
-- Name: section section_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_pkey PRIMARY KEY (id);


--
-- Name: term term_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.term
    ADD CONSTRAINT term_pkey PRIMARY KEY (id);


--
-- Name: term term_session_code_year_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.term
    ADD CONSTRAINT term_session_code_year_key UNIQUE (session_code, year);


--
-- Name: user_planned_section user_planned_section_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_planned_section
    ADD CONSTRAINT user_planned_section_pkey PRIMARY KEY (user_id, section_id);


--
-- Name: role role_name_key; Type: CONSTRAINT; Schema: restricted; Owner: neondb_owner
--

ALTER TABLE ONLY restricted.role
    ADD CONSTRAINT role_name_key UNIQUE (name);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: restricted; Owner: neondb_owner
--

ALTER TABLE ONLY restricted.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: restricted; Owner: neondb_owner
--

ALTER TABLE ONLY restricted.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_course_catalog_num; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_course_catalog_num ON public.course USING btree (catalog_num);


--
-- Name: idx_course_catalog_num_int; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_course_catalog_num_int ON public.course USING btree (catalog_num_int);


--
-- Name: idx_course_department_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_course_department_id ON public.course USING btree (department_id);


--
-- Name: idx_course_subject; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_course_subject ON public.course USING btree (subject);


--
-- Name: idx_course_subject_catalog; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_course_subject_catalog ON public.course USING btree (subject, catalog_num);


--
-- Name: idx_section_term_course; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_section_term_course ON public.section USING btree (term_id, course_id);


--
-- Name: idx_section_term_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_section_term_id ON public.section USING btree (term_id);


--
-- Name: users_email_lower_uq; Type: INDEX; Schema: restricted; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_email_lower_uq ON restricted.users USING btree (lower((email)::text));


--
-- Name: course course_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department(id) ON DELETE CASCADE;


--
-- Name: section section_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(id) ON DELETE CASCADE;


--
-- Name: section_instructor section_instructor_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section_instructor
    ADD CONSTRAINT section_instructor_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructor(id) ON DELETE CASCADE;


--
-- Name: section_instructor section_instructor_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section_instructor
    ADD CONSTRAINT section_instructor_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.section(id) ON DELETE CASCADE;


--
-- Name: section section_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.term(id) ON DELETE CASCADE;


--
-- Name: user_planned_section user_planned_section_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_planned_section
    ADD CONSTRAINT user_planned_section_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.section(id) ON DELETE CASCADE;


--
-- Name: user_planned_section user_planned_section_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_planned_section
    ADD CONSTRAINT user_planned_section_user_id_fkey FOREIGN KEY (user_id) REFERENCES restricted.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: restricted; Owner: neondb_owner
--

ALTER TABLE ONLY restricted.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES restricted.role(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict m1fYhe2BpKJcBixYeOLmyG6ntiv8egOUXkwp1nwfzMwYSgcWpiziuW2azyeMcd5

