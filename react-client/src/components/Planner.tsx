import { CourseCard } from "./CourseCard";
import { Calendar } from "lucide-react";

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

interface PlannerProps {
  plannedCourses: Course[];
  onRemoveFromPlanner: (courseId: string) => void;
}

export function Planner({ plannedCourses, onRemoveFromPlanner }: PlannerProps) {
  const totalCredits = plannedCourses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Page Title Section */}
      <div className="mb-8 lg:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-[#003366]" />
          <h1 className="text-[#003366]">Course Planner</h1>
        </div>
        <p className="text-slate-600">Plan your semester schedule</p>
      </div>

      {/* Summary Card */}
      {plannedCourses.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
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
          {plannedCourses.map((course) => (
            <div key={course.id} className="relative">
              <CourseCard
                id={course.id}
                code={course.code}
                title={course.title}
                instructor={course.instructor}
                schedule={course.schedule}
                credits={course.credits}
                enrolled={course.enrolled}
                capacity={course.capacity}
                location={course.location}
                department={course.department}
                level={course.level}
                courseCareer={course.courseCareer}
                modeOfInstruction={course.modeOfInstruction}
              />
              <button
                onClick={() => onRemoveFromPlanner(course.id)}
                className="absolute top-4 right-4 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Remove
              </button>
            </div>
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
    </div>
  );
}
