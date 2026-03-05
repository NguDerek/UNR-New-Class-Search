import { useState, useEffect } from "react";
import { CourseCard } from "./CourseCard";
import { Calendar, Info } from "lucide-react";
import { formatTime, getCourseLevel, getCourseCareer, formatInstructionMode } from "../utils/courseHelpers.ts"

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


interface PlannerProps {
  onRemoveFromPlanner: (courseId: string) => void;
}

export function Planner({ onRemoveFromPlanner }: PlannerProps) {
  const [plannedCourses, setPlannedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/planner', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setPlannedCourses(data.sections);
        } else {
          setError('Failed to load planner');
        }
      })
      .catch(err => {
        console.error('Error loading planner:', err);
        setError('Failed to load planner');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleRemove = (courseId: string) => {
    setPlannedCourses(prev => prev.filter(s => s.section_id.toString() !== courseId));
    onRemoveFromPlanner(courseId);
  };

  const totalCredits = plannedCourses.reduce((sum, s) => sum + s.course.units, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">

      {/* Disclaimer */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 text-sm">
            <span className="font-medium">Note:</span> Your planner is saved to your account and persists across sessions.
          </p>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-8 lg:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-[#003366]" />
          <h1 className="text-[#003366]">Course Planner</h1>
        </div>
        <p className="text-slate-600">Plan your semester schedule</p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-600">Loading your planner...</p>
        </div>

      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-red-200 bg-red-50 shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>

      ) : (
        <>
          {/* Summary Card */}
          {plannedCourses.length > 0 && (
            <div className="mb-8 bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Total Courses</p>
                  <p className="text-[#003366]">{plannedCourses.length}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm mb-1">Total Credits</p>
                  <p className="text-[#003366]">{totalCredits}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm mb-1">Status</p>
                  <p className="text-[#003366]">
                    {totalCredits >= 12 ? "Full-time" : totalCredits >= 6 ? "Part-time" : "Below Part-time"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Planned Courses */}
          {plannedCourses.length > 0 ? (
            <div className="grid gap-5">
              {plannedCourses.map((section) => (
                <CourseCard
                  key={section.section_id}
                  id={section.section_id.toString()}
                  code={`${section.course.subject} ${section.course.catalog_num}`}
                  title={section.course.title}
                  instructor={
                    section.instructors.length > 0
                      ? section.instructors[0].full_name
                      : "TBA"
                  }
                  schedule={`${section.days || 'TBA'} ${formatTime(section.start_time)} - ${formatTime(section.end_time)}`}
                  credits={section.course.units}
                  enrolled={0}
                  capacity={section.capacity}
                  location={section.room || 'TBA'}
                  department={section.course.subject}
                  component={section.component}
                  section={section.section_num}
                  level={getCourseLevel(section.course.catalog_num)}
                  courseCareer={getCourseCareer(section.course.catalog_num)}
                  modeOfInstruction={formatInstructionMode(section.instruction_mode)}
                  showRemoveButton={true}
                  onRemoveFromPlanner={handleRemove}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-300 mb-4">
                <Calendar className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-slate-600 mb-2">No courses in your planner</p>
              <p className="text-sm text-slate-400">
                Go to the Search page and add courses to start planning your schedule
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
