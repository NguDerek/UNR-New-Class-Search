import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { ShieldUser, PlusCircle, Trash2, Clock , RefreshCcw} from "lucide-react";
import { AdminAddSection } from "./AdminAddSection";
import { AdminAddCourse } from "./AdminAddCourse";
import { AdminRemoveSection } from "./AdminRemoveSection";
import { AdminRemoveCourse } from "./AdminRemoveCourse";
import { AdminModifyCourse } from "./AdminModifyCourse";
//import { AdminHistory } from "./AdminHistory";

type AdminView = "add-course" | "add-section" | "remove-course" | "remove-section" 
                  | "history" | "modify-course" | null;

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>(null);

  const actionCards = [
    {
      key: "add-course" as const,
      title: "Add New Course",
      description: "Create a brand new course record in the system",
      icon: PlusCircle,
      cardBg: "bg-blue-50",
      ring: "ring-blue-400",
    },
    {
      key: "add-section" as const,
      title: "Add New Section",
      description: "Add a section to an existing course",
      icon: PlusCircle,
      cardBg: "bg-blue-50",
      ring: "ring-blue-400",
    },
    {
      key: "remove-course" as const,
      title: "Remove Course",
      description: "Delete or deactivate an existing course record",
      icon: Trash2,
      cardBg: "bg-red-50",
      ring: "ring-red-400",
    },
    {
      key: "remove-section" as const,
      title: "Remove Section",
      description: "Search for and remove a course section",
      icon: Trash2,
      cardBg: "bg-red-50",
      ring: "ring-red-400",
    },
    {
      key: "modify-course" as const,
      title: "Modify Course",
      description: "Adjust course details",
      icon: RefreshCcw,
      cardBg: "bg-slate-50",
      ring: "ring-slate-400",
    },
    // {
    //   key: "history" as const,
    //   title: "View History",
    //   description: "See admin activity and changes",
    //   icon: Clock,
    //   cardBg: "bg-slate-50",
    //   ring: "ring-slate-400",
    // },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <div className="mb-8 lg:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-[#003366] rounded-xl flex items-center justify-center shrink-0">
            <ShieldUser className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[#003366] mb-1">Admin Dashboard</h1>
            <p className="text-slate-600">
              Manage course records, sections, and administrative actions
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actionCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeView === card.key;

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  setActiveView((prev) => (prev === card.key ? null : card.key));
                }}
                className="text-left"
              >
                <Card
                  className={`${card.cardBg} border-slate-200 shadow-sm hover:shadow-md transition-all ${
                    isActive ? `ring-2 ${card.ring}` : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-[#003366]">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[#003366]">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="pt-1">
                          {card.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </button>
            );
          })}
        </div>

        {/* Add Course */}
        {activeView === "add-course" && <AdminAddCourse />}

        {/* Add Section */}
        {activeView === "add-section" && <AdminAddSection />}

        {/* Remove Course */}
        {activeView === "remove-course" && <AdminRemoveCourse/>}

        {/* Remove Section */}
        {activeView === "remove-section" && <AdminRemoveSection/>}

        {/* View History */}
        {/*activeView === "history" && <AdminHistory />*/}

        {/* Modify Course */}
        {activeView === "modify-course" && <AdminModifyCourse />}
      </div>
    </div>
  );
}