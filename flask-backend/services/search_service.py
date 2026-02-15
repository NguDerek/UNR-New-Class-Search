from dbconnect.connection import DatabaseConnection
from models.section import Section, section_instructor
from models.course import Course
from models.instructor import Instructor
from models.department import Department
from models.term import Term
from sqlalchemy import and_, or_, func
from database import db

class SearchService:
    """Handles complex search operations with multiple criteria"""
    
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
    
    def _build_query(self):
        #Builds the search query based on filters
        # Base query with JOINs - gets everything in ONE query (efficient!)
        query = db.session.query(Section, Course, Instructor).\
            join(Course, Section.course_id == Course.id).\
            join(Department, Course.department_id == Department.id).\
            join(Term, Section.term_id == Term.id).\
            outerjoin(section_instructor, Section.id == section_instructor.c.section_id).\
            outerjoin(Instructor, section_instructor.c.instructor_id == Instructor.id)
        
        # Add filters dynamically based on what was provided
        if 'subject' in self.filters:
            query = query.filter(Course.subject == self.filters['subject'])

        if 'catalog_num' in self.filters:
            query = query.filter(Course.catalog_num == self.filters['catalog_num'])

        if 'college' in self.filters:
            query = query.filter(Department.college == self.filters['college'])
        
        if 'search_query' in self.filters:
            search_term = f"%{self.filters['search_query']}%"
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
            pattern = f"%{self.filters['instructor']}%"
            query = query.filter(
                or_(
                    Instructor.first_name.ilike(pattern),
                    Instructor.last_name.ilike(pattern)
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
            units_value = self.filters['units']
            
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

        if 'min_units' in self.filters:
            query = query.filter(Course.units >= self.filters['min_units'])
        
        if 'max_units' in self.filters:
            query = query.filter(Course.units <= self.filters['max_units'])
        
        if 'instruction_mode' in self.filters:
            query = query.filter(Section.instruction_mode == self.filters['instruction_mode'])
        
        if 'component' in self.filters:
            query = query.filter(Section.component == self.filters['component'])
        
        if 'status' in self.filters:
            query = query.filter(Section.class_status == self.filters['status'])
        
        if 'course_career' in self.filters:
            grad_level = self.filters['course_career']
            if grad_level == 'Undergraduate':
                query = query.filter(Course.catalog_num < 500)
            elif grad_level == 'Graduate':
                query = query.filter(Course.catalog_num > 599)
            elif grad_level == 'Medical School':
                query = query.filter(Course.catalog_num > 1000)
        
        if 'level' in self.filters:
            lvl = int(self.filters['level'])
            print(lvl)
            if lvl == 1:
                query = query.filter(and_(Course.catalog_num >= 100, Course.catalog_num <= 199))
            elif lvl == 2:
                query = query.filter(and_(Course.catalog_num >= 200, Course.catalog_num <= 299))
            elif lvl == 3:
                query = query.filter(and_(Course.catalog_num >= 300, Course.catalog_num <= 399))
            elif lvl == 4:
                query = query.filter(and_(Course.catalog_num >= 400, Course.catalog_num <= 499))
            elif lvl == 5:
                query = query.filter(Course.catalog_num >= 600)

        if 'room' in self.filters:
            room_search = self.filters['room']
            query = query.filter(Section.room_code.ilike(f"%{room_search}%"))

        # Order results
        query = query.order_by(Course.subject, Course.catalog_num, Section.section_num).distinct()
        
        return query
    
    def execute_search(self):
        """Execute the search with current filters"""
        query = self._build_query()
        results = query.all()
        
        # Process results and group instructors by section
        sections_dict = {}

        for section, course, instructor in results:
            if section.id not in sections_dict:
                # Create a new section entry
                section._course = course
                section._instructors = []
                sections_dict[section.id] = section

            # Add instructor if exists and not already added
            if instructor and instructor not in sections_dict[section.id]._instructors:
                sections_dict[section.id]._instructors.append(instructor)

        self.results = list(sections_dict.values())
        return self.results
    
    def get_results_as_dict(self):
        """Get search results as list of dictionaries (for summary view)"""
        return [
            {
                "section_id": s.id,
                "course_code": s.get_course().get_course_code(),
                "course_title": s.get_course().title,
                "section_num": s.section_num,
                "days": s.class_days,
                "start_time": str(s.start_time) if s.start_time else None,
                "end_time": str(s.end_time) if s.end_time else None,
                "units": s.get_course().units,
                "instructor": s.get_instructors()[0].get_full_name() if s.get_instructors() else "TBA",
                "status": s.class_status,
                "room": s.room_code,
                "component": s.component,
                "instruction_mode": s.instruction_mode,
                "catalog_num": s.get_course().catalog_num
                #"department": s.get_course().get_department().college
            }
            for s in self.results
        ]
    
    def get_result_count(self):
        """Get number of results found"""
        return len(self.results)