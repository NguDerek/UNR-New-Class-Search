import { useState, useMemo, useEffect } from "react";
import { CourseCard } from "../components/CourseCard";
import type { Section as APISection, SearchParams } from '../services/api'
import type { Role } from "../lib/permissions";
import { SearchFilters } from "../components/SearchFilters";
import { formatTime, getCourseLevel, getCourseCareer, formatInstructionMode } from "../utils/courseHelpers.ts"
import { executeCourseSearch } from "../utils/searchUtils.ts";

interface SearchProps {
    isAuthenticated: boolean;
    role: Role;
    plannedCourseIds: Set<string>;
    handleAddToPlanner: (courseId: string) => void;
    onLoginPrompt: () => void;
}

export function Search({isAuthenticated, role, plannedCourseIds, handleAddToPlanner, onLoginPrompt}: SearchProps) {
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

    const [searchResults, setSearchResults] = useState<APISection[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

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


return (
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
                                    onClick={() => onLoginPrompt}
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
                                    start_date={section.start_date}
                                    end_date={section.end_date}
                                    role={role}
                                    isInPlanner={plannedCourseIds.has(section.section_id.toString())}
                                    onAddToPlanner={handleAddToPlanner}
                                    showPlannerButton={isAuthenticated}       // hide for guests
                                    onLoginPrompt={() => onLoginPrompt}
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
    );
}