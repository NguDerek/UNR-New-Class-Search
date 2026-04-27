import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import {Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,} from "./ui/Select";
import { Button } from "./ui/Button";
import { Switch } from "./ui/Switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/Tooltip";
import { Search, Calendar, BookOpen, MapPin, GraduationCap, Monitor, Filter, RotateCcw, HelpCircle, ChevronDown, ChevronUp, ArrowUpNarrowWide, CalendarDays, Coins, SearchCheck } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { courseAPI } from "../services/api";
import type { Role } from "../lib/permissions";

interface SearchFiltersProps {
  term: string;
  setTerm: (term: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchQueryType: string;
  setSearchQueryType: (subject: string) => void;
  department: string;
  setDepartment: (subject: string) => void;
  roomSearch: string;
  setRoomSearch: (courseNumber: string) => void;
  courseCareer: string;
  setCourseCareer: (career: string) => void;
  showOpenOnly: boolean;
  setShowOpenOnly: (showOpen: boolean) => void;
  modeOfInstruction: string;
  setModeOfInstruction: (mode: string) => void;
  level: string;
  setLevel: (level: string) => void;
  credits: string;
  setCredits: (credits: string) => void;
  selectedDays: string[];
  setSelectedDays: (days: string[]) => void;
  role: Role;
  onSearch: () => void;
  onReset: () => void;
  onSearchRecommendations: () => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SearchFilters({
  term,
  setTerm,
  searchQuery,
  setSearchQuery,
  searchQueryType,
  setSearchQueryType,
  department,
  setDepartment,
  roomSearch,
  setRoomSearch,
  courseCareer,
  setCourseCareer,
  modeOfInstruction,
  setModeOfInstruction,
  level,
  setLevel,
  credits,
  setCredits,
  selectedDays,
  setSelectedDays,
  role,
  onSearch,
  onReset,
  onSearchRecommendations,
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [useRecommendations, setUseRecommendations] = useState(false);
  // Inside the component:
  const [departments, setDepartments] = useState<Array<{id: number, department_code: string, college: string}>>([]);

  const placeholders: Record<string, string> = {
    all: "Course code, subject, number, title, or instructor",
    course_code: "Example: MATH 126, CS 135",
    subject: "Example: MATH or CS",
    catalog_number: "Example: 101, 135",
    title: "Example: Calculus I, Computer Science I",
    instructor: "Example: Smith, John Smith",
  };

  useEffect(() => {
    // Fetch departments on mount
    courseAPI.getDepartments()
      .then(response => {
        if (response.status === 'success') {
          setDepartments(response.departments);
        }
      })
      .catch(error => console.error('Failed to load departments:', error));
  }, []);
  const toggleDay = (day: string) => {
    setSelectedDays(
      selectedDays.includes(day)
        ? selectedDays.filter((d) => d !== day)
        : [...selectedDays, day]
    );
  };

  return (
    <TooltipProvider>
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-6">
        <div className="bg-[#003366] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <h2 className="text-white">Search & Filter</h2>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-[#004080] rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="p-6 space-y-6">
            {/* Search Bar - Full Width */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="search" className="text-slate-700 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#003366]" />
                  Search Courses
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-slate-400 hover:text-[#003366] transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Search by course code (eg. MATH 126), subject (eg. MATH, CS), catalog number (eg. 101, 135), title (eg. Precalculus I), or instructor first and/or last name (eg. David, Smith)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-2">
                {/* Search Type Dropdown */}
                <Select
                  value={searchQueryType}
                  onValueChange={setSearchQueryType}
                  disabled={useRecommendations}
                >
                  <SelectTrigger
                    id="searchQueryType"
                    className="w-[180px] border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="course_code">Course Code</SelectItem>
                    <SelectItem value="subject">Subject</SelectItem>
                    <SelectItem value="catalog_number">Catalog Number</SelectItem>
                    <SelectItem value="title">Course Title</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder={
                      useRecommendations
                        ? "Recommendations mode enabled"
                        : placeholders[searchQueryType]
                    }
                    value={useRecommendations ? "" : searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={useRecommendations}
                    className="pl-10 border-slate-300 focus:border-[#003366] focus:ring-[#003366] disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Core Filters - Horizontal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Term */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="term" className="text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#003366]" />
                    Term
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-[#003366] transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select the academic term for which you want to search courses</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger id="term" className="border-slate-300">
                    <SelectValue placeholder="All Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                    <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                    <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                    <SelectItem value="Winter 2026">Winter 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="department" className="text-slate-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#003366]" />
                    Department
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-[#003366] transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Filter courses by academic department/specific college</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department" className="border-slate-300">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.college}>
                        {dept.college}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="level" className="text-slate-700 flex items-center gap-2">
                    <ArrowUpNarrowWide className="w-4 h-4 text-[#003366]" />
                    Level
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-[#003366] transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Filter courses by academic level (ie. 100 level, 200 level, etc.)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="level" className="border-slate-300">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="100">100-level</SelectItem>
                    <SelectItem value="200">200-level</SelectItem>
                    <SelectItem value="300">300-level</SelectItem>
                    <SelectItem value="400">400-level</SelectItem>
                    <SelectItem value="600+">600+ level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credits */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="credits" className="text-slate-700 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#003366]" />
                    Credits
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-[#003366] transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Filter courses by credit count (labs are often 1 to 2 credits, while lectures are 3 to 4)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={credits} onValueChange={setCredits}>
                  <SelectTrigger id="credits" className="border-slate-300">
                    <SelectValue placeholder="Any Credits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Credits</SelectItem>
                    <SelectItem value="1">1 Credit</SelectItem>
                    <SelectItem value="2">2 Credits</SelectItem>
                    <SelectItem value="3">3 Credits</SelectItem>
                    <SelectItem value="4">4 Credits</SelectItem>
                    <SelectItem value="5+">5+ Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                
              {/* Course Career */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="courseCareer" className="text-slate-700 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#003366]" />
                    Course Career
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-[#003366] transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Filter by academic level: undergraduate, graduate, or medical school courses</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={courseCareer} onValueChange={setCourseCareer}>
                  <SelectTrigger id="courseCareer" className="border-slate-300">
                    <SelectValue placeholder="All Careers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Careers</SelectItem>
                    <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                    <SelectItem value="Medical School">Medical School</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mode of Instruction */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="modeOfInstruction" className="text-slate-700 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-[#003366]" />
                    Mode of Instruction
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-[#003366] transition-colors">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Filter by how the course is taught: in person, online, or hybrid</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={modeOfInstruction} onValueChange={setModeOfInstruction}>
                  <SelectTrigger id="modeOfInstruction" className="border-slate-300">
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="In Person">In Person</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Asynchronous Online">Asynchronous Online</SelectItem>
                    <SelectItem value="Synchronous Online">Synchronous Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="border-t border-slate-200 pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-slate-700 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#003366]" />
                  Advanced Filters
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {/* Room/Building */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="roomSearch" className="text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#003366]" />
                      Room/Building
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-slate-400 hover:text-[#003366] transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Search by building code (e.g., AB) or room number (e.g., AB 135)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="roomSearch"
                    placeholder="e.g., AB, AB 135, SEM 234..."
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                {/* Days of Week */}
                <div className="md:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="days" className="text-slate-700 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#003366]" />
                      Days
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-slate-400 hover:text-[#003366] transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Filter courses by a day they occur on (Mon and Tue will return all courses that occur on at least Monday OR Tuesday)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-md border transition-all text-sm ${selectedDays.includes(day)
                            ? "bg-[#003366] text-white border-[#003366]"
                            : "bg-white text-slate-700 border-slate-300 hover:border-[#003366]"
                          }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Button for generating Course Recommendations */}
                {role === 'Student' && (
                  <div className="md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-slate-700 flex items-center gap-2">
                        <SearchCheck className="w-4 h-4 text-[#003366]" />
                        Recommendations
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-slate-400 hover:text-[#003366] transition-colors">
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Generate recommended courses based on your selected major and courses already in your planner
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center justify-between border border-slate-300 rounded-lg p-3 bg-slate-50">
                      <span className="text-sm text-slate-700">
                        Use Recommendations
                      </span>

                      <Switch
                        checked={useRecommendations}
                        onCheckedChange={setUseRecommendations}
                        className="data-[state=checked]:bg-[#003366] data-[state=unchecked]:bg-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-slate-200 pt-6 flex gap-3">
              <Button
                onClick={() => {
                  if (useRecommendations) {
                    onSearchRecommendations();
                  } else {
                    onSearch();
                  }
                }}
                className="flex-1 bg-[#003366] hover:bg-[#002244] text-white h-12"
              >
                {useRecommendations ? (
                  <>
                    <SearchCheck className="w-4 h-4 mr-2" />
                    Get Recommendations
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Courses
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onReset}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 h-12 px-6"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}