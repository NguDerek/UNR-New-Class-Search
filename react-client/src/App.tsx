import { useState, useMemo, useEffect } from "react";
import { CourseCard } from "./components/CourseCard";
import { SearchFilters } from "./components/SearchFilters";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { Programs } from "./components/Programs";
import { Planner } from "./components/Planner";
import { Login } from "./components/Login";
import { SignUp } from "./components/SignUp"
import { courseAPI } from './services/api';
import type { Section as APISection, SearchParams } from './services/api'
import { Menu } from "lucide-react";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface Course {
  id: string;
  code: string;
  courseNumber: string;
  title: string;
  instructor: string;
  schedule: string;
  credits: number;
  enrolled: number;
  capacity: number;
  location: string;
  department: string;
  component: string;
  section: number;
  level: string;
  days: string[];
  courseCareer: string;
  modeOfInstruction: string;
}

const MOCK_COURSES: Course[] = [
  {
    id: "1",
    code: "CS 101",
    courseNumber: "101",
    title: "Introduction to Computer Science",
    instructor: "Dr. Sarah Johnson",
    schedule: "MWF 9:00 AM - 10:00 AM",
    credits: 3,
    enrolled: 28,
    capacity: 30,
    location: "Science Building 201",
    department: "Computer Science",
    component: "LEC",
    section: 1001,
    level: "100-Level",
    days: ["Mon", "Wed", "Fri"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  // {
  //   id: "2",
  //   code: "CS 201",
  //   courseNumber: "201",
  //   title: "Data Structures and Algorithms",
  //   instructor: "Prof. Michael Chen",
  //   schedule: "TTh 1:00 PM - 2:30 PM",
  //   credits: 4,
  //   enrolled: 35,
  //   capacity: 35,
  //   location: "Engineering Hall 105",
  //   department: "Computer Science",
  //   level: "200-Level",
  //   days: ["Tue", "Thu"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "Hybrid",
  // },
  // {
  //   id: "3",
  //   code: "MATH 210",
  //   courseNumber: "210",
  //   title: "Calculus II",
  //   instructor: "Dr. Emily Rodriguez",
  //   schedule: "MWF 11:00 AM - 12:00 PM",
  //   credits: 4,
  //   enrolled: 22,
  //   capacity: 30,
  //   location: "Mathematics Building 301",
  //   department: "Mathematics",
  //   level: "200-Level",
  //   days: ["Mon", "Wed", "Fri"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "4",
  //   code: "PHYS 150",
  //   courseNumber: "150",
  //   title: "General Physics I",
  //   instructor: "Dr. James Wilson",
  //   schedule: "MWF 2:00 PM - 3:00 PM",
  //   credits: 3,
  //   enrolled: 18,
  //   capacity: 25,
  //   location: "Physics Lab 102",
  //   department: "Physics",
  //   level: "100-Level",
  //   days: ["Mon", "Wed", "Fri"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "5",
  //   code: "CS 305",
  //   courseNumber: "305",
  //   title: "Database Management Systems",
  //   instructor: "Prof. Rachel Kim",
  //   schedule: "TTh 10:00 AM - 11:30 AM",
  //   credits: 3,
  //   enrolled: 26,
  //   capacity: 28,
  //   location: "Computer Lab 220",
  //   department: "Computer Science",
  //   level: "300-Level",
  //   days: ["Tue", "Thu"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "Hybrid",
  // },
  // {
  //   id: "6",
  //   code: "CHEM 101",
  //   courseNumber: "101",
  //   title: "Introduction to Chemistry",
  //   instructor: "Dr. David Martinez",
  //   schedule: "MWF 8:00 AM - 9:00 AM",
  //   credits: 4,
  //   enrolled: 30,
  //   capacity: 32,
  //   location: "Chemistry Building 150",
  //   department: "Chemistry",
  //   level: "100-Level",
  //   days: ["Mon", "Wed", "Fri"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "7",
  //   code: "BIO 220",
  //   courseNumber: "220",
  //   title: "Cellular Biology",
  //   instructor: "Dr. Lisa Anderson",
  //   schedule: "TTh 2:00 PM - 3:30 PM",
  //   credits: 4,
  //   enrolled: 24,
  //   capacity: 30,
  //   location: "Biology Lab 215",
  //   department: "Biology",
  //   level: "200-Level",
  //   days: ["Tue", "Thu"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "8",
  //   code: "ENG 200",
  //   courseNumber: "200",
  //   title: "American Literature",
  //   instructor: "Prof. Robert Taylor",
  //   schedule: "MW 3:00 PM - 4:30 PM",
  //   credits: 3,
  //   enrolled: 20,
  //   capacity: 25,
  //   location: "Liberal Arts 310",
  //   department: "English",
  //   level: "200-Level",
  //   days: ["Mon", "Wed"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "9",
  //   code: "HIST 101",
  //   courseNumber: "101",
  //   title: "World History I",
  //   instructor: "Dr. Patricia Brown",
  //   schedule: "TTh 9:00 AM - 10:30 AM",
  //   credits: 3,
  //   enrolled: 27,
  //   capacity: 30,
  //   location: "Humanities Building 205",
  //   department: "History",
  //   level: "100-Level",
  //   days: ["Tue", "Thu"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "10",
  //   code: "PSY 101",
  //   courseNumber: "101",
  //   title: "Introduction to Psychology",
  //   instructor: "Dr. Jennifer Lee",
  //   schedule: "MWF 1:00 PM - 2:00 PM",
  //   credits: 3,
  //   enrolled: 32,
  //   capacity: 35,
  //   location: "Social Sciences 180",
  //   department: "Psychology",
  //   level: "100-Level",
  //   days: ["Mon", "Wed", "Fri"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "11",
  //   code: "CS 401",
  //   courseNumber: "401",
  //   title: "Machine Learning",
  //   instructor: "Prof. Alex Zhang",
  //   schedule: "MW 4:00 PM - 5:30 PM",
  //   credits: 3,
  //   enrolled: 19,
  //   capacity: 20,
  //   location: "AI Research Center 301",
  //   department: "Computer Science",
  //   level: "400-Level",
  //   days: ["Mon", "Wed"],
  //   courseCareer: "Graduate",
  //   modeOfInstruction: "Synchronous Online",
  // },
  // {
  //   id: "12",
  //   code: "MATH 310",
  //   courseNumber: "310",
  //   title: "Linear Algebra",
  //   instructor: "Dr. Kevin Park",
  //   schedule: "TTh 11:00 AM - 12:30 PM",
  //   credits: 3,
  //   enrolled: 15,
  //   capacity: 25,
  //   location: "Mathematics Building 205",
  //   department: "Mathematics",
  //   level: "300-Level",
  //   days: ["Tue", "Thu"],
  //   courseCareer: "Undergraduate",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "13",
  //   code: "BIO 500",
  //   courseNumber: "500",
  //   title: "Advanced Molecular Biology",
  //   instructor: "Dr. Amanda Stevens",
  //   schedule: "Asynchronous",
  //   credits: 4,
  //   enrolled: 12,
  //   capacity: 20,
  //   location: "Online",
  //   department: "Biology",
  //   level: "400-Level",
  //   days: [],
  //   courseCareer: "Graduate",
  //   modeOfInstruction: "Asynchronous",
  // },
  // {
  //   id: "14",
  //   code: "MED 601",
  //   courseNumber: "601",
  //   title: "Human Anatomy",
  //   instructor: "Dr. Robert Chen",
  //   schedule: "MWF 8:00 AM - 11:00 AM",
  //   credits: 6,
  //   enrolled: 48,
  //   capacity: 50,
  //   location: "Medical School Building A",
  //   department: "Biology",
  //   level: "400-Level",
  //   days: ["Mon", "Wed", "Fri"],
  //   courseCareer: "Medical School",
  //   modeOfInstruction: "In Person",
  // },
  // {
  //   id: "15",
  //   code: "CS 502",
  //   courseNumber: "502",
  //   title: "Artificial Intelligence",
  //   instructor: "Dr. Linda Wu",
  //   schedule: "TTh 6:00 PM - 8:30 PM",
  //   credits: 3,
  //   enrolled: 18,
  //   capacity: 25,
  //   location: "Engineering Hall 302",
  //   department: "Computer Science",
  //   level: "400-Level",
  //   days: ["Tue", "Thu"],
  //   courseCareer: "Graduate",
  //   modeOfInstruction: "Hybrid",
  // },
];

// Helper function to format time from 24-hour to 12-hour with AM/PM
function formatTime(timeString: string | null): string {
  if (!timeString) return '';
  
  // timeString is like "12:00:00" or "14:30:00"
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const minute = minutes;
  
  // Convert to 12-hour format
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${hour12}:${minute} ${period}`;
}

// Helper function to determine course level from catalog number
function getCourseLevel(catalogNum: number): string {
  if (catalogNum >= 500) return '600+ Level';
  if (catalogNum >= 400) return '400 Level';
  if (catalogNum >= 300) return '300 Level';
  if (catalogNum >= 200) return '200 Level';
  if (catalogNum >= 100) return '100 Level';
  return 'Other';
}

// Helper function to determine course career from catalog number
function getCourseCareer(catalogNum: number): string {
  if (catalogNum >= 600) return 'Graduate';  // If your school uses 600+ for med
  return 'Undergraduate';
}

// Helper function to format instruction mode
function formatInstructionMode(mode: string): string {
  const modeMap: Record<string, string> = {
    'P': 'In Person',
    'HY': 'Hybrid',
    'WL': 'Synchronous Online',
    'WA': 'Asynchronous Online',
  };
  return modeMap[mode] || mode;
}

export default function App() {
// Authentication state
  console.log("App component rendering"); // ADD THIS
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); };

  const [searchResults, setSearchResults] = useState<APISection[]>([]);//useState<Section[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  useEffect(() => {
    fetch('http://localhost:5000/csrf-token', {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setCsrfToken(data.csrf_token))
      .catch(error => console.error('Failed to fetch CSRF token:', error));
  }, []);

  useEffect(() => {
  const checkAuthStatus = () => {
    fetch("http://localhost:5000/auth/status", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
        }
      })
      .catch((error) => {
        console.error("Error checking auth status:", error);
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  };

  checkAuthStatus();
}, []);

  const [currentView, setCurrentView] = useState<"home" | "search" | "planner" | "programs" | "settings">("home");
  const [term, setTerm] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [roomSearch, setRoomSearch] = useState("");
  const [courseCareer, setCourseCareer] = useState("all");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [modeOfInstruction, setModeOfInstruction] = useState("all");
  const [level, setLevel] = useState("all");
  const [credits, setCredits] = useState("all");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  // Applied filters - only updated when user clicks "Search Courses"
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    term: "Spring 2025",
    searchQuery: "",
    department: "all",
    roomSearch: "",
    courseCareer: "all",
    showOpenOnly: false,
    modeOfInstruction: "all",
    level: "all",
    credits: "all",
    selectedDays: [] as string[],
  });

  // Planner state
  const [plannedCourseIds, setPlannedCourseIds] = useState<Set<string>>(new Set());
/*
  const filteredCourses = useMemo(() => {
    if (!hasSearched) {
      return [];
    }
    
    return MOCK_COURSES.filter((course) => {
      // Search query filter
      const query = appliedFilters.searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        course.code.toLowerCase().includes(query) ||
        course.title.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query);

      // Subject filter
      const matchesSubject =
        appliedFilters.subject === "all" || course.department === appliedFilters.subject;

      // Course number filter
      const matchesCourseNumber =
        !appliedFilters.courseNumber || course.courseNumber.includes(appliedFilters.courseNumber);

      // Course career filter
      const matchesCareer =
        appliedFilters.courseCareer === "all" || course.courseCareer === appliedFilters.courseCareer;

      // Show open only filter
      const matchesOpenOnly =
        !appliedFilters.showOpenOnly || course.enrolled < course.capacity;

      // Mode of instruction filter
      const matchesMode =
        appliedFilters.modeOfInstruction === "all" ||
        course.modeOfInstruction === appliedFilters.modeOfInstruction;

      // Level filter
      const matchesLevel = appliedFilters.level === "all" || course.level === appliedFilters.level;

      // Credits filter
      const matchesCredits =
        appliedFilters.credits === "all" || course.credits === parseInt(appliedFilters.credits);

      // Days filter
      const matchesDays =
        appliedFilters.selectedDays.length === 0 ||
        appliedFilters.selectedDays.some((day) => course.days.includes(day));

      return (
        matchesSearch &&
        matchesSubject &&
        matchesCourseNumber &&
        matchesCareer &&
        matchesOpenOnly &&
        matchesMode &&
        matchesLevel &&
        matchesCredits &&
        matchesDays
      );
    });
  }, [hasSearched, appliedFilters]);
*/

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    
    try {
      const searchParams: SearchParams = {};
      
      // === SEARCH BAR ===
      if (searchQuery && searchQuery.trim() !== '') {
        // Check if it's a course code pattern (e.g., "CS 101", "MATH 181")
        const courseCodePattern = /^([A-Z]+)\s*(\d+)$/i;
        const match = searchQuery.match(courseCodePattern);
        
        if (match) {
          // Exact course code - use subject and catalog_num
          searchParams.subject = match[1].toUpperCase();
          searchParams.catalog_num = match[2];
        } else {
          // Everything else - use general search_query
          // This will search title, instructor name, and course code
          searchParams.search_query = searchQuery;
  }
}
        
      // === DEPARTMENT DROPDOWN ===
      if (department && department !== 'all') {
        searchParams.department = department;
      }
      
      // === COURSE NUMBER INPUT ===
      if (roomSearch && roomSearch.trim() !== '') {
        searchParams.room = roomSearch;
      }
      
      // === DAYS BUTTONS ===
      if (selectedDays.length > 0) {
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
        const daysString = selectedDays.map(d => daysMap[d] || '').join('');
        searchParams.days = daysString;
      }
      
      // === TERM DROPDOWN ===
      if (term && term !== 'all') {
        // Map frontend term names to backend session codes
        const termMap: Record<string, string> = {
          'Spring 2025': '2025',
          'Summer 2025': '202505',
          'Fall 2025': '1',
          'Winter 2026': '202601'
        };
        searchParams.term = termMap[term] || term;
      }
      
      // === COURSE CAREER DROPDOWN ===
      if (courseCareer && courseCareer !== 'all') {
        searchParams.course_career = courseCareer
      }
      
      // === CREDITS DROPDOWN ===
      if (credits && credits !== 'all') {
        if (credits === '5+') {
          searchParams.units = '5';
          searchParams.units_operator = 'greater_equal';
        } else {
          searchParams.units = credits;
          searchParams.units_operator = 'exact';
        }
      }
      
      // === MODE OF INSTRUCTION DROPDOWN ===
      if (modeOfInstruction && modeOfInstruction !== 'all') {
        const modeMap: Record<string, string> = {
          'In Person': 'P',
          'Hybrid': 'HY',
          'Asynchronous Online': 'WA',
          'Synchronous Online': 'WL'
        };
        searchParams.instruction_mode = modeMap[modeOfInstruction] || modeOfInstruction;
      }
      
      // === LEVEL DROPDOWN ===
      if (level && level !== 'all') {
        // Map level to catalog_num ranges
        if (level === '100') {
          searchParams.level = '1';
        } else if (level === '200') {
          searchParams.level = '2';
        } else if (level === '300') {
          searchParams.level = '3';;
        } else if (level === '400') {
          searchParams.level = '4';
        } else if (level === '500+') {
          searchParams.level = '5';
        }
      }
      
      // === SHOW OPEN ONLY TOGGLE ===
      if (showOpenOnly) {
        //searchParams.status = 'Open';
        //To be implemented later
      }
      
      console.log('Search params:', searchParams); // Debug - see what's being sent
      
      // Make API call
      const response = await courseAPI.searchCourses(searchParams);
      
      if (response.status === 'success') {
        setSearchResults(response.sections);
      } else {
        setSearchError('Search failed');
        setSearchResults([]);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search courses. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

/*
  const handleSearch = () => {
    setAppliedFilters({
      term,
      searchQuery,
      subject,
      courseNumber,
      courseCareer,
      showOpenOnly,
      modeOfInstruction,
      level,
      credits,
      selectedDays,
    });
    setHasSearched(true);
  };
*/
  const handleReset = () => {
    setTerm("all");
    setSearchQuery("");
    setDepartment("all");
    setRoomSearch("");
    setCourseCareer("all");
    setShowOpenOnly(false);
    setModeOfInstruction("all");
    setLevel("all");
    setCredits("all");
    setSelectedDays([]);
    setHasSearched(false);
    setAppliedFilters({
      term: "all",
      searchQuery: "",
      department: "all",
      roomSearch: "",
      courseCareer: "all",
      showOpenOnly: false,
      modeOfInstruction: "all",
      level: "all",
      credits: "all",
      selectedDays: [],
    });
  };

  const handleAddToPlanner = (courseId: string) => {
    setPlannedCourseIds((prev) => new Set(prev).add(courseId));
  };

  const handleRemoveFromPlanner = (courseId: string) => {
    setPlannedCourseIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(courseId);
      return newSet;
    });
  };

  const plannedCourses = MOCK_COURSES.filter((course) =>
    plannedCourseIds.has(course.id)
  );

  // Handle authentication
  const handleLogin = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentView("home");
  };

  const handleSignUp = (userData: User) => {
    //setIsAuthenticated(true);
    //setUser(userData);
    //setCurrentView("home");
    setAuthView("login");
  };

  const handleLogout = () => {
    fetch('http://localhost:5000/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Logout failed');
        }
        return response.json();
      })
      .then(() => {
        console.log('Logged out successfully');
        setIsAuthenticated(false);
        setUser(null);
        setAuthView("login");
      })
      .catch((error: Error) => {
        console.error('Logout error:', error);

        //Still log out on frontend even if backend fails
        setIsAuthenticated(false);
        setUser(null);
        setAuthView("login");
      });
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // Show login/signup pages if not authenticated
  if (!isAuthenticated) {
    if (authView === "signup") {
      return (
        <SignUp 
          onSignUp={handleSignUp}
          onNavigateToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <Login 
        onLogin={handleLogin}
        onNavigateToSignUp={() => setAuthView("signup")}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} onToggle={toggleSidebar} isOpen={isSidebarOpen} user={user} />
      
      <div className="flex-1">

        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-3 bg-[#003366] text-white rounded-lg shadow-lg hover:bg-[#004080] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}


        {currentView === "home" ? (
          <Home onGetStarted={() => setCurrentView("search")} />
        ) : currentView === "settings" ? (
          <Settings />
        ) : currentView === "programs" ? (
          <Programs />
        ) : currentView === "planner" ? (
          <Planner 
            plannedCourses={plannedCourses} 
            onRemoveFromPlanner={handleRemoveFromPlanner}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
            {/* Page Title Section */}
            <div className="mb-8 lg:mb-12">
              <h1 className="text-[#003366] mb-2">University of Nevada, Reno</h1>
              <p className="text-slate-600">Class Search</p>
            </div>

            {/* Filters - Full Width */}
            <SearchFilters
              term={term}
              setTerm={setTerm}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              department={department}
              setDepartment={setDepartment}
              roomSearch={roomSearch}
              setRoomSearch={setRoomSearch}
              courseCareer={courseCareer}
              setCourseCareer={setCourseCareer}
              showOpenOnly={showOpenOnly}
              setShowOpenOnly={setShowOpenOnly}
              modeOfInstruction={modeOfInstruction}
              setModeOfInstruction={setModeOfInstruction}
              level={level}
              setLevel={setLevel}
              credits={credits}
              setCredits={setCredits}
              selectedDays={selectedDays}
              setSelectedDays={setSelectedDays}
              onSearch={handleSearch}
              onReset={handleReset}
            />

            {/* Course Results */}
            {hasSearched && (
              <>
                <div className="mb-6 flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-slate-700">
                    <span className="text-[#003366]">{searchResults.length}</span> sections found
                  </p>
                </div>

                {isSearching ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600">Searching...</p>
                  </div>
                ) : searchError ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-red-200 shadow-sm bg-red-50">
                    <p className="text-red-600">{searchError}</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid gap-5">
                    {searchResults.map((section) => (
                      <CourseCard 
                        key={section.section_id}
                        id={section.section_id.toString()}
                        code={section.course_code}
                        title={section.course_title}
                        instructor={section.instructor}
                        schedule={`${section.days || 'TBA'} ${formatTime(section.start_time)} - ${formatTime(section.end_time)}`}
                        credits={section.units}
                        enrolled={0}
                        capacity={100}
                        location={section.room || 'TBA'}
                        department={section.course_code.split(' ')[0]}//{section.department}
                        component={section.component}
                        section={section.section_num}
                        level={getCourseLevel(section.catalog_num)}
                        courseCareer={getCourseCareer(section.catalog_num)}
                        modeOfInstruction={formatInstructionMode(section.instruction_mode)}
                        isInPlanner={plannedCourseIds.has(section.section_id.toString())}
                        onAddToPlanner={handleAddToPlanner}
                        showPlannerButton={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-300 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 mb-2">No courses found</p>
                    <p className="text-sm text-slate-400">
                      Try adjusting your filters or search query
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}