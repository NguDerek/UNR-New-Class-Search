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
        query = """
            SELECT DISTINCT
                s.id, s.course_id, s.term_id, s.section_num, s.component,
                s.instruction_mode, s.class_days, s.start_time, s.end_time,
                s.combined, s.class_status, s.enrollment_capacity, s.room_code,
                c.id, c.department_id, c.subject, c.catalog_num, c.title, 
                c.description, c.units,
                i.id, i.first_name, i.last_name
            FROM section s
            JOIN course c ON s.course_id = c.id
            JOIN department d ON c.department_id = d.id
            JOIN term t ON s.term_id = t.id
            LEFT JOIN section_instructor si ON s.id = si.section_id
            LEFT JOIN instructor i ON si.instructor_id = i.id
            WHERE 1=1
        """
        
        params = []
        
        # Add filters dynamically based on what was provided
        if 'subject' in self.filters:
            query += " AND c.subject = %s"
            params.append(self.filters['subject'])

        if 'catalog_num' in self.filters:
            query += " AND c.catalog_num = %s"
            params.append(self.filters['catalog_num'])

        if 'college' in self.filters:
            query += " AND d.college = %s"
            params.append(self.filters['college'])
        
        if 'search_query' in self.filters:
            search_term = f"%{self.filters['search_query']}%"
            query += """ AND (
                c.title ILIKE %s 
                OR i.first_name ILIKE %s 
                OR i.last_name ILIKE %s
                OR CONCAT(c.subject, ' ', c.catalog_num) ILIKE %s
            )"""
            params.extend([search_term, search_term, search_term, search_term])
        if 'title' in self.filters:
            query += " AND c.title ILIKE %s"
            params.append(f"%{self.filters['title']}%")
        
        if 'instructor' in self.filters:
            query += " AND (i.first_name ILIKE %s OR i.last_name ILIKE %s)"
            pattern = f"%{self.filters['instructor']}%"
            params.append(pattern)
            params.append(pattern)
        
        if 'days' in self.filters:
            days_filter = self.filters['days']
            # Build a condition that checks if ANY of the selected days appears in class_days
            # For example, if user selects "MW", we want to match "MWF", "MW", "M", "W", etc.
            
            # Create OR conditions for each day
            day_conditions = []
            for day in days_filter:  # days_filter is like "MW" or "MWF"
                day_conditions.append("s.class_days ILIKE %s")
                params.append(f"%{day}%")
    
            if day_conditions:
                query += " AND (" + " OR ".join(day_conditions) + ")"
        
        if 'term' in self.filters:
            query += " AND t.session_code = %s"
            params.append(self.filters['term'])
        
        # Units with operator support
        if 'units' in self.filters:
            units_operator = self.filters.get('units_operator', 'exact')
            units_value = self.filters['units']
            
            if units_operator == 'exact':
                query += " AND c.units = %s"
                params.append(units_value)
            elif units_operator == 'greater':
                query += " AND c.units > %s"
                params.append(units_value)
            elif units_operator == 'less':
                query += " AND c.units < %s"
                params.append(units_value)
            elif units_operator == 'greater_equal':
                query += " AND c.units >= %s"
                params.append(units_value)
            elif units_operator == 'less_equal':
                query += " AND c.units <= %s"
                params.append(units_value)

        if 'min_units' in self.filters:
            query += " AND c.units >= %s"
            params.append(self.filters['min_units'])
        
        if 'max_units' in self.filters:
            query += " AND c.units <= %s"
            params.append(self.filters['max_units'])
        
        if 'instruction_mode' in self.filters:
            query += " AND s.instruction_mode = %s"
            params.append(self.filters['instruction_mode'])
        
        if 'component' in self.filters:
            query += " AND s.component = %s"
            params.append(self.filters['component'])
        
        if 'status' in self.filters:
            query += " AND s.class_status = %s"
            params.append(self.filters['status'])
        
        if 'course_career' in self.filters:
            grad_level = self.filters['course_career']
            if grad_level == 'Undergraduate':
                query += " AND c.catalog_num < %s"
                params.append(500)
            elif grad_level == 'Graduate':
                query += " AND c.catalog_num > %s"
                params.append(599)
            elif grad_level == 'Medical School':
                query += " AND c.catalog_num > %s"
                params.append(1000)
        
        if 'level' in self.filters:
            lvl = int(self.filters['level'])
            print(lvl)
            if lvl == 1:
                query += " AND c.catalog_num >= %s AND c.catalog_num <= %s"
                params.append(100)
                params.append(199)
                print('Hi')
            elif lvl == 2:
                query += " AND c.catalog_num >= %s AND c.catalog_num <= %s"
                params.append(200)
                params.append(299)
            elif lvl == 3:
                query += " AND c.catalog_num >= %s AND c.catalog_num <= %s"
                params.append(300)
                params.append(399)
            elif lvl == 4:
                query += " AND c.catalog_num >= %s AND c.catalog_num <= %s"
                params.append(400)
                params.append(499)
            elif lvl == 5:
                query += " AND c.catalog_num >= %s"
                params.append(600)

        if 'room' in self.filters:
            room_search = self.filters['room']
            query += "AND s.room_code ILIKE %s"
            params.append(f"%{room_search}%")

        # Order results
        query += " ORDER BY c.subject, c.catalog_num, s.section_num;"
        
        return query, params
    
    def execute_search(self):
        """Execute the search with current filters"""
        query, params = self._build_query()
        results = DatabaseConnection.execute_query(query, params)
        
        # Create Section objects with pre-populated related data (efficient!)
        sections = []
        for r in results:
            # Create Section object
            section = Section(
                id=r[0], course_id=r[1], term_id=r[2], section_num=r[3],
                component=r[4], instruction_mode=r[5], class_days=r[6],
                start_time=r[7], end_time=r[8], combined=r[9],
                class_status=r[10], enrollment_capacity=r[11], room_code=r[12]
            )
            
            # Pre-populate Course (avoid N+1 queries)
            section._course = Course(
                id=r[13], department_id=r[14], subject=r[15],
                catalog_num=r[16], title=r[17], description=r[18], units=r[19]
            )
            
            # Pre-populate Instructor if exists
            if r[20]:  # If instructor exists
                section._instructors = [
                    Instructor(id=r[20], first_name=r[21], last_name=r[22])
                ]
            
            sections.append(section)
        
        self.results = sections
        return sections
    
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