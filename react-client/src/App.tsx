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
import type { Section as APISection, SearchParams } from './services/api'
import { Menu } from "lucide-react";
import { formatTime, getCourseLevel, getCourseCareer, formatInstructionMode } from "./utils/courseHelpers.ts"
import { viewPermissions } from "./lib/permissions";
import type { Role } from "./lib/permissions";
import { executeCourseSearch } from "./utils/searchUtils.ts";
import { AdminDashboard } from "./components/AdminDashboard.tsx";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
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
  section: string;
  level: string;
  days: string[];
  courseCareer: string;
  modeOfInstruction: string;
}

export default function App() {
// Authentication state
  console.log("App component rendering");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); };

  const [searchResults, setSearchResults] = useState<APISection[]>([]);//useState<Section[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/csrf-token', {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setCsrfToken(data.csrf_token))
      .catch(error => console.error('Failed to fetch CSRF token:', error));
  }, []);

  useEffect(() => {
    const checkAuthStatus = () => {
      fetch("/api/auth/status", {
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
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch('/api/planner', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const ids = new Set(data.sections.map((s: any) => s.section_id.toString()));
          setPlannedCourseIds(ids as Set<string>);
        }
      })
      .catch(err => console.error('Failed to load planner:', err));
  }, [isAuthenticated]);


  const [currentView, setCurrentView] = useState<"home" | "search" | "planner" | "programs" | "settings" | "login" | "signup" | "admin">("home");
  const [term, setTerm] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryType, setSearchQueryType] = useState("all");
  const [department, setDepartment] = useState("all");
  const [roomSearch, setRoomSearch] = useState("");
  const [courseCareer, setCourseCareer] = useState("all");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [modeOfInstruction, setModeOfInstruction] = useState("all");
  const [level, setLevel] = useState("all");
  const [credits, setCredits] = useState("all");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  const role: Role = (user?.role as Role) ?? "Guest";

  const publicViews: typeof currentView[] = ["login", "signup"];

  if (!publicViews.includes(currentView) && !viewPermissions[currentView].includes(role)) {
    return (
      <div className="flex-1 p-6 text-center text-red-600">
        You are not authorized to view this page.
      </div>
    );
  }
  
  // Applied filters - only updated when user clicks "Search Courses"
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    term: "Spring 2025",
    searchQuery: "",
    searchQueryType: "all",
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

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    
    try {
        const response = await executeCourseSearch({
          searchQuery, searchQueryType, department, roomSearch, selectedDays,
          term, courseCareer, credits, modeOfInstruction,
          level, showOpenOnly,
        });
      
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

  const handleReset = () => {
    setTerm("all");
    setSearchQuery("");
    setSearchQueryType("all")
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
      searchQueryType: "all",
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

  const handleAddToPlanner = async (courseId: string) => {
    //setPlannedCourseIds((prev) => new Set(prev).add(courseId));
    try {
      const response = await fetch('/api/planner/section', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ section_id: parseInt(courseId) })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to add to planner:', data.error);
        return;
      }

      setPlannedCourseIds((prev) => new Set(prev).add(courseId));
      console.log('Section added to planner');

    } catch (error) {
      console.error('Error adding to planner:', error);
    }
  };

  const handleRemoveFromPlanner = async (courseId: string) => {
    try {
      const response = await fetch(`/api/planner/section/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken
        }
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to remove from planner:', data.error);
        return;
      }

      setPlannedCourseIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
      console.log('Section removed from planner');

    } catch (error) {
      console.error('Error removing from planner:', error);
    }
  };

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
    //setAuthView("login");
    setCurrentView("login");
  };

  const handleLogout = () => {
    fetch('/api/logout', {
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
        //setAuthView("login");
        setCurrentView("home");
      })
      .catch((error: Error) => {
        console.error('Logout error:', error);

        //Still log out on frontend even if backend fails
        setIsAuthenticated(false);
        setUser(null);
        setCurrentView("home");
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
  /*
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
    */

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} onToggle={toggleSidebar} isOpen={isSidebarOpen} user={user} onNavigateToLogin={() => setCurrentView("login")} />
      
      <div className="flex-1">

        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-3 bg-[#003366] text-white rounded-lg shadow-lg hover:bg-[#004080] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}


        {currentView === "login" ? (
          <Login
            onLogin={handleLogin}
            onNavigateToSignUp={() => setCurrentView("signup")}
          />
        ) : currentView === "signup" ? (
          <SignUp
            onNavigateToLogin={() => setCurrentView("login")}
          />
        ) : currentView === "planner" && !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-slate-600 text-lg">You must be logged in to view your planner.</p>
            <button
              onClick={() => setCurrentView("login")}
              className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244]"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentView("search")}
              className="text-sm text-slate-500 underline"
            >
              Continue as Guest
            </button>
          </div>
        ) : currentView === "home" ? (
          <Home onGetStarted={() => setCurrentView("search")} />
        ) : currentView === "settings" ? (
          <Settings />
        ) : currentView === "programs" ? (
          <Programs role={role}/>
        ) : currentView === "planner" ? (
          <Planner onRemoveFromPlanner={handleRemoveFromPlanner} onSwapPrompt={() => {}}/>
        ) : currentView === "admin" ? (
          <AdminDashboard />
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
              searchQueryType={searchQueryType}
              setSearchQueryType={setSearchQueryType}
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
                  {!isAuthenticated && (
                    <p className="text-sm text-slate-500">
                      <button
                      onClick={() => setCurrentView("login")}
                      className="text-[#003366] underline hover:text-[#002244]"
                      >
                        Log in
                        </button>{" "}
                        to save sections to your planner
                        </p>
                      )}
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
                        capacity={section.enrollment_cap}
                        location={section.room || 'TBA'}
                        department={section.course_code.split(' ')[0]}//{section.department}
                        component={section.component}
                        section={section.section_num}
                        level={getCourseLevel(section.catalog_num)}
                        courseCareer={getCourseCareer(section.catalog_num)}
                        modeOfInstruction={formatInstructionMode(section.instruction_mode)}
                        role={role}
                        isInPlanner={plannedCourseIds.has(section.section_id.toString())}
                        onAddToPlanner={handleAddToPlanner}
                        showPlannerButton={isAuthenticated}       // hide for guests
                        onLoginPrompt={() => setCurrentView("login")}
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