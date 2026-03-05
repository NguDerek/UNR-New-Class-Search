import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    #Application configuration class
    
    # Database configuration
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    # Flask configuration. May be required later for user sign-in
    DEBUG = os.getenv("DEBUG", "True") == "True"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    
    @staticmethod
    def get_db_url():
        #Get database URL
        if not Config.DATABASE_URL:
            raise ValueError("DATABASE_URL not set in environment variables")
        return Config.DATABASE_URL
    
    @staticmethod
    def validate_config():
        #Validate that required configuration exists
        if not Config.DATABASE_URL:
            return False, "DATABASE_URL is missing"
        return True, "Configuration valid"