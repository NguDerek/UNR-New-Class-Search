import { useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { Button } from "./ui/Button";
import { SearchFilters } from "./SearchFilters";
import { CourseCard } from "./CourseCard";
import { executeCourseSearch } from "@/utils/searchUtils";
import { formatTime, getCourseLevel, getCourseCareer, formatInstructionMode } from "@/utils/courseHelpers";

interface Course {
  section_id: number;
  course_id: number;
  term_id: number;
  section_num: number;
  component: string;
  instruction_mode: string;
  days: string | null;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  capacity: number;
  status: string;
  combined: boolean;
  instructors: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  }[];
  course: {
    subject: string;
    catalog_num: number;
    title: string;
    units: number;
  };
}

interface SwapModalProps{
    courseToSwap: Course;
    plannedCourseIds: string[];
    onSwap: (newCourse: Course) => void;
    onClose: () => void;
}

export function SwapModal({courseToSwap, plannedCourseIds, onSwap, onClose}: SwapModalProps){
    //Same search functionality as in the search tab
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
    
    // Applied filters - only updated when user clicks "Search Courses"
    const [results, setResults] = useState<any[]>([]); 
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);

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

    const handleSearch = async () =>{
        setIsSearching(true);
        setHasSearched(true);

        try {
            const response = await executeCourseSearch({
                searchQuery, searchQueryType, department, roomSearch, selectedDays,
                term, courseCareer, credits, modeOfInstruction,
                level, showOpenOnly,
            });

            // ← response is used inside try, not outside it
            if (response.status === "success") {
            setResults(response.sections);
            } 
            else {
            setResults([]);
            }
        } catch (error) {
            console.error("Swap search error:", error);
            setResults([]);
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
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4">

            {/* Header */}
            <div className="bg-[#003366] text-white p-4 rounded-t-xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                <span className="font-semibold">Swap Course</span>
            </div>
            <button onClick={onClose} className="hover:bg-[#004080] p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
            </button>
            </div>

            {/* Sticky "swapping out" banner */}
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2 shrink-0">
            <span className="text-amber-800 text-sm">
                Swapping out: <strong>{courseToSwap.course.subject} {courseToSwap.course.catalog_num} — {courseToSwap.course.title}</strong>
            </span>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
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
                <div className="mb-4 flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-700">
                    <span className="text-[#003366]">{results.length}</span> sections found
                    </p>
                </div>

                {isSearching ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600">Searching...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid gap-5">
                    {results.map((section) => {
                        const isAlreadyPlanned = plannedCourseIds.includes(section.section_id.toString());
                        const isCurrentCourse = section.section_id.toString() === courseToSwap.course_id;

                        return (
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
                            department={section.course_code.split(' ')[0]}
                            component={section.component}
                            section={section.section_num}
                            level={getCourseLevel(section.catalog_num)}
                            courseCareer={getCourseCareer(section.catalog_num)}
                            modeOfInstruction={formatInstructionMode(section.instruction_mode)}
                            isInPlanner={isAlreadyPlanned || isCurrentCourse}
                            onSwapWithCourse={() => onSwap(section)}
                            showSearchSwapButton={true}
                            showRemoveButton={false}
                            showSwapButton={false}
                        />
                        );
                    })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-300 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-slate-600 mb-2">No courses found</p>
                    <p className="text-sm text-slate-400">Try adjusting your filters or search query</p>
                    </div>
                )}
                </>
            )}
            </div>
        </div>
        </div>
    );
}