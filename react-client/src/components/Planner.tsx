import { useState, useEffect, useMemo } from "react";
import { CourseCard } from "./CourseCard";
import { Calendar, Info } from "lucide-react";
import { formatTime, getCourseLevel, getCourseCareer, formatInstructionMode } from "../utils/courseHelpers.ts"
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { EventContentArg } from "@fullcalendar/core";

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
    fetch('/api/planner', {
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

  const parseMeetingDays = (days: string | null): number[] => {
    if (!days) return [];

    const dayMap: Record<string, number> = {
      U: 0,
      M: 1,
      T: 2,
      W: 3,
      R: 4,
      F: 5,
      S: 6,
    };

    return days
      .split("")
      .map((dayLetter) => dayMap[dayLetter])
      .filter((day) => day !== undefined)
  };

  // randomize each course in schedule like mynevadas schedule planner
  const getCourseColors = (courseCode: string) => {
    // add more if repeats keep happening (sometimes does)
    const colors = [
      {
        background: "#DBEAFE",
        border: "#60A5FA",
        text: "#1E3A8A",
      },
      {
        background: "#DCFCE7",
        border: "#4ADE80",
        text: "#166534",
      },
      //{
        //background: "#FEE2E2",
        //border: "#F87171",
        //text: "#991B1B",
      //},
      {
        background: "#FEF3C7",
        border: "#FBBF24",
        text: "#92400E",
      },
      {
        background: "#EDE9FE",
        border: "#A78BFA",
        text: "#5B21B6",
      },
      {
        background: "#CFFAFE",
        border: "#22D3EE",
        text: "#155E75",
      },
    ];

    let hash = 0;
    for(let i = 0; i < courseCode.length; i++){
      // generic online hash pattern: hash = charCode + hash * 31
      hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }

    // use hash to consistently assign a color based on course code
    return colors[Math.abs(hash) % colors.length];
  }

  const conflicts = useMemo(() => {
    const results: { a: Course; b: Course }[] = [];

    const timesOverlap = (
      startA: string,
      endA: string,
      startB: string,
      endB: string
    ) => startA < endB && startB < endA;

    for (let i = 0; i < plannedCourses.length; i++) {
      const a = plannedCourses[i];
      if (!a.days || !a.start_time || !a.end_time) continue;

      const daysA = parseMeetingDays(a.days);

      for (let j = i + 1; j < plannedCourses.length; j++) {
        const b = plannedCourses[j];
        if (!b.days || !b.start_time || !b.end_time) continue;

        const daysB = parseMeetingDays(b.days);
        const shareDay = daysA.some(d => daysB.includes(d));

        if (
          shareDay &&
          timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)
        ) {
          results.push({ a, b });
        }
      }
    }

    return results;
  }, [plannedCourses]);

  const conflictIds = useMemo(() => {
    const ids = new Set<number>();

    conflicts.forEach(c => {
      ids.add(c.a.section_id);
      ids.add(c.b.section_id);
    });

    return ids;
  }, [conflicts]);

  const calendarEvents = useMemo(() => {
    return plannedCourses
      .filter((section) => section.days && section.start_time && section.end_time)
      .map((section) => {
        const courseCode = `${section.course.subject}-${section.course.catalog_num}`;
        const colors = getCourseColors(courseCode);
        const isConflict = conflictIds.has(section.section_id);

        return {
          id: section.section_id.toString(),
          title: courseCode,
          daysOfWeek: parseMeetingDays(section.days),
          startTime: section.start_time,
          endTime: section.end_time,
          backgroundColor: isConflict ? "#FEE2E2" : colors.background,
          borderColor: isConflict ? "#DC2626" : colors.border,
          textColor: colors.text,
          extendedProps: {
            courseCode,
            instructor:
              section.instructors.length > 0
                ? section.instructors.map(i => i.full_name).join(", ")
                : "TBA",
            room: section.room || "TBA",
            borderColor: colors.border,
            textColor: colors.text,
            isConflict
          },
        };
      });
  }, [plannedCourses, conflictIds]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps;

    return (
      <div
        className={`h-full w-full rounded-md px-2 py-1 text-[11px] leading-tight overflow-hidden ${
          props.isConflict ? "border-l-4 border-red-600 bg-red-100" : ""
      }`}
        style={{
          borderLeftColor: props.isConflict ? "#DC2626" : props.borderColor,
          color: props.textColor,
        }}
      >
        <div className="font-semibold truncate">{props.courseCode}</div>
        <div className="truncate">{props.instructor}</div>
        <div className="truncate">{props.room}</div>
      </div>
    );
  }; 

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
          {/* Conflict Message */}
          {conflicts.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-900 text-sm font-medium mb-1">
                  Scheduling Conflicts Detected
                </p>

                <ul className="text-red-800 text-sm list-disc ml-5">
                  {conflicts.map((c, i) => (
                    <li key={i}>
                      {c.a.course.subject} {c.a.course.catalog_num} conflicts with{" "}
                      {c.b.course.subject} {c.b.course.catalog_num}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

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
            <div className="space-y-8">
              {/* Planner Cards */}
              <div className="grid gap-5">
                {plannedCourses.map((section) => (
                  <CourseCard
                    key={section.section_id}
                    id={section.section_id.toString()}
                    code={`${section.course.subject} ${section.course.catalog_num}`}
                    title={section.course.title}
                    instructor={
                      section.instructors.length > 0
                        ? section.instructors.map(i => i.full_name).join(", ")
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
                    isConflict={conflictIds.has(section.section_id)}
                  />
                ))}
              </div>

              {/* Weekly schedule view */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#003366] px-4 py-3">
                  <h2 className="text-white">Weekly Schedule</h2>
                </div>

                <div className="p-4">
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <FullCalendar
                      plugins={[timeGridPlugin]}
                      initialView="timeGridWeek"
                      headerToolbar={false}
                      weekends={false}
                      allDaySlot={false}
                      slotMinTime="08:00:00"
                      slotMaxTime="20:00:00"
                      dayHeaderFormat={{ weekday: "long" }}
                      slotDuration="00:15:00"
                      slotLabelInterval="00:15:00"
                      expandRows={true}
                      height="auto"
                      events={calendarEvents}
                      eventContent={renderEventContent}
                    />
                  </div>
                </div>
              </div>
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