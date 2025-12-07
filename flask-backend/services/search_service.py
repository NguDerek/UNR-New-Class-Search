from dbconnect.connection import DatabaseConnection
from models.section import Section
from models.course import Course
from models.instructor import Instructor

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
        
        if 'title' in self.filters:
            query += " AND c.title ILIKE %s"
            params.append(f"%{self.filters['title']}%")
        
        if 'instructor' in self.filters:
            query += " AND (i.first_name ILIKE %s OR i.last_name ILIKE %s)"
            pattern = f"%{self.filters['instructor']}%"
            params.append(pattern)
            params.append(pattern)
        
        if 'days' in self.filters:
            query += " AND s.class_days ILIKE %s"
            params.append(f"%{self.filters['days']}%")
        
        if 'term' in self.filters:
            query += " AND t.session_code = %s"
            params.append(self.filters['term'])
        
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
                "room": s.room_code
            }
            for s in self.results
        ]
    
    def get_result_count(self):
        """Get number of results found"""
        return len(self.results)