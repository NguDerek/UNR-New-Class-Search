--
-- PostgreSQL database dump
--

\restrict nZovFaV6dJnTAy1tD4IvzAnDasIaWWRMBfcPYxURwgzb68WuHtFS7fKjXBpjuyq

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
    department_id integer,
    subject character varying(50),
    catalog_num integer,
    title character varying(100),
    description text,
    units smallint
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
    college character varying(50),
    department_code character varying(20)
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
    first_name character varying(50),
    last_name character varying(50)
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
    course_id integer,
    term_id integer,
    section_num integer,
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
    session_code character varying(10),
    start_date date,
    end_date date,
    year integer
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
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(20) DEFAULT 'Student'::character varying,
    is_verified boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_pkey PRIMARY KEY (id);


--
-- Name: course course_subject_catalog_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_subject_catalog_unique UNIQUE (subject, catalog_num);


--
-- Name: department department_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_code_unique UNIQUE (department_code);


--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);


--
-- Name: instructor instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT instructor_pkey PRIMARY KEY (id);


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
-- Name: section section_unique_course_term_num; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_unique_course_term_num UNIQUE (course_id, term_id, section_num);


--
-- Name: term term_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.term
    ADD CONSTRAINT term_pkey PRIMARY KEY (id);


--
-- Name: term term_session_year_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.term
    ADD CONSTRAINT term_session_year_unique UNIQUE (session_code, year);


--
-- Name: instructor unique_instructor; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.instructor
    ADD CONSTRAINT unique_instructor UNIQUE (first_name, last_name);


--
-- Name: user_planned_section user_planned_section_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_planned_section
    ADD CONSTRAINT user_planned_section_pkey PRIMARY KEY (user_id, section_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


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
    ADD CONSTRAINT user_planned_section_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict nZovFaV6dJnTAy1tD4IvzAnDasIaWWRMBfcPYxURwgzb68WuHtFS7fKjXBpjuyq

