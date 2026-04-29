import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { PlusCircle, Hash, Monitor, Calendar, Clock3, MapPin, 
         Users, CheckCircle2, Layers, User } from "lucide-react";
import { SESSION_OPTIONS, COMPONENT_OPTIONS, INSTRUCTION_MODE_OPTIONS, 
         STATUS_OPTIONS, TERM_OPTIONS } from "../../utils/adminHelper";

const isValidSubject = (value: string) =>
  /^[A-Z]{2,6}$/.test(value.trim().toUpperCase());

const isValidCatalogNum = (value: string) =>
  /^[0-9]{3,4}[A-Z]?$/.test(value.trim().toUpperCase());

const isValidSectionNum = (value: string) =>
  /^[0-9]{3,5}$/.test(value.trim());

const isValidDays = (value: string) =>
  /^(M|T|W|R|F|S|U)+$/.test(value.trim().toUpperCase());

const isValidCapacity = (value: string) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 && num <= 999;
};

const isValidRoom = (value: string) =>
  /^[A-Z0-9 -]{4,20}$/i.test(value.trim());

const isValidInstructorName = (value: string) =>
  /^[A-Za-z.'-]{2,40}$/.test(value.trim());

const isStartBeforeEnd = (start: string, end: string) => {
  return start < end;
};

type InstructorInput = {
  first_name: string;
  last_name: string;
  instructor_id?: string;
  status?: "found" | "not_found";
  message?: string;
};
         
export function AdminAddSection() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [instructors, setInstructors] = useState<InstructorInput[]>([
    { first_name: "", last_name: "" },
  ]);

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
    course_subject: "",
    course_catalog_num: "",
    selected_course_label: "",
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

  const handleInstructorChange = (
    index: number,
    field: keyof InstructorInput,
    value: string
  ) => {
    const updated = [...instructors];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setInstructors(updated);
  };

  const handleCheckInstructor = async (index: number) => {
    const instructor = instructors[index];

    if (!instructor.first_name.trim() || !instructor.last_name.trim()) {
      setErrorMessage("Enter instructor first and last name.");
      return;
    }

    try {
      setErrorMessage("");

      const firstName = instructor.first_name.trim();
      const lastName = instructor.last_name.trim();

      const res = await fetch(
        `/api/admin/instructors/lookup?first_name=${firstName}&last_name=${lastName}`,
        { credentials: "include" }
      );

      const data = await res.json();

      const updated = [...instructors];

      if (res.ok) {
        updated[index] = {
          ...updated[index],
          instructor_id: String(data.instructor.id),
          status: "found",
          message: `Found: ${data.instructor.first_name} ${data.instructor.last_name}`,
        };
      } else {
        updated[index] = {
          ...updated[index],
          instructor_id: "",
          status: "not_found",
          message: "Not found — this instructor will be created when you submit.",
        };
      }

      setInstructors(updated);
    } catch {
      setErrorMessage("Instructor lookup failed.");
    }
  };

  const addInstructorField = () => {
    if (instructors.length >= 4) return;
    setInstructors([...instructors, { first_name: "", last_name: "" }]);
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
      course_subject: "",
      course_catalog_num: "",
      selected_course_label: "",
    });
    setInstructors([{ first_name: "", last_name: "" }]);
  };

  const handleFindCourse = async () => {
    if (!formData.course_subject.trim() || !formData.course_catalog_num.trim()) {
      setErrorMessage("Enter both subject and catalog number.");
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

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

      setErrorMessage(err instanceof Error ? err.message : "Course lookup failed.");
    }
  };

  const handleSubmitSection = async () => {
    const validInstructors = instructors.filter(
      (instructor) =>
        instructor.first_name.trim() !== "" &&
        instructor.last_name.trim() !== ""
    );
    
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

    if (!isValidSubject(formData.course_subject)) {
      setErrorMessage("Subject must be 2–6 letters, like CPE, MATH, or ENG.");
      setSuccessMessage("");
      return;
    }

    if (!isValidCatalogNum(formData.course_catalog_num)) {
      setErrorMessage("Catalog number must look like 101, 301, 1001, or 301L.");
      setSuccessMessage("");
      return;
    }

    if (!isValidSectionNum(formData.section_num)) {
      setErrorMessage("Section number must be 3–5 digits.");
      setSuccessMessage("");
      return;
    }

    if (!isValidDays(formData.days)) {
      setErrorMessage("Class days must use letters like MWF, TR, or F.");
      setSuccessMessage("");
      return;
    }

    if (!isStartBeforeEnd(formData.start_time, formData.end_time)) {
      setErrorMessage("Start time must be before end time.");
      setSuccessMessage("");
      return;
    }

    if (!isValidCapacity(formData.capacity)) {
      setErrorMessage("Capacity must be a whole number between 1 and 999.");
      setSuccessMessage("");
      return;
    }

    if (!isValidRoom(formData.room)) {
      setErrorMessage("Room code must be 4–20 characters using letters, numbers, spaces, or hyphens.");
      setSuccessMessage("");
      return;
    }

    const invalidInstructor = validInstructors.find(
      (instructor) =>
        !isValidInstructorName(instructor.first_name) ||
        !isValidInstructorName(instructor.last_name)
    );

    if (invalidInstructor) {
      setErrorMessage("Instructor names must be 2–40 letters and may include apostrophes, periods, or hyphens.");
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
        days: formData.days.trim().toUpperCase(),
        room: formData.room.trim().toUpperCase(),
        course_subject: formData.course_subject.trim().toUpperCase(),
        course_catalog_num: formData.course_catalog_num.trim().toUpperCase(),
        instructors: validInstructors.map((instructor) => ({
          first_name: instructor.first_name.trim(),
          last_name: instructor.last_name.trim(),
        })),
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Subject</Label>
              <Input
                id="course_subject"
                value={formData.course_subject}
                onChange={handleChange}
                placeholder="e.g. CPE"
              />
            </div>

            <div>
              <Label>Catalog Number</Label>
              <Input
                id="course_catalog_num"
                value={formData.course_catalog_num}
                onChange={handleChange}
                placeholder="e.g. 201"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleFindCourse} className="w-full bg-[#003366] text-white">
                Find Course
              </Button>
            </div>
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
                    <SelectContent className="max-h-37 overflow-y-auto">
                      {SESSION_OPTIONS.map((session) => (
                        <SelectItem key={session.value} value={session.value}>
                          {session.label}
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
                    <SelectContent className="max-h-37 overflow-y-auto">
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
                    <SelectContent className="max-h-37 overflow-y-auto">
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
                    <SelectContent className="max-h-37 overflow-y-auto">
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
                    <SelectContent className="max-h-37 overflow-y-auto">
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
                    Instructor(s)
                  </Label>

                  <div className="space-y-3">
                    {instructors.map((instructor, index) => (
                      <div key={index} className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <Input
                            type="text"
                            placeholder="First name"
                            value={instructor.first_name}
                            onChange={(e) =>
                              handleInstructorChange(index, "first_name", e.target.value)
                            }
                          />

                          <Input
                            type="text"
                            placeholder="Last name"
                            value={instructor.last_name}
                            onChange={(e) =>
                              handleInstructorChange(index, "last_name", e.target.value)
                            }
                          />

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCheckInstructor(index)}
                          >
                            Check Instructor
                          </Button>

                          {instructors.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => removeInstructorField(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        {instructor.message && (
                          <p
                            className={
                              instructor.status === "found"
                                ? "text-sm text-green-700 font-medium"
                                : "text-sm text-amber-700 font-medium"
                            }
                          >
                            {instructor.message}
                          </p>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addInstructorField}
                      disabled={instructors.length >= 4}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Instructor
                    </Button>
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