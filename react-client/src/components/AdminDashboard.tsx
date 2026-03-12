import { useState, useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { ShieldUser, PlusCircle, Trash2, Search, Hash, Monitor, Calendar, Clock3,
         MapPin, Users, CheckCircle2, Layers, User, BookOpen } from "lucide-react";

export function AdminDashboard() {
  const [openPanel, setOpenPanel] = useState<"add" | "delete" | null>(null);
  const [instructors, setInstructors] = useState([""]);
  const [courses, setCourses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    course_id: "",
    term_id: "",
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

  const togglePanel = (panel: "add" | "delete") => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
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

  const handleSubmitSection = async () => {
    try {
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
        instructors: instructors.filter(i => i.trim() !== "")
      };

      const res = await fetch("/api/admin/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfData.csrf_token,
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create section");

      console.log("Section created:", data);

    } catch (err) {
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

  console.log(formData);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Page Title Section */}
      <div className="mb-8 lg:mb-12">
        <h1 className="text-[#003366] mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Manage courses as administrator</p>
      </div>

      <div className="space-y-6">
        {/* Main Admin Actions Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center shrink-0">
                <ShieldUser className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-[#003366]">Course Management</CardTitle>
                <CardDescription>
                  Add or remove sections from the system
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => togglePanel("add")}
                className="bg-[#003366] hover:bg-[#002244] text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                {openPanel === "add" ? "Close Add Form" : "Add Section"}
              </Button>

              <Button
                onClick={() => togglePanel("delete")}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {openPanel === "delete" ? "Close Delete Panel" : "Delete Section"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Add Section Panel */}
        {openPanel === "add" && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#003366]">Add Section</CardTitle>
              <CardDescription>
                Enter the details for a new section record
              </CardDescription>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Section Form Inputs */}
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
                    Component
                  </Label>
                  <Input
                    id="component"
                    type="text"
                    value={formData.component}
                    onChange={handleChange}
                    placeholder="e.g. LEC, LAB"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="instruction_mode"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Monitor className="w-4 h-4 text-[#003366]" />
                    Instruction Mode
                  </Label>
                  <Input
                    id="instruction_mode"
                    type="text"
                    value={formData.instruction_mode}
                    onChange={handleChange}
                    placeholder="e.g. P, HY, WA"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

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

                <div>
                  <Label
                    htmlFor="combined"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Layers className="w-4 h-4 text-[#003366]" />
                    Combined
                  </Label>
                  <Select onValueChange={(value) => handleSelectChange("combined", value)}>
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
                    htmlFor="status"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#003366]" />
                    Class Status
                  </Label>
                  <Input
                    id="status"
                    type="text"
                    value={formData.status}
                    onChange={handleChange}
                    placeholder="e.g. A, C"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
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

                <div className="md:col-span-2">
                  <Label className="text-slate-700 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-[#003366]" />
                    Assigned Instructor(s)
                  </Label>

                  <div className="space-y-3">
                    {instructors.map((instructor, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2">
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

              <div className="pt-6 flex justify-end">
                <Button 
                  onClick={handleSubmitSection}
                  className="bg-[#003366] hover:bg-[#002244] text-white"
                >
                  Submit Section
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Delete Section Panel */}
        {openPanel === "delete" && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#003366]">Delete Section</CardTitle>
              <CardDescription>
                Search for a section and remove it from the system
              </CardDescription>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="md:col-span-2">
                  <Label
                    htmlFor="deleteSearch"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Search className="w-4 h-4 text-[#003366]" />
                    Search Section
                  </Label>
                  <Input
                    id="deleteSearch"
                    type="text"
                    placeholder="Search by course code or title"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div className="flex items-end">
                  <Button className="w-full bg-[#003366] hover:bg-[#002244] text-white h-10">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Placeholder Results */}
              <div className="pt-6 space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-[#003366] font-medium">
                        CS 135 - Computer Science I
                      </h3>
                      <p className="text-sm text-slate-600">
                        Section 1001 • MWF • 10:00 AM - 10:50 AM • DMSC 110
                      </p>
                      <p className="text-sm text-slate-500">
                        Instructor: Jane Doe
                      </p>
                    </div>

                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Section
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-[#003366] font-medium">
                        MATH 181 - Calculus I
                      </h3>
                      <p className="text-sm text-slate-600">
                        Section 2001 • TR • 1:00 PM - 2:15 PM • AB 101
                      </p>
                      <p className="text-sm text-slate-500">
                        Instructor: John Smith
                      </p>
                    </div>

                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Section
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}