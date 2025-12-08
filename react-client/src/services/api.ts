const API_BASE_URL = 'http://localhost:5000';

export interface SearchParams {
  subject?: string;
  catalog_num?: string;
  catalog_num_operator?: 'exact' | 'greater' | 'less' | 'greater_equal' | 'less_equal';
  title?: string;
  instructor?: string;
  days?: string;
  term?: string;
  units?: string;
  units_operator?: 'exact' | 'greater' | 'less' | 'greater_equal' | 'less_equal';
  instruction_mode?: string;
  component?: string;
  status?: string;
  department?: string;
  search_query?: string;
  course_career?: string;
  level?: string;
}

export interface Section {
  section_id: number;
  course_code: string;
  course_title: string;
  section_num: number;
  days: string | null;
  start_time: string | null;
  end_time: string | null;
  units: number;
  instructor: string;
  status: string;
  room: string | null;
  component: string
}

export interface SectionDetails {
  section_info: {
    section_id: number;
    section_num: number;
    component: string;
    instruction_mode: string;
    days: string;
    start_time: string;
    end_time: string;
    room: string;
    capacity: number;
    status: string;
    combined: boolean;
  };
  course_info: {
    course_id: number;
    subject: string;
    catalog_num: number;
    title: string;
    description: string;
    units: number;
    course_code: string;
  };
  department_info?: {
    department_id: number;
    department_code: string;
    college: string;
  };
  term_info?: {
    term_id: number;
    session_code: string;
    start_date: string;
    end_date: string;
  };
  instructors?: Array<{
    instructor_id: number;
    name: string;
    first_name: string;
    last_name: string;
  }>;
}

export interface SearchResponse {
  status: string;
  sections: Section[];
  count: number;
  filters_used?: Record<string, any>;
}

export interface SectionDetailsResponse {
  status: string;
  section?: SectionDetails;
  details?: SectionDetails;
  message?: string;
}

class CourseAPI {
  /**
   * Search for courses/sections with filters
   */
  async searchCourses(params: SearchParams): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();
    
    // Add all non-empty parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(
      `${API_BASE_URL}/courses/search?${queryParams.toString()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    
    return response.json();
  }

  /**
   * Get detailed information about a specific section
   */
  async getSectionDetails(sectionId: number): Promise<SectionDetailsResponse> {
    const response = await fetch(`${API_BASE_URL}/sections/${sectionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch section details');
    }
    
    return response.json();
  }

  /**
   * Get all departments (for dropdown)
   */
  async getDepartments() {
    const response = await fetch(`${API_BASE_URL}/departments`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }
    
    return response.json();
  }
}

export const courseAPI = new CourseAPI();