import psycopg2
from config import Config

class DatabaseConnection:
    """Handles all database connection and query execution"""
    
    @staticmethod
    def get_connection():
        """Create and return a database connection"""
        try:
            return psycopg2.connect(Config.get_db_url())
        except psycopg2.Error as e:
            raise Exception(f"Database connection failed: {str(e)}")
    
    @staticmethod
    def execute_query(query, params=None):
        """
        Execute a SELECT query and return all results
        
        Args:
            query (str): SQL query string
            params (list): Query parameters for safe parameterization
            
        Returns:
            list: List of tuples containing query results
        """
        conn = None
        cur = None
        try:
            conn = DatabaseConnection.get_connection()
            cur = conn.cursor()
            cur.execute(query, params or [])
            results = cur.fetchall()
            return results
        except psycopg2.Error as e:
            raise Exception(f"Query execution failed: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
    
    @staticmethod
    def execute_single(query, params=None):
        """
        Execute a query and return single result
        
        Args:
            query (str): SQL query string
            params (list): Query parameters
            
        Returns:
            tuple: Single row result or None
        """
        conn = None
        cur = None
        try:
            conn = DatabaseConnection.get_connection()
            cur = conn.cursor()
            cur.execute(query, params or [])
            result = cur.fetchone()
            return result
        except psycopg2.Error as e:
            raise Exception(f"Query execution failed: {str(e)}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()