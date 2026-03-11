import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { ShieldUser, PlusCircle, Trash2, Search, Hash, Monitor, Calendar, Clock3,
         MapPin, Users, CheckCircle2, Layers, User } from "lucide-react";

export function AdminDashboard() {
  const [openPanel, setOpenPanel] = useState<"add" | "delete" | null>(null);
  const [instructors, setInstructors] = useState([""]);

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
                <div>
                  <Label
                    htmlFor="sectionNum"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Hash className="w-4 h-4 text-[#003366]" />
                    Section Number
                  </Label>
                  <Input
                    id="sectionNum"
                    type="number"
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
                    placeholder="e.g. LEC, LAB"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="instructionMode"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Monitor className="w-4 h-4 text-[#003366]" />
                    Instruction Mode
                  </Label>
                  <Input
                    id="instructionMode"
                    type="text"
                    placeholder="e.g. P, HY, WA"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="classDays"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Calendar className="w-4 h-4 text-[#003366]" />
                    Class Days
                  </Label>
                  <Input
                    id="classDays"
                    type="text"
                    placeholder="e.g. MWF, TR"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="startTime"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Clock3 className="w-4 h-4 text-[#003366]" />
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="endTime"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Clock3 className="w-4 h-4 text-[#003366]" />
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
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
                  <Select>
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
                    htmlFor="classStatus"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#003366]" />
                    Class Status
                  </Label>
                  <Input
                    id="classStatus"
                    type="text"
                    placeholder="e.g. A, C"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="enrollmentCapacity"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <Users className="w-4 h-4 text-[#003366]" />
                    Enrollment Capacity
                  </Label>
                  <Input
                    id="enrollmentCapacity"
                    type="number"
                    placeholder="e.g. 30"
                    className="border-slate-300 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="roomCode"
                    className="text-slate-700 flex items-center gap-2 mb-2"
                  >
                    <MapPin className="w-4 h-4 text-[#003366]" />
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    type="text"
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
                <Button className="bg-[#003366] hover:bg-[#002244] text-white">
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