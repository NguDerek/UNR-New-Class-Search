import { useState, useMemo } from "react";
import { CourseCard } from "./components/CourseCard";
import { SearchFilters } from "./components/SearchFilters";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { Programs } from "./components/Programs";
import { Planner } from "./components/Planner";

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
    level: "100-Level",
    days: ["Mon", "Wed", "Fri"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "2",
    code: "CS 201",
    courseNumber: "201",
    title: "Data Structures and Algorithms",
    instructor: "Prof. Michael Chen",
    schedule: "TTh 1:00 PM - 2:30 PM",
    credits: 4,
    enrolled: 35,
    capacity: 35,
    location: "Engineering Hall 105",
    department: "Computer Science",
    level: "200-Level",
    days: ["Tue", "Thu"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "Hybrid",
  },
  {
    id: "3",
    code: "MATH 210",
    courseNumber: "210",
    title: "Calculus II",
    instructor: "Dr. Emily Rodriguez",
    schedule: "MWF 11:00 AM - 12:00 PM",
    credits: 4,
    enrolled: 22,
    capacity: 30,
    location: "Mathematics Building 301",
    department: "Mathematics",
    level: "200-Level",
    days: ["Mon", "Wed", "Fri"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "4",
    code: "PHYS 150",
    courseNumber: "150",
    title: "General Physics I",
    instructor: "Dr. James Wilson",
    schedule: "MWF 2:00 PM - 3:00 PM",
    credits: 3,
    enrolled: 18,
    capacity: 25,
    location: "Physics Lab 102",
    department: "Physics",
    level: "100-Level",
    days: ["Mon", "Wed", "Fri"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "5",
    code: "CS 305",
    courseNumber: "305",
    title: "Database Management Systems",
    instructor: "Prof. Rachel Kim",
    schedule: "TTh 10:00 AM - 11:30 AM",
    credits: 3,
    enrolled: 26,
    capacity: 28,
    location: "Computer Lab 220",
    department: "Computer Science",
    level: "300-Level",
    days: ["Tue", "Thu"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "Hybrid",
  },
  {
    id: "6",
    code: "CHEM 101",
    courseNumber: "101",
    title: "Introduction to Chemistry",
    instructor: "Dr. David Martinez",
    schedule: "MWF 8:00 AM - 9:00 AM",
    credits: 4,
    enrolled: 30,
    capacity: 32,
    location: "Chemistry Building 150",
    department: "Chemistry",
    level: "100-Level",
    days: ["Mon", "Wed", "Fri"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "7",
    code: "BIO 220",
    courseNumber: "220",
    title: "Cellular Biology",
    instructor: "Dr. Lisa Anderson",
    schedule: "TTh 2:00 PM - 3:30 PM",
    credits: 4,
    enrolled: 24,
    capacity: 30,
    location: "Biology Lab 215",
    department: "Biology",
    level: "200-Level",
    days: ["Tue", "Thu"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "8",
    code: "ENG 200",
    courseNumber: "200",
    title: "American Literature",
    instructor: "Prof. Robert Taylor",
    schedule: "MW 3:00 PM - 4:30 PM",
    credits: 3,
    enrolled: 20,
    capacity: 25,
    location: "Liberal Arts 310",
    department: "English",
    level: "200-Level",
    days: ["Mon", "Wed"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "9",
    code: "HIST 101",
    courseNumber: "101",
    title: "World History I",
    instructor: "Dr. Patricia Brown",
    schedule: "TTh 9:00 AM - 10:30 AM",
    credits: 3,
    enrolled: 27,
    capacity: 30,
    location: "Humanities Building 205",
    department: "History",
    level: "100-Level",
    days: ["Tue", "Thu"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "10",
    code: "PSY 101",
    courseNumber: "101",
    title: "Introduction to Psychology",
    instructor: "Dr. Jennifer Lee",
    schedule: "MWF 1:00 PM - 2:00 PM",
    credits: 3,
    enrolled: 32,
    capacity: 35,
    location: "Social Sciences 180",
    department: "Psychology",
    level: "100-Level",
    days: ["Mon", "Wed", "Fri"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "11",
    code: "CS 401",
    courseNumber: "401",
    title: "Machine Learning",
    instructor: "Prof. Alex Zhang",
    schedule: "MW 4:00 PM - 5:30 PM",
    credits: 3,
    enrolled: 19,
    capacity: 20,
    location: "AI Research Center 301",
    department: "Computer Science",
    level: "400-Level",
    days: ["Mon", "Wed"],
    courseCareer: "Graduate",
    modeOfInstruction: "Synchronous Online",
  },
  {
    id: "12",
    code: "MATH 310",
    courseNumber: "310",
    title: "Linear Algebra",
    instructor: "Dr. Kevin Park",
    schedule: "TTh 11:00 AM - 12:30 PM",
    credits: 3,
    enrolled: 15,
    capacity: 25,
    location: "Mathematics Building 205",
    department: "Mathematics",
    level: "300-Level",
    days: ["Tue", "Thu"],
    courseCareer: "Undergraduate",
    modeOfInstruction: "In Person",
  },
  {
    id: "13",
    code: "BIO 500",
    courseNumber: "500",
    title: "Advanced Molecular Biology",
    instructor: "Dr. Amanda Stevens",
    schedule: "Asynchronous",
    credits: 4,
    enrolled: 12,
    capacity: 20,
    location: "Online",
    department: "Biology",
    level: "400-Level",
    days: [],
    courseCareer: "Graduate",
    modeOfInstruction: "Asynchronous",
  },
  {
    id: "14",
    code: "MED 601",
    courseNumber: "601",
    title: "Human Anatomy",
    instructor: "Dr. Robert Chen",
    schedule: "MWF 8:00 AM - 11:00 AM",
    credits: 6,
    enrolled: 48,
    capacity: 50,
    location: "Medical School Building A",
    department: "Biology",
    level: "400-Level",
    days: ["Mon", "Wed", "Fri"],
    courseCareer: "Medical School",
    modeOfInstruction: "In Person",
  },
  {
    id: "15",
    code: "CS 502",
    courseNumber: "502",
    title: "Artificial Intelligence",
    instructor: "Dr. Linda Wu",
    schedule: "TTh 6:00 PM - 8:30 PM",
    credits: 3,
    enrolled: 18,
    capacity: 25,
    location: "Engineering Hall 302",
    department: "Computer Science",
    level: "400-Level",
    days: ["Tue", "Thu"],
    courseCareer: "Graduate",
    modeOfInstruction: "Hybrid",
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "search" | "planner" | "programs" | "settings">("home");
  const [term, setTerm] = useState("Spring 2025");
  const [searchQuery, setSearchQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [courseNumber, setCourseNumber] = useState("");
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
    subject: "all",
    courseNumber: "",
    courseCareer: "all",
    showOpenOnly: false,
    modeOfInstruction: "all",
    level: "all",
    credits: "all",
    selectedDays: [] as string[],
  });

  // Planner state
  const [plannedCourseIds, setPlannedCourseIds] = useState<Set<string>>(new Set());

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

  const handleReset = () => {
    setTerm("Spring 2025");
    setSearchQuery("");
    setSubject("all");
    setCourseNumber("");
    setCourseCareer("all");
    setShowOpenOnly(false);
    setModeOfInstruction("all");
    setLevel("all");
    setCredits("all");
    setSelectedDays([]);
    setHasSearched(false);
    setAppliedFilters({
      term: "Spring 2025",
      searchQuery: "",
      subject: "all",
      courseNumber: "",
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <div className="flex-1">
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
              subject={subject}
              setSubject={setSubject}
              courseNumber={courseNumber}
              setCourseNumber={setCourseNumber}
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
                    <span className="text-[#003366]">{filteredCourses.length}</span> of {MOCK_COURSES.length} courses
                  </p>
                </div>

                {filteredCourses.length > 0 ? (
                  <div className="grid gap-5">
                    {filteredCourses.map((course) => (
                      <CourseCard 
                        key={course.id} 
                        {...course}
                        isInPlanner={plannedCourseIds.has(course.id)}
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
