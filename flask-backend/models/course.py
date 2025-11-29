from dbconnect.connection import DatabaseConnection

class Course:
    #Represents a course with its specific information

    def __init__(self, id=None, department_id=None, subject=None, catalog_num=None, title=None, description=None, units=None):
        self.id = id
        self.department_id = department_id
        self.subject = subject
        self.catalog_num = catalog_num
        self.title = title
        self.description = description
        self.units = units

        self._department = None