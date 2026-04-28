import { useState } from "react";
import { X, CalendarPlus, Check, Download, AlertCircle } from "lucide-react";
import { formatTime } from "../utils/courseHelpers.ts"
import { createEvents, type EventAttributes } from "ics";


interface Instructor {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

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
  instructors: Instructor[];
  course: {
    subject: string;
    catalog_num: number;
    title: string;
    units: number;
  };
  start_date: string;
  end_date: string;
}

interface CalendarModalProps {
  plannedCourses: Course[];
  conflictIds: Set<number>;
  onClose: () => void;
}


// FullCalendar day number (0=Sun) → iCal BYDAY code
const FC_DAY_TO_ICAL: Record<number, string> = {
  0: "SU",
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
};

const parseMeetingDays = (days: string | null): number[] => {
  if (!days) return [];
  const dayMap: Record<string, number> = {
    U: 0, M: 1, T: 2, W: 3, R: 4, F: 5, S: 6,
  };
  return days.split("").map((d) => dayMap[d]).filter((d) => d !== undefined);
};

const parseTimeToHourMinute = (time: string | null): [number, number] => {
  if (!time) return [0, 0];
  // Handles "HH:MM:SS" or "HH:MM"
  const [h, m] = time.split(":").map(Number);
  return [h, m];
};

/**
 * Given a semester start date string and a list of FullCalendar day numbers,
 * returns the first calendar date (as a Date) on which the class actually meets.
 */
const parseLocalDate = (dateStr: string): Date => {
  // Handles both "Mon, 25 Aug 2025 00:00:00 GMT" and "YYYY-MM-DD"
  const d = new Date(dateStr);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

const getFirstOccurrence = (startDateStr: string, daysOfWeek: number[]): Date => {
  const start = parseLocalDate(startDateStr);
  const sorted = [...daysOfWeek].sort((a, b) => a - b);

  for (let i = 0; i < 7; i++) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    if (sorted.includes(candidate.getDay())) return candidate;
  }
  return start;
};

/**
 * Format a Date as iCal UNTIL string: YYYYMMDDTHHmmssZ (end of that day in UTC)
 */
