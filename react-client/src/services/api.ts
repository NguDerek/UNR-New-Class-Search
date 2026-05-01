const API_BASE_URL = 'api';

export interface SearchParams {
  subject?: string;
  catalog_num?: string;
  room?: string;
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
  //search_query_type?: string;
  course_career?: string;
  level?: string;
}

export interface Section {
  section_id: number;
  course_code: string;
  course_title: string;
  section_num: string;
  days: string | null;
  start_time: string | null;
  end_time: string | null;
  units: number;
  instructor: string;
  status: string;
  room: string | null;
  component: string;
  instruction_mode: string;
  catalog_num: string;
  //department: string;
  enrollment_cap: number;
  attachments?: Array<{
    id: number;
    original_name: string;
    mime_type: string;
    download_url: string;
  }>;
  start_date: string;
  end_date: string;
}

export interface SectionDetails {
  section_info: {
    section_id: number;
    section_num: string;
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
    catalog_num: string;
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

export interface ProgramAttachment {
  id: number;
  programId: number;
  originalName: string;
  mimeType: string;
  filepath: string;
  uploadedAt: string;
}

export interface Program {
  id: number;
  college: string;
  title: string;
  poid: string;
  link: string;
  description: string;
  level: string;
  attachments: ProgramAttachment[];
}

export interface CollegeGroup {
  college: string;
  undergraduate: Program[];
  graduate: Program[]
}

export interface ProgramsResponse {
  colleges: CollegeGroup[];
  minors: Program[];
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

    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Failed to fetch courses');
    }
    
    return data;
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

  async getRecommendations(
    programId: string,
    params: SearchParams = {}
  ) {
    const queryParams = new URLSearchParams();

    // Add all non-empty parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();

    const url = queryString
      ? `${API_BASE_URL}/recommendation/${programId}?${queryString}`
      : `${API_BASE_URL}/recommendation/${programId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }

    return response.json();
  }

  async fetchPrograms(): Promise<ProgramsResponse> {
    const response = await fetch(`${API_BASE_URL}/programs`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Programs failed to load');
    }
    return response.json();
  }

  async setUserMajor(poid: string): Promise<void> {
    // Get CSRF token first (your app already has this route)
    const csrfRes = await fetch(`${API_BASE_URL}/csrf-token`, {
      credentials: 'include',
    });
    const { csrf_token } = await csrfRes.json();

    const response = await fetch(`${API_BASE_URL}/user/major`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrf_token,       // <-- this is what was missing
      },
      body: JSON.stringify({ poid: poid }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'Failed to update major');
    }
  }
}

export const courseAPI = new CourseAPI();