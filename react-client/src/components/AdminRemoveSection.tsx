import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Trash2, BookOpen, Calendar, Search, AlertTriangle } from "lucide-react";

type Course = {
  id: number;
  subject: string;
  catalog_num: string;
  title: string;
};

type Term = {
  id: number;
  session_code: string;
  year: number;
};

type SectionOption = {
  id: number;
  section_num: string;
  component: string | null;
  instruction_mode: string | null;
  days: string | null;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  status: string | null;
  capacity: number | null;
};

export function AdminRemoveSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [coursesRes, termsRes] = await Promise.all([
          fetch("/api/courses-test", {
            credentials: "include",
          }),
          fetch("/api/terms", {
            credentials: "include",
          }),
        ]);

        const coursesData = await coursesRes.json();
        const termsData = await termsRes.json();

        if (coursesRes.ok) {
          setCourses(coursesData.courses || []);
        } else {
          console.error("Failed to load courses:", coursesData.error);
        }

        if (termsRes.ok) {
          setTerms(termsData.terms || []);
        } else {
          console.error("Failed to load terms:", termsData.error);
        }
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    loadDropdownData();
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      if (!selectedCourseId || !selectedTermId) {
        setSections([]);
        setSelectedSectionId("");
        return;
      }

      try {
        setIsLoadingSections(true);
        setErrorMessage("");
        setSuccessMessage("");
        setSelectedSectionId("");

        const res = await fetch(
          `/api/admin/courses/${selectedCourseId}/sections?term_id=${selectedTermId}`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load sections");
        }

        setSections(data.sections || []);
      } catch (err) {
        setSections([]);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load sections"
        );
      } finally {
        setIsLoadingSections(false);
      }
    };

    loadSections();
  }, [selectedCourseId, selectedTermId]);

  const handleDeleteSection = async () => {
    if (!selectedCourseId) {
      setErrorMessage("Please select a course.");
      setSuccessMessage("");
      return;
    }

    if (!selectedTermId) {
      setErrorMessage("Please select a term.");
      setSuccessMessage("");
      return;
    }

    if (!selectedSectionId) {
      setErrorMessage("Please select a section to remove.");
      setSuccessMessage("");
      return;
    }

    const sectionToDelete = sections.find(
      (section) => section.id === Number(selectedSectionId)
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete section ${
        sectionToDelete?.section_num ?? selectedSectionId
      }?`
    );

    if (!confirmed) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const csrfRes = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();

      const res = await fetch(`/api/admin/sections/${selectedSectionId}`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": csrfData.csrf_token,
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete section");
      }

      setSuccessMessage("Section deleted successfully.");
      setErrorMessage("");

      setSections((prev) =>
        prev.filter((section) => section.id !== Number(selectedSectionId))
      );
      setSelectedSectionId("");
    } catch (err) {
      setSuccessMessage("");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      console.error("Delete error:", err);
    }
  };

  const resetForm = () => {
    setSelectedCourseId("");
    setSelectedTermId("");
    setSelectedSectionId("");
    setSections([]);
    setSuccessMessage("");
    setErrorMessage("");
    setIsLoadingSections(false);
  };

  const formatSectionLabel = (section: SectionOption) => {
    const timePart =
      section.start_time && section.end_time
        ? `${section.start_time}-${section.end_time}`
        : section.start_time || section.end_time || "Time TBA";

    const daysPart = section.days || "Days TBA";
    const roomPart = section.room || "Room TBA";
    const componentPart = section.component || "Component TBA";

    return `Section ${section.section_num} | ${componentPart} | ${daysPart} | ${timePart} | ${roomPart}`;
  };

  const showSectionSelector = !!selectedCourseId && !!selectedTermId;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-[#003366] p-4 text-white">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          <h2 className="text-white">Remove Section</h2>
        </div>
        <p className="text-slate-200 text-sm mt-1">
          Select a course and term, then remove a single section
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label
              htmlFor="remove_section_course_id"
              className="text-slate-700 flex items-center gap-2 mb-2"
            >
              <BookOpen className="w-4 h-4 text-[#003366]" />
              Course
            </Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger
                id="remove_section_course_id"
                className="border-slate-300"
              >
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.subject} {course.catalog_num} - {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="remove_section_term_id"
              className="text-slate-700 flex items-center gap-2 mb-2"
            >
              <Calendar className="w-4 h-4 text-[#003366]" />
              Term
            </Label>
            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
              <SelectTrigger
                id="remove_section_term_id"
                className="border-slate-300"
              >
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={String(term.id)}>
                    {term.session_code} {term.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showSectionSelector && (
          <div className="border-t border-slate-200 pt-6">
            <div className="mb-4">
              <h3 className="text-[#003366] mb-2">Section Selection</h3>
              <p className="text-slate-600 text-sm">
                Choose the exact section you want to remove
              </p>
            </div>

            <Label
              htmlFor="remove_section_id"
              className="text-slate-700 flex items-center gap-2 mb-2"
            >
              <Search className="w-4 h-4 text-[#003366]" />
              Section
            </Label>

            <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
              <SelectTrigger
                id="remove_section_id"
                className="border-slate-300"
              >
                <SelectValue
                  placeholder={
                    isLoadingSections
                      ? "Loading sections..."
                      : sections.length > 0
                      ? "Select section"
                      : "No sections found for this course and term"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {formatSectionLabel(section)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedSectionId && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Warning</p>
              <p className="text-sm">
                This will permanently delete the selected section.
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <p className="text-green-600 font-medium">{successMessage}</p>
        )}

        {errorMessage && (
          <p className="text-red-600 font-medium">{errorMessage}</p>
        )}

        {showSectionSelector && (
          <div className="border-t border-slate-200 pt-6 flex gap-3">
            <Button
              onClick={handleDeleteSection}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={!selectedSectionId}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Section
            </Button>

            <Button
              variant="outline"
              onClick={resetForm}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}