const toUntilString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}T235959Z`;
};

const courseToIcsEvent = (section: Course): EventAttributes | null => {
  if (!section.days || !section.start_time || !section.end_time) return null;

  const daysOfWeek = parseMeetingDays(section.days);
  if (daysOfWeek.length === 0) return null;

  const firstOccurrence = getFirstOccurrence(section.start_date, daysOfWeek);
  const endDate = parseLocalDate(section.end_date);
  const [startHour, startMin] = parseTimeToHourMinute(section.start_time);
  const [endHour, endMin] = parseTimeToHourMinute(section.end_time);

  const byDay = daysOfWeek.map((d) => FC_DAY_TO_ICAL[d]).join(",");
  const until = toUntilString(endDate);

  const instructorNames =
    section.instructors.length > 0
      ? section.instructors.map((i) => i.full_name).join(", ")
      : "TBA";

  return {
    title: `${section.course.subject}-${section.course.catalog_num}: ${section.course.title}`,
    start: [
      firstOccurrence.getFullYear(),
      firstOccurrence.getMonth() + 1, // ics months are 1-indexed
      firstOccurrence.getDate(),
      startHour,
      startMin,
    ],
    end: [
      firstOccurrence.getFullYear(),
      firstOccurrence.getMonth() + 1,
      firstOccurrence.getDate(),
      endHour,
      endMin,
    ],
    recurrenceRule: `FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`,
    location: section.room || "TBA",
    description: `Instructor: ${instructorNames}\nSection: ${section.section_num}\nComponent: ${section.component}`,
  };
};

export function CalendarModal({ plannedCourses, conflictIds, onClose}: CalendarModalProps) {
    const isConflict = conflictIds.size > 0;
    const exportableCourses = plannedCourses.filter(
        (s) => s.days && s.start_time && s.end_time
    );

    const [selected, setSelected] = useState<Set<number>>(
        new Set(
            exportableCourses
            .filter((s) => !conflictIds.has(s.section_id))  //pre-deselect conflicts
            .map((s) => s.section_id)
        )
    );
  const [exportError, setExportError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  const toggleCourse = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === exportableCourses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(exportableCourses.map((s) => s.section_id)));
    }
  };

  const handleExport = () => {
    setExportError(null);
    const toExport = exportableCourses.filter((s) => selected.has(s.section_id));

    if (toExport.length === 0) {
      setExportError("Please select at least one course to export.");
      return;
    }

    const events = toExport
      .map(courseToIcsEvent)
      .filter((e): e is EventAttributes => e !== null);

    const { error, value } = createEvents(events);

    if (error || !value) {
    console.error("ICS error object:", error);
    console.error("ICS value:", value);
    console.error("Events passed to createEvents:", JSON.stringify(events, null, 2));
    setExportError("Failed to generate calendar file. Please try again.");
    return;
    }

    // Trigger browser download
    const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "class-schedule.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const allSelected = selected.size === exportableCourses.length;
  const noneExportable = exportableCourses.length === 0;

  {/* Color themeing for when classes conflict */}
  const theme = isConflict
  ? {
      line: "border-red-600 bg-red-50",
      title: "border-red-300",
      courseCareer: "bg-red-100 text-red-700 border-red-200",
      component: "border-red-300",
      credits: "text-red-700 bg-red-100",
      section: "border-red-300",
      schedule: "text-red-500",
      location: "text-red-500",
      modeOfInstruction: "text-red-500",
      dates: "text-red-500",
      removeBtn: "bg-red-200 hover:bg-red-300"
    }
  : {
      card: "border-slate-200 bg-white",
      code: "from-indigo-600 to-blue-600",
      department: "border-slate-300",
      courseCareer: "bg-indigo-100 text-indigo-700 border-indigo-200",
      component: "border-slate-300",
      credits: "text-slate-500 bg-slate-100",
      section: "border-slate-300",
      schedule: "text-indigo-500",
      location: "text-indigo-500",
      modeOfInstruction: "text-indigo-500",
      dates: "text-indigo-500",
      removeBtn: "bg-red-100 hover:bg-red-200"
    }
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#003366] rounded-t-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <CalendarPlus className="w-5 h-5" />
            <h2 className="text-white text-base font-semibold">Export to Calendar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Select the courses you'd like to export. A <strong>.ics</strong> file will be
            downloaded and can be imported into Google Calendar, Apple Calendar, Outlook, and more.
          </p>

          {noneExportable ? (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No courses with scheduled meeting times found in your planner.</span>
            </div>
          ) : (
            <>
              {/* Select All */}
              <button
                onClick={toggleAll}
                className="text-sm text-[#003366] font-medium hover:underline text-left"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>

              {/* Course list */}
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {exportableCourses.map((section) => {
                  const isChecked = selected.has(section.section_id);
                  const courseCode = `${section.course.subject} ${section.course.catalog_num}`;
                  const instructor =
                    section.instructors.length > 0
                      ? section.instructors.map((i) => i.full_name).join(", ")
                      : "TBA";

                  return (
                    <li key={section.section_id}>
                      <button
                        onClick={() => toggleCourse(section.section_id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-200 transition-colors text-left"
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                            isChecked
                              ? "bg-[#003366] border-[#003366]"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>

                        {/* Course info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {courseCode}
                            <span className="font-normal text-slate-600 ml-1">
                              — {section.course.title}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {section.days} · {`${formatTime(section.start_time)} – ${formatTime(section.end_time)}`} · {instructor}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Courses without schedule */}
              {plannedCourses.length > exportableCourses.length && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {plannedCourses.length - exportableCourses.length} course(s) without scheduled
                  times are not available for export.
                </p>
              )}
            </>
          )}

          {/* Error message */}
          {exportError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-400 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={noneExportable || selected.size === 0}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              exported
                ? "bg-green-600 text-white"
                : noneExportable || selected.size === 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[#003366] text-white hover:bg-[#004080]"
            }`}
          >
            {exported ? (
              <>
                <Check className="w-4 h-4" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download .ics
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}