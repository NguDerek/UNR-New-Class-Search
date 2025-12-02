from dbconnect.connection import DatabaseConnection

class Department:
    #Represents an academic department (ENGR, BUS, CABNR)

    def __init__(self, id=None, college=None, department_code=None):
        #Primary ID
        self.id = id

        #Department properties
        self.college = college
        self.department_code = department_code

    #Getter Methods
    def get_id(self):
        return self.id
    
    def get_college(self):
        return self.college
    
    def get_department_code(self):
        return self.department_code
    
    #Format method to convert properties into json format
    def format(self):
        return {
            'id': self.id,
            'college': self.college,
            'department_code': self.department_code
        }
    
    #Static methods to test database operations
    @staticmethod
    def get_all():
        #Gets all departments
        query = "SELECT id, college, department_code FROM department ORDER BY department_code;"
        results = DatabaseConnection.execute_query(query)
        return [Department(r[0], r[1], r[2]) for r in results]
    
    @staticmethod
    def get_by_id(department_id):
        #Gets a department from id
        query = "SELECT id, college, department_code FROM department WHERE id = %s;"
        result = DatabaseConnection.execute_single(query, [department_id])
        if result:
            return Department(result[0], result[1], result[2])
        return None