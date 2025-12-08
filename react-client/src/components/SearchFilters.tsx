import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/Select";
import { Button } from "./ui/Button";
// import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/Switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/Tooltip";
import { Search, Calendar, BookOpen, Hash, GraduationCap, Monitor, Filter, RotateCcw, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { courseAPI } from "../services/api";

interface SearchFiltersProps {
  term: string;
  setTerm: (term: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  subject: string;
  setSubject: (subject: string) => void;
  courseNumber: string;
  setCourseNumber: (courseNumber: string) => void;
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
  onSearch: () => void;
  onReset: () => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SearchFilters({
  term,
  setTerm,
  searchQuery,
  setSearchQuery,
  subject,
  setSubject,
  courseNumber,
  setCourseNumber,
  courseCareer,
  setCourseCareer,
  showOpenOnly,
  setShowOpenOnly,
  modeOfInstruction,
  setModeOfInstruction,
  level,
  setLevel,
  credits,
  setCredits,
  selectedDays,
  setSelectedDays,
  onSearch,
  onReset,
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Inside the component:
  const [departments, setDepartments] = useState<Array<{id: number, department_code: string, college: string}>>([]);

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
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h2 className="text-white">Search & Filter</h2>
          </div>
        </div>

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
                  <p>Search by course code, title, or instructor name</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Course code, title, or instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
              />
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
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                  <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                  <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                  <SelectItem value="Winter 2026">Winter 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="subject" className="text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#003366]" />
                  Subject
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-slate-400 hover:text-[#003366] transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Filter courses by academic department or subject area</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject" className="border-slate-300">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.department_code}>
                      {dept.college}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Number */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="courseNumber" className="text-slate-700 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[#003366]" />
                  Course Number
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-slate-400 hover:text-[#003366] transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Filter by specific course number (e.g., 101, 200, 305)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="courseNumber"
                placeholder="e.g., 101, 200..."
                value={courseNumber}
                onChange={(e) => setCourseNumber(e.target.value)}
                className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
              />
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
                  <SelectItem value="Asynchronous">Asynchronous</SelectItem>
                  <SelectItem value="Synchronous Online">Synchronous Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Open Only Toggle */}
            <div className="flex items-end">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="showOpenOnly" className="text-slate-700 cursor-pointer text-sm">Show Open Classes Only</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-slate-400 hover:text-[#003366] transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Only show courses that still have available seats for enrollment</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="showOpenOnly"
                    checked={showOpenOnly}
                    onCheckedChange={setShowOpenOnly}
                  />
                </div>
              </div>
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
              {/* Level */}
              <div>
                <Label htmlFor="level" className="text-slate-700 mb-2 block">Level</Label>
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
                    <SelectItem value="500+">500+ level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credits */}
              <div>
                <Label htmlFor="credits" className="text-slate-700 mb-2 block">Credits</Label>
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

              {/* Days of Week */}
              <div className="md:col-span-2 lg:col-span-1">
                <Label className="text-slate-700 mb-2 block">Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-md border transition-all text-sm ${
                        selectedDays.includes(day)
                          ? "bg-[#003366] text-white border-[#003366]"
                          : "bg-white text-slate-700 border-slate-300 hover:border-[#003366]"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-slate-200 pt-6 flex gap-3">
            <Button
              onClick={onSearch}
              className="flex-1 bg-[#003366] hover:bg-[#002244] text-white h-12"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Courses
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
      </div>
    </TooltipProvider>
  );
}

/*
<Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject" className="border-slate-300">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Psychology">Psychology</SelectItem>
                </SelectContent>
              </Select>
*/