import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { PlusCircle, Hash, Monitor, Calendar, Clock3, MapPin, 
         Users, CheckCircle2, Layers, User, BookOpen } from "lucide-react";

const SESSION_OPTIONS = [
  "14 week online only",
  "Dynamically Dated",
  "First 7 week online only",
  "First session",
  "Four week - fourth",
  "Full year",
  "Medical year 1",
  "Medical year 2",
  "Medical year 3",
  "Medical year 4",
  "Mini session",
  "Open entry/open exit",
  "Physician assistant year 1",
  "Physician assistant year 2",
  "Physician assistant year 3",
  "Regular academic session",
  "Second 7 week online only",
  "Second session",
  "Semester 1",
];

const COMPONENT_OPTIONS = [
  { value: "D2", label: "Discussion 2" },
  { value: "DIS", label: "Discussion/Recitation" },
  { value: "IND", label: "Independent Study" },
  { value: "INT", label: "Internship/Practicum" },
  { value: "LAB", label: "Lab/Studio" },
  { value: "LEC", label: "Lecture" },
  { value: "PEA", label: "Physical Exercise and Activity" },
];

const INSTRUCTION_MODE_OPTIONS = [
  { value: "FS", label: "Field Study" },
  { value: "HY", label: "Hybrid" },
  { value: "P", label: "In Person" },
  { value: "IS", label: "Independent Study" },
  { value: "IWP", label: "Independent Study w/Web Partic" },
  { value: "WA", label: "Web Based (Asynchronous)" },
  { value: "WL", label: "Web Live (Synchronous)" },
];

const STATUS_OPTIONS = [
  { value: "A", label: "Active / Open" },
  { value: "C", label: "Closed" },
];

export function AdminAddSection() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [instructors, setInstructors] = useState([""]);
  const [courses, setCourses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    course_id: "",
    term_id: "",
    session: "",
    section_num: "",
    component: "",
    instruction_mode: "",
    days: "",
    start_time: "",
    end_time: "",
    combined: "",
    status: "",
    capacity: "",
    room: "",
  });

  const showSectionDetails = !!formData.course_id && !!formData.term_id;

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

  const handleInstructorChange = (index: number, value: string) => {
    const updated = [...instructors];
    updated[index] = value;
    setInstructors(updated);
  };

  const addInstructorField = () => {
    setInstructors([...instructors, ""]);
  };

  const removeInstructorField = (index: number) => {
    setInstructors(instructors.filter((_, i) => i !== index));
  };

  const resetSectionForm = () => {
    setFormData({
      course_id: "",
      term_id: "",
      session: "",
      section_num: "",
      component: "",
      instruction_mode: "",
      days: "",
      start_time: "",
      end_time: "",
      combined: "",
      status: "",
      capacity: "",
      room: "",
    });
    setInstructors([""]);
  };

  const handleSubmitSection = async () => {
    const validInstructors = instructors.filter((name) => name.trim() !== "");

    const missingFields: string[] = [];

    if (!formData.course_id) missingFields.push("course_id");
    if (!formData.term_id) missingFields.push("term_id");
    if (!formData.session) missingFields.push("session");
    if (!formData.section_num?.toString().trim()) missingFields.push("section_num");
    if (!formData.component) missingFields.push("component");
    if (!formData.instruction_mode) missingFields.push("instruction_mode");
    if (!formData.days?.toString().trim()) missingFields.push("days");
    if (!formData.start_time) missingFields.push("start_time");
    if (!formData.end_time) missingFields.push("end_time");
    if (!formData.combined) missingFields.push("combined");
    if (!formData.status) missingFields.push("status");
    if (!formData.capacity?.toString().trim()) missingFields.push("capacity");
    if (!formData.room?.toString().trim()) missingFields.push("room");
    if (validInstructors.length === 0) missingFields.push("instructors");

    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      console.log("Form data:", formData);
      console.log("Instructors:", instructors);

      setErrorMessage(`Missing: ${missingFields.join(", ")}`);
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
        course_id: Number(formData.course_id),
        term_id: Number(formData.term_id),
        section_num: Number(formData.section_num),
        capacity: Number(formData.capacity),
        combined: formData.combined === "true",
        instructors: validInstructors,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch("/api/admin/sections", {
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
        throw new Error(data.error || "Failed to create section");
      }

      setSuccessMessage("Section created successfully.");
      setErrorMessage("");
      resetSectionForm();
    } catch (err) {
      setSuccessMessage("");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      console.error("Submit error:", err);
    }
  };

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [coursesRes, termsRes] = await Promise.all([
          fetch("api/courses-test", {
            credentials: "include",
          }),
          fetch("api/terms", {
            credentials: "include",
          }),
        ]);

        const coursesData = await coursesRes.json();
        const termsData = await termsRes.json();

        if (coursesRes.ok) setCourses(coursesData.courses || []);
        if (termsRes.ok) setTerms(termsData.terms || []);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    loadDropdownData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-[#003366] p-4 text-white">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          <h2 className="text-white">Add New Section</h2>
        </div>
        <p className="text-slate-200 text-sm mt-1">
          Choose the existing course and term first, then enter section details
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Step 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label
              htmlFor="course_id"
              className="text-slate-700 flex items-center gap-2 mb-2"
            >
              <BookOpen className="w-4 h-4 text-[#003366]" />
              Course
            </Label>
            <Select
              value={formData.course_id}
              onValueChange={(value) => handleSelectChange("course_id", value)}
            >
              <SelectTrigger id="course_id" className="border-slate-300">
                <SelectValue placeholder="Select existing course" />
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
              htmlFor="term_id"
              className="text-slate-700 flex items-center gap-2 mb-2"
            >
              <Calendar className="w-4 h-4 text-[#003366]" />
              Term
            </Label>
            <Select
              value={formData.term_id}
              onValueChange={(value) => handleSelectChange("term_id", value)}
            >
              <SelectTrigger id="term_id" className="border-slate-300">
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

        {/* Step 2 */}
        {showSectionDetails && (
          <>
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-[#003366] mb-4">Academic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="session"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Calendar className="w-4 h-4 text-[#003366]" />
                    Session
                  </Label>
                  <Select
                    value={formData.session}
                    onValueChange={(value) => handleSelectChange("session", value)}
                  >
                    <SelectTrigger id="session" className="border-slate-300">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_OPTIONS.map((session) => (
                        <SelectItem key={session} value={session}>
                          {session}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="section_num"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Hash className="w-4 h-4 text-[#003366]" />
                    Section Number
                  </Label>
                  <Input
                    id="section_num"
                    type="number"
                    value={formData.section_num}
                    onChange={handleChange}
                    placeholder="e.g. 1001"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="component"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Layers className="w-4 h-4 text-[#003366]" />
                    Course Component
                  </Label>
                  <Select
                    value={formData.component}
                    onValueChange={(value) =>
                      handleSelectChange("component", value)
                    }
                  >
                    <SelectTrigger id="component" className="border-slate-300">
                      <SelectValue placeholder="Select component" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_OPTIONS.map((component) => (
                        <SelectItem key={component.value} value={component.value}>
                          {component.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="instruction_mode"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Monitor className="w-4 h-4 text-[#003366]" />
                    Mode of Instruction
                  </Label>
                  <Select
                    value={formData.instruction_mode}
                    onValueChange={(value) =>
                      handleSelectChange("instruction_mode", value)
                    }
                  >
                    <SelectTrigger id="instruction_mode" className="border-slate-300">
                      <SelectValue placeholder="Select instruction mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTRUCTION_MODE_OPTIONS.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="status"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#003366]" />
                    Class Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger id="status" className="border-slate-300">
                      <SelectValue placeholder="Select class status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-[#003366] mb-4">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="days"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Calendar className="w-4 h-4 text-[#003366]" />
                    Class Days
                  </Label>
                  <Input
                    id="days"
                    type="text"
                    value={formData.days}
                    onChange={handleChange}
                    placeholder="e.g. MWF, TR"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="room"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <MapPin className="w-4 h-4 text-[#003366]" />
                    Room Code
                  </Label>
                  <Input
                    id="room"
                    type="text"
                    value={formData.room}
                    onChange={handleChange}
                    placeholder="e.g. DMSC 110"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="start_time"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Clock3 className="w-4 h-4 text-[#003366]" />
                    Start Time
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={handleChange}
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="end_time"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Clock3 className="w-4 h-4 text-[#003366]" />
                    End Time
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={handleChange}
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-[#003366] mb-4">Enrollment & Instructors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="combined"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Layers className="w-4 h-4 text-[#003366]" />
                    Combined
                  </Label>
                  <Select
                    value={formData.combined}
                    onValueChange={(value) => handleSelectChange("combined", value)}
                  >
                    <SelectTrigger id="combined" className="border-slate-300">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="capacity"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Users className="w-4 h-4 text-[#003366]" />
                    Enrollment Capacity
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-slate-700 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-[#003366]" />
                    Assigned Instructor(s)
                  </Label>

                  <div className="space-y-3">
                    {instructors.map((instructor, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2"
                      >
                        <Input
                          type="text"
                          placeholder={`Instructor ${index + 1}`}
                          value={instructor}
                          onChange={(e) =>
                            handleInstructorChange(index, e.target.value)
                          }
                          className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                        />

                        {instructors.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeInstructorField(index)}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}

                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addInstructorField}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Instructor
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {successMessage && (
          <p className="text-green-600 font-medium">{successMessage}</p>
        )}

        {errorMessage && (
          <p className="text-red-600 font-medium">{errorMessage}</p>
        )}

        {showSectionDetails && (
          <div className="border-t border-slate-200 pt-6 flex gap-3">
            <Button
              onClick={handleSubmitSection}
              className="flex-1 bg-[#003366] hover:bg-[#002244] text-white h-12"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit Section
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                resetSectionForm();
                setSuccessMessage("");
                setErrorMessage("");
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