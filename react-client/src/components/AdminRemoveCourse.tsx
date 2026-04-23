import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Trash2, BookOpen, AlertTriangle } from "lucide-react";

type Course = {
  id: number;
  subject: string;
  catalog_num: string;
  title: string;
};

export function AdminRemoveCourse() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses-test", {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          setCourses(data.courses || []);
        } else {
          console.error("Failed to load courses:", data.error);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    };

    loadCourses();
  }, []);

  const handleDeleteCourse = async () => {
    if (!selectedCourseId) {
      setErrorMessage("Please select a course to remove.");
      setSuccessMessage("");
      return;
    }

    const selectedCourse = courses.find(
      (course) => course.id === Number(selectedCourseId)
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        selectedCourse
          ? `${selectedCourse.subject} ${selectedCourse.catalog_num} - ${selectedCourse.title}`
          : "this course"
      }?\n\nThis will also delete all sections tied to it.`
    );

    if (!confirmed) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const csrfRes = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();

      const res = await fetch(`/api/admin/courses/${selectedCourseId}`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": csrfData.csrf_token,
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete course");
      }

      setSuccessMessage("Course deleted successfully.");
      setErrorMessage("");

      setCourses((prev) =>
        prev.filter((course) => course.id !== Number(selectedCourseId))
      );
      setSelectedCourseId("");
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
    setSuccessMessage("");
    setErrorMessage("");
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-[#003366] p-4 text-white">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          <h2 className="text-white">Remove Course</h2>
        </div>
        <p className="text-slate-200 text-sm mt-1">
          Select a course to permanently remove it and all of its sections
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <Label
            htmlFor="remove_course_id"
            className="text-slate-700 flex items-center gap-2 mb-2"
          >
            <BookOpen className="w-4 h-4 text-[#003366]" />
            Course
          </Label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger
              id="remove_course_id"
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

        {selectedCourseId && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Warning</p>
              <p className="text-sm">
                This will permanently delete the selected course and all sections
                connected to it.
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

        <div className="border-t border-slate-200 pt-6 flex gap-3">
          <Button
            onClick={handleDeleteCourse}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={!selectedCourseId}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Course
          </Button>

          <Button
            variant="outline"
            onClick={resetForm}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}