import { useState } from "react";
// import { X, ArrowRightLeft } from "lucide-react";
import { Button } from "./ui/Button";
import { SearchFilters } from "./SearchFilters";
import { CourseCard } from "./CourseCard";
import { courseAPI } from "../services/api";

interface Course {
  id: string;
  code: string;
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
  courseCareer: string;
  modeOfInstruction: string;
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

    
}


