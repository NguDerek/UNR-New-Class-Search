import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Trash2, BookOpen, Calendar, Search, AlertTriangle } from "lucide-react";
import { TERM_OPTIONS } from "../../utils/adminHelper";

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
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  const [formData, setFormData] = useState({
    course_id: "",
    course_subject: "",
    course_catalog_num: "",
    selected_course_label: "",
    term_id: "",
  });

  const showSectionSelector = !!formData.course_id && !!formData.term_id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFindCourse = async () => {
    if (!formData.course_subject.trim() || !formData.course_catalog_num.trim()) {
      setErrorMessage("Enter both subject and catalog number.");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");
      setSections([]);
      setSelectedSectionId("");

      const subject = formData.course_subject.trim().toUpperCase();
      const catalog = formData.course_catalog_num.trim().toUpperCase();

      const res = await fetch(
        `/api/admin/courses/lookup?subject=${subject}&catalog_num=${catalog}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Course not found");
      }

      setFormData((prev) => ({
        ...prev,
        course_id: String(data.course.id),
        selected_course_label: `${data.course.subject} ${data.course.catalog_num} - ${data.course.title}`,
      }));
    } catch (err) {
      setFormData((prev) => ({
        ...prev,
        course_id: "",
        selected_course_label: "",
      }));

      setSections([]);
      setSelectedSectionId("");
      setErrorMessage(err instanceof Error ? err.message : "Course lookup failed.");
    }
  };

  useEffect(() => {
    const loadSections = async () => {
      if (!formData.course_id || !formData.term_id) {
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
          `/api/admin/courses/${formData.course_id}/sections?term_id=${formData.term_id}`,
          { credentials: "include" }
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
  }, [formData.course_id, formData.term_id]);

  const handleDeleteSection = async () => {
    if (!formData.course_id) {
      setErrorMessage("Find a course first.");
      setSuccessMessage("");
      return;
    }

    if (!formData.term_id) {
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
      `Are you sure you want to delete ${
        sectionToDelete ? `section ${sectionToDelete.section_num}` : "this section"
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
    setFormData({
      course_id: "",
      course_subject: "",
      course_catalog_num: "",
      selected_course_label: "",
      term_id: "",
    });
    setSelectedSectionId("");
    setSections([]);
    setSuccessMessage("");
    setErrorMessage("");
    setIsLoadingSections(false);
  };

  const formatSectionLabel = (section: SectionOption) => {
    return `Section ${section.section_num}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-[#003366] p-4 text-white">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          <h2 className="text-white">Remove Section</h2>
        </div>
        <p className="text-slate-200 text-sm mt-1">
          Find a course and term, then remove a single section
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-slate-700 flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#003366]" />
              Course
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="course_subject"
                value={formData.course_subject}
                onChange={handleChange}
                placeholder="e.g. CPE"
              />

              <Input
                id="course_catalog_num"
                value={formData.course_catalog_num}
                onChange={handleChange}
                placeholder="e.g. 201"
              />

              <Button
                type="button"
                onClick={handleFindCourse}
                className="bg-[#003366] text-white"
              >
                Find Course
              </Button>
            </div>
          </div>

          <div>
            <Label
              htmlFor="remove_section_term_id"
              className="text-slate-700 flex items-center gap-2 mb-2"
            >
              <Calendar className="w-4 h-4 text-[#003366]" />
              Term
            </Label>

            <Select
              value={formData.term_id}
              onValueChange={(value) => handleSelectChange("term_id", value)}
            >
              <SelectTrigger
                id="remove_section_term_id"
                className="border-slate-300"
              >
                <SelectValue placeholder="Select term" />
              </SelectTrigger>

              <SelectContent className="max-h-37 overflow-y-auto">
                {TERM_OPTIONS.map((term) => (
                  <SelectItem key={term.id} value={String(term.id)}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.selected_course_label && (
          <p className="text-sm text-green-700 font-medium">
            Selected: {formData.selected_course_label}
          </p>
        )}

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

              <SelectContent className="max-h-37 overflow-y-auto">
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