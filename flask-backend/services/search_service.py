from models.section import Section, section_instructor
from models.course import Course
from models.instructor import Instructor
from models.department import Department
from models.term import Term
from sqlalchemy import and_, or_, func
from database import db
from sqlalchemy.orm import joinedload

class SearchService:
    """Handles complex search operations with multiple criteria"""

    # uncomment this and the limit line in execute search for limited results
    #DEFAULT_RESULT_LIMIT = 100
    
    def __init__(self):
        self.filters = {}
        self.results = []
    
    def add_filter(self, filter_name, filter_value):
        #Add a filter to the search query
        if filter_value is not None and filter_value != '':
            self.filters[filter_name] = filter_value
    
    def clear_filters(self):
        #Clears all filterse
        self.filters = {}
        self.results = []

    # url gives raw strings -> need to safely convert int values
    def parse_int(self, value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    
    def _build_query(self):
        #Builds the search query based on filters
        query = (
            db.session.query(Section)
            .join(Course, Section.course_id == Course.id)
            .join(Department, Course.department_id == Department.id)
            .join(Term, Section.term_id == Term.id)
            # added eager loading to prevent extra querries
            .options(
                joinedload(Section.course),
                joinedload(Section.instructors)
            )
        )

        # Only join instructor tables when needed for filtering 
        need_instructor_join = (
            'instructor' in self.filters or
            'search_query' in self.filters
        )

        if need_instructor_join:
            query = query.outerjoin(
                section_instructor,
                Section.id == section_instructor.c.section_id
            ).outerjoin(
                Instructor,
                section_instructor.c.instructor_id == Instructor.id
            )
        
        # Add filters dynamically based on what was provided
        if 'subject' in self.filters:
            query = query.filter(Course.subject == self.filters['subject'].upper())

        if 'catalog_num' in self.filters:
            query = query.filter(Course.catalog_num == self.filters['catalog_num'])

        if 'college' in self.filters:
            query = query.filter(Department.college == self.filters['college'])
        
        if 'search_query' in self.filters:
            search_term = f"%{self.filters['search_query']}%"
            split_search_term = self.filters['search_query'].split()
            if len(split_search_term) == 2:
                query = query.filter( 
                    or_(
                            Course.title.ilike(search_term),
                            and_(
                                Instructor.first_name.ilike(f"%{split_search_term[0]}%"),
                                Instructor.last_name.ilike(f"%{split_search_term[-1]}%"),
                            ),
                            func.concat(Course.subject, ' ', Course.catalog_num).ilike(search_term)
                        )
                )
            else:  
                query = query.filter(
                    or_(
                        Course.title.ilike(search_term),
                        Instructor.first_name.ilike(search_term),
                        Instructor.last_name.ilike(search_term),
                        func.concat(Course.subject, ' ', Course.catalog_num).ilike(search_term)
                    )
                )   
        if 'title' in self.filters:
            query = query.filter(Course.title.ilike(f"%{self.filters['title']}%"))
        
        if 'instructor' in self.filters:
            names = self.filters['instructor'].split()
            if len(names) >= 2:
                query = query.filter(
                    Instructor.first_name.ilike(f"%{names[0]}%"),
                    Instructor.last_name.ilike(f"%{names[-1]}%")
                    )
            else:
                query = query.filter(
                    or_(
                        Instructor.first_name.ilike(f"%{names[0]}%"),
                        Instructor.last_name.ilike(f"%{names[0]}%")
                    )
                )
        
        if 'days' in self.filters:
            days_filter = self.filters['days']
            # Build a condition that checks if ANY of the selected days appears in class_days
            # For example, if user selects "MW", we want to match "MWF", "MW", "M", "W", etc.
            
            # Create OR conditions for each day
            day_conditions = [Section.class_days.ilike(f"%{day}%") for day in days_filter]
            if day_conditions:
                query = query.filter(or_(*day_conditions))
        
        if 'term' in self.filters:
            query = query.filter(Term.session_code == self.filters['term'])
        
        # Units with operator support
        if 'units' in self.filters:
            units_operator = self.filters.get('units_operator', 'exact')
            units_value = self.parse_int(self.filters['units'])
            
            # ignore this filter if invalid input
            if units_value is not None:
                if units_operator == 'exact':
                    query = query.filter(Course.units == units_value)
                elif units_operator == 'greater':
                    query = query.filter(Course.units > units_value)
                elif units_operator == 'less':
                    query = query.filter(Course.units < units_value)
                elif units_operator == 'greater_equal':
                    query = query.filter(Course.units >= units_value)
                elif units_operator == 'less_equal':
                    query = query.filter(Course.units <= units_value)

        min_units = self.parse_int(self.filters.get('min_units'))
        if min_units is not None:
            query = query.filter(Course.units >= min_units)

        max_units = self.parse_int(self.filters.get('max_units'))
        if max_units is not None:
            query = query.filter(Course.units <= max_units)
        
        if 'instruction_mode' in self.filters:
            query = query.filter(Section.instruction_mode == self.filters['instruction_mode'])
        
        if 'component' in self.filters:
            query = query.filter(Section.component == self.filters['component'])
        
        if 'status' in self.filters:
            query = query.filter(Section.class_status == self.filters['status'])
        
        if 'course_career' in self.filters:
            grad_level = self.filters['course_career']
            if grad_level == 'Undergraduate':
                query = query.filter(Course.catalog_num_int < 500)
            elif grad_level == 'Graduate':
                query = query.filter(Course.catalog_num_int > 599)
            elif grad_level == 'Medical School':
                query = query.filter(Course.catalog_num_int > 1000)
        
        level = self.parse_int(self.filters.get('level'))
        if level is not None:
            if level == 1:
                query = query.filter(and_(Course.catalog_num_int >= 100, Course.catalog_num_int <= 199))
            elif level == 2:
                query = query.filter(and_(Course.catalog_num_int >= 200, Course.catalog_num_int <= 299))
            elif level == 3:
                query = query.filter(and_(Course.catalog_num_int >= 300, Course.catalog_num_int <= 399))
            elif level == 4:
                query = query.filter(and_(Course.catalog_num_int >= 400, Course.catalog_num_int <= 499))
            elif level == 5:
                query = query.filter(Course.catalog_num_int >= 600)

        if 'room' in self.filters:
            room_search = self.filters['room']
            query = query.filter(Section.room_code.ilike(f"%{room_search}%"))

        # # Order results
        # query = query.order_by(Course.subject, Course.catalog_num, Section.section_num)
        
        # Order results
        if need_instructor_join:
            query = (
                query
                .order_by(Section.id, Course.subject, Course.catalog_num, Section.section_num)
                # keep a single section with multiple instructors
                .distinct(Section.id)
            )
        else:
            query = query.order_by(Course.subject, Course.catalog_num, Section.section_num)

        return query
    
    def execute_search(self):
        """Execute the search with current filters"""
        query = self._build_query()
        self.results = query.all()
        #self.results = query.limit(self.DEFAULT_RESULT_LIMIT).all()

        return self.results
    
    def get_results_as_dict(self):
        """Get search results as list of dictionaries (for summary view)"""
        results = []

        for s in self.results:
            instructor_names = ", ".join(
                f"{i.first_name} {i.last_name}" for i in s.instructors
            )

            results.append({
                "section_id": s.id,
                "course_code": f"{s.course.subject} {s.course.catalog_num}",
                "course_title": s.course.title,
                "section_num": s.section_num,
                "days": s.class_days,
                "start_time": str(s.start_time) if s.start_time else None,
                "end_time": str(s.end_time) if s.end_time else None,
                "units": s.course.units,
                "instructor": instructor_names if instructor_names else "TBA",
                "status": s.class_status,
                "room": s.room_code,
                "component": s.component,
                "instruction_mode": s.instruction_mode,
                "catalog_num": s.course.catalog_num,
                #"department": s.get_course().get_department().college
                "enrollment_cap": s.enrollment_capacity
            })

        return results
    
    def get_result_count(self):
        """Get number of results found"""
        return len(self.results)