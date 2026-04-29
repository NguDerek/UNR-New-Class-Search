import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Pencil, BookOpen, Building2, GraduationCap } from "lucide-react";

type DepartmentOption = {
  id: number;
  college: string;
  department_code: string;
  label: string;
};

const isValidSubject = (value: string) =>
  /^[A-Z]{2,6}$/.test(value.trim().toUpperCase());

const isValidCatalogNum = (value: string) =>
  /^[0-9]{3,4}[A-Z]?$/.test(value.trim().toUpperCase());

const isValidTitle = (value: string) =>
  value.trim().length >= 3 && value.trim().length <= 120;

export function AdminModifyCourse() {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [courseFound, setCourseFound] = useState(false);

  const [formData, setFormData] = useState({
    course_id: "",
    lookup_subject: "",
    lookup_catalog_num: "",
    department_id: "",
    subject: "",
    catalog_num: "",
    title: "",
    units: "",
    selected_course_label: "",
  });

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

  const loadDepartments = async () => {
    try {
      const res = await fetch("/api/admin/departments", {
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setDepartments(data.departments || []);
      }
    } catch {
      setErrorMessage("Failed to load departments.");
    }
  };

  const handleFindCourse = async () => {
    if (!formData.lookup_subject.trim() || !formData.lookup_catalog_num.trim()) {
      setErrorMessage("Enter both subject and catalog number.");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const subject = formData.lookup_subject.trim().toUpperCase();
      const catalog = formData.lookup_catalog_num.trim().toUpperCase();

      const res = await fetch(
        `/api/admin/courses/lookup?subject=${subject}&catalog_num=${catalog}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Course not found");
      }

      await loadDepartments();

      setCourseFound(true);

      setFormData((prev) => ({
        ...prev,
        course_id: String(data.course.id),
        department_id: String(data.course.department_id ?? ""),
        subject: data.course.subject,
        catalog_num: data.course.catalog_num,
        title: data.course.title,
        units: String(data.course.units),
        selected_course_label: `${data.course.subject} ${data.course.catalog_num} - ${data.course.title}`,
      }));
    } catch (err) {
      setCourseFound(false);
      setFormData((prev) => ({
        ...prev,
        course_id: "",
        department_id: "",
        subject: "",
        catalog_num: "",
        title: "",
        units: "",
        selected_course_label: "",
      }));

      setErrorMessage(err instanceof Error ? err.message : "Course lookup failed.");
    }
  };

  const handleSubmitUpdate = async () => {
    if (!formData.course_id) {
      setErrorMessage("Find a course first.");
      return;
    }

    if (
      !formData.department_id ||
      !formData.subject.trim() ||
      !formData.catalog_num.trim() ||
      !formData.title.trim() ||
      !formData.units
    ) {
      setErrorMessage("All fields are required.");
      setSuccessMessage("");
      return;
    }

    if (!isValidSubject(formData.subject)) {
      setErrorMessage("Subject must be 2–6 letters, like CPE, MATH, or ENG.");
      setSuccessMessage("");
      return;
    }

    if (!isValidCatalogNum(formData.catalog_num)) {
      setErrorMessage("Catalog number must look like 101, 301, 1001, or 301L.");
      setSuccessMessage("");
      return;
    }

    if (!isValidTitle(formData.title)) {
      setErrorMessage("Course title must be between 3 and 120 characters.");
      setSuccessMessage("");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const csrfRes = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();

      const payload = {
        department_id: Number(formData.department_id),
        subject: formData.subject.trim().toUpperCase(),
        catalog_num: formData.catalog_num.trim().toUpperCase(),
        title: formData.title.trim(),
        units: Number(formData.units),
      };

      const res = await fetch(`/api/admin/courses/${formData.course_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfData.csrf_token,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update course");
      }

      setSuccessMessage("Course updated successfully.");
      setErrorMessage("");
      setCourseFound(false);
      resetForm();
    } catch (err) {
      setSuccessMessage("");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      lookup_subject: "",
      lookup_catalog_num: "",
      department_id: "",
      subject: "",
      catalog_num: "",
      title: "",
      units: "",
      selected_course_label: "",
    });
    setCourseFound(false);
    setErrorMessage("");
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-[#003366] p-4 text-white">
        <div className="flex items-center gap-2">
          <Pencil className="w-5 h-5" />
          <h2 className="text-white">Modify Course Details</h2>
        </div>
        <p className="text-slate-200 text-sm mt-1">
          Find an existing course, then update its course-level details
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <Label className="text-slate-700 flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#003366]" />
            Find Course
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              id="lookup_subject"
              value={formData.lookup_subject}
              onChange={handleChange}
              placeholder="Subject, e.g. CPE"
            />

            <Input
              id="lookup_catalog_num"
              value={formData.lookup_catalog_num}
              onChange={handleChange}
              placeholder="Catalog, e.g. 201"
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

        {formData.selected_course_label && (
          <p className="text-sm text-green-700 font-medium">
            Selected: {formData.selected_course_label}
          </p>
        )}

        {courseFound && (
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="text-[#003366]">Editable Course Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="department_id"
                  className="text-slate-700 flex items-center gap-2 mb-2"
                >
                  <Building2 className="w-4 h-4 text-[#003366]" />
                  Department
                </Label>

                <Select
                  value={formData.department_id}
                  onValueChange={(value) =>
                    handleSelectChange("department_id", value)
                  }
                >
                  <SelectTrigger id="department_id" className="border-slate-300">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>

                  <SelectContent className="max-h-37 overflow-y-auto">
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="units" className="text-slate-700 flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-[#003366]" />
                  Units
                </Label>

                <Select
                  value={formData.units}
                  onValueChange={(value) => handleSelectChange("units", value)}
                >
                  <SelectTrigger id="units" className="border-slate-300">
                    <SelectValue placeholder="Select units" />
                  </SelectTrigger>

                  <SelectContent className="max-h-37 overflow-y-auto">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject" className="text-slate-700 mb-2 block">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. CPE"
                />
              </div>

              <div>
                <Label htmlFor="catalog_num" className="text-slate-700 mb-2 block">
                  Catalog Number
                </Label>
                <Input
                  id="catalog_num"
                  value={formData.catalog_num}
                  onChange={handleChange}
                  placeholder="e.g. 201"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="title" className="text-slate-700 mb-2 block">
                  Course Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Digital Design"
                />
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <p className="text-green-600 font-medium">{successMessage}</p>
        )}

        {errorMessage && (
          <p className="text-red-600 font-medium">{errorMessage}</p>
        )}

        {courseFound && (
          <div className="border-t border-slate-200 pt-6 flex gap-3">
            <Button
              onClick={handleSubmitUpdate}
              className="flex-1 bg-[#003366] hover:bg-[#002244] text-white h-12"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Save Changes
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setSuccessMessage("");
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 h-12 px-6"
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}