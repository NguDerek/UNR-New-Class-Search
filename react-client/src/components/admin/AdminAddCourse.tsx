import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { PlusCircle, BookOpen, Building2, Hash, FileText } from "lucide-react";

const isValidSubject = (value: string) => /^[A-Z]{2,6}$/.test(value.trim().toUpperCase());

const isValidCatalogNum = (value: string) =>
  /^[0-9]{3,4}[A-Z]?$/.test(value.trim().toUpperCase());

const isValidTitle = (value: string) =>
  value.trim().length >= 3 && value.trim().length <= 120;

const UNIT_OPTIONS = ["1", "2", "3", "4"];

type Department = {
  id: number;
  college: string;
  department_code: string;
  label: string;
};

export function AdminAddCourse() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    department_id: "",
    subject: "",
    catalog_num: "",
    title: "",
    units: "",
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

  const resetCourseForm = () => {
    setFormData({
      department_id: "",
      subject: "",
      catalog_num: "",
      title: "",
      units: "",
    });
  };

  const handleSubmitCourse = async () => {
    const missingFields: string[] = [];

    if (!formData.department_id) missingFields.push("department_id");
    if (!formData.subject.trim()) missingFields.push("subject");
    if (!formData.catalog_num.trim()) missingFields.push("catalog_num");
    if (!formData.title.trim()) missingFields.push("title");
    if (!formData.units) missingFields.push("units");

    if (missingFields.length > 0) {
      setErrorMessage(`Missing: ${missingFields.join(", ")}`);
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
        ...formData,
        department_id: Number(formData.department_id),
        subject: formData.subject.trim().toUpperCase(),
        catalog_num: formData.catalog_num.trim().toUpperCase(),
        title: formData.title.trim(),
        units: Number(formData.units),
      };

      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfData.csrf_token,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create course");
      }

      setSuccessMessage("Course created successfully.");
      setErrorMessage("");
      resetCourseForm();
    } catch (err) {
      setSuccessMessage("");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await fetch("/api/admin/departments", {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) setDepartments(data.departments || []);
        else {
          console.error("Failed to load departments:", data.error);
        }
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
    };

    loadDepartments();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-[#003366] p-4 text-white">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          <h2 className="text-white">Add New Course</h2>
        </div>
        <p className="text-slate-200 text-sm mt-1">
          Create a course before adding sections
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-[#003366] mb-4">Course Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#003366]" />
                Department
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) =>
                  handleSelectChange("department_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-37 overflow-y-auto">
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept.id}
                      value={String(dept.id)}
                    >
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#003366]" />
                Subject
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g. CPE"
              />
            </div>

            {/* Catalog */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#003366]" />
                Catalog Number
              </Label>
              <Input
                id="catalog_num"
                value={formData.catalog_num}
                onChange={handleChange}
                placeholder="e.g. 201"
              />
            </div>

            {/* Units */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#003366]" />
                Units
              </Label>
              <Select
                value={formData.units}
                onValueChange={(value) =>
                  handleSelectChange("units", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select units" />
                </SelectTrigger>
                <SelectContent className="max-h-37 overflow-y-auto">
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <Label className="mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#003366]" />
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

        {successMessage && (
          <p className="text-green-600 font-medium">{successMessage}</p>
        )}

        {errorMessage && (
          <p className="text-red-600 font-medium">{errorMessage}</p>
        )}

        <div className="border-t pt-6 flex gap-3">
          <Button
            onClick={handleSubmitCourse}
            className="flex-1 bg-[#003366] text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Submit Course
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              resetCourseForm();
              setSuccessMessage("");
              setErrorMessage("");
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}