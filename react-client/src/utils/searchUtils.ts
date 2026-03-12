import { courseAPI } from "@/services/api";

export interface SearchParams{
    subject?: string;
    catalog_num?: string;
    search_query?: string;
    department?: string;
    room?: string;
    days?: string;
    term?: string;
    course_career?: string;
    units?: string;
    units_operator?: "greater_equal" | "exact" | "greater" | "less" | "less_equal";
    instruction_mode?: string;
    level?: string;
}

export interface SearchFilterValues {
  searchQuery: string;
  department: string;
  roomSearch: string;
  selectedDays: string[];
  term: string;
  courseCareer: string;
  credits: string;
  modeOfInstruction: string;
  level: string;
  showOpenOnly: boolean;
}

export async function executeCourseSearch(filters: SearchFilterValues){
    const searchParams: SearchParams = {};

    // === SEARCH BAR ===
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        // Check if it's a course code pattern (e.g., "CS 101", "MATH 181")
        const courseCodePattern = /^([A-Z]+)\s*(\d+)$/i;
        const match = filters.searchQuery.match(courseCodePattern);
        
        if (match) {
          // Exact course code - use subject and catalog_num
          searchParams.subject = match[1].toUpperCase();
          searchParams.catalog_num = match[2];
        } else {
          // Everything else - use general search_query
          // This will search title, instructor name, and course code
          searchParams.search_query = filters.searchQuery;
  }
}
        
      // === DEPARTMENT DROPDOWN ===
      if (filters.department && filters.department !== 'all') {
        searchParams.department = filters.department;
      }
      
      // === COURSE NUMBER INPUT ===
      if (filters.roomSearch && filters.roomSearch.trim() !== '') {
        searchParams.room = filters.roomSearch;
      }
      
      // === DAYS BUTTONS ===
      if (filters.selectedDays.length > 0) {
        // Convert ["Mon", "Tue", "Wed"] to "MTW"
        const daysMap: Record<string, string> = {
          'Mon': 'M',
          'Tue': 'T',
          'Wed': 'W',
          'Thu': 'R',  // Thursday is 'R' to avoid confusion with Tuesday
          'Fri': 'F',
          'Sat': 'S',
          'Sun': 'U'
        };
        const daysString = filters.selectedDays.map(d => daysMap[d] || '').join('');
        searchParams.days = daysString;
      }
      
      // === TERM DROPDOWN ===
      if (filters.term && filters.term !== 'all') {
        // Map frontend term names to backend session codes
        const termMap: Record<string, string> = {
          'Spring 2025': '2025',
          'Summer 2025': '202505',
          'Fall 2025': '1',
          'Winter 2026': '202601'
        };
        searchParams.term = termMap[filters.term] || filters.term;
      }
      
      // === COURSE CAREER DROPDOWN ===
      if (filters.courseCareer && filters.courseCareer !== 'all') {
        searchParams.course_career = filters.courseCareer
      }
      
      // === CREDITS DROPDOWN ===
      if (filters.credits && filters.credits !== 'all') {
        if (filters.credits === '5+') {
          searchParams.units = '5';
          searchParams.units_operator = 'greater_equal';
        } else {
          searchParams.units = filters.credits;
          searchParams.units_operator = 'exact';
        }
      }
      
      // === MODE OF INSTRUCTION DROPDOWN ===
      if (filters.modeOfInstruction && filters.modeOfInstruction !== 'all') {
        const modeMap: Record<string, string> = {
          'In Person': 'P',
          'Hybrid': 'HY',
          'Asynchronous Online': 'WA',
          'Synchronous Online': 'WL'
        };
        searchParams.instruction_mode = modeMap[filters.modeOfInstruction] || filters.modeOfInstruction;
      }
      
      // === LEVEL DROPDOWN ===
      if (filters.level && filters.level !== 'all') {
        // Map level to catalog_num ranges
        if (filters.level === '100') {
          searchParams.level = '1';
        } else if (filters.level === '200') {
          searchParams.level = '2';
        } else if (filters.level === '300') {
          searchParams.level = '3';;
        } else if (filters.level === '400') {
          searchParams.level = '4';
        } else if (filters.level === '500+') {
          searchParams.level = '5';
        }
      }

      return await courseAPI.searchCourses(searchParams);
}