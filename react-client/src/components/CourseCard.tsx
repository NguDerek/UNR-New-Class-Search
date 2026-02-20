import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Clock, MapPin, Users, GraduationCap, Video, Plus, Check, Trash2 } from "lucide-react";

interface CourseCardProps {
  id: string;
  code: string;
  title: string;
  instructor: string;
  schedule: string;
  credits: number;
  enrolled: number;
  capacity: number;
  location: string;
  department: string;
  component: string;
  section: number;
  level: string;
  courseCareer: string;
  modeOfInstruction: string;
  isInPlanner?: boolean;
  onAddToPlanner?: (courseId: string) => void;
  showPlannerButton?: boolean;
  onRemoveFromPlanner?: (courseId: string) => void;
  showRemoveButton?: boolean
}

export function CourseCard({
  id,
  code,
  title,
  instructor,
  schedule,
  credits,
  enrolled,
  capacity,
  location,
  department,
  component,
  section,
  // level,
  courseCareer,
  modeOfInstruction,
  isInPlanner = false,
  onAddToPlanner,
  showPlannerButton = false,
  onRemoveFromPlanner,
  showRemoveButton = false
}: CourseCardProps) {
  const availabilityPercent = (enrolled / capacity) * 100;
  const availabilityStatus =
    availabilityPercent >= 90
      ? "full"
      : availabilityPercent >= 70
      ? "limited"
      : "open";

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-200 border-slate-200 bg-white hover:border-indigo-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-linear-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{code}</span>
            <Badge variant="outline" className="border-slate-300 text-slate-600">{department}</Badge>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200">{courseCareer}</Badge>
            <Badge variant="outline" className="border-slate-300 text-slate-600"> {component}</Badge>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm bg-slate-50 px-3 py-1 rounded-full">
            <GraduationCap className="w-3.5 h-3.5" />{credits} Credits
            </div>
          </div>
          <h3 className="mb-2 text-slate-900">{title}</h3>
          <p className="text-slate-600">{instructor}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <Badge
            variant={
              availabilityStatus === "open"
                ? "default"
                : availabilityStatus === "limited"
                ? "secondary"
                : "destructive"
            }
            className={
              availabilityStatus === "open"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : availabilityStatus === "limited"
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-red-100 text-red-700 border-red-200"
            }
          >
            {enrolled}/{capacity} Enrolled
          </Badge>
          <Badge variant="outline" className="border-slate-300 text-slate-600">
            Section {section}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{schedule}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <Video className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{modeOfInstruction}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <Users className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            {availabilityStatus === "open"
              ? "Seats Available"
              : availabilityStatus === "limited"
              ? "Limited Seats"
              : "Class Full"}
          </span>
        </div>
      </div>

      {showPlannerButton && onAddToPlanner && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            onClick={() => onAddToPlanner(id)}
            disabled={isInPlanner}
            className={
              isInPlanner
                ? "w-full bg-slate-100 text-slate-600 cursor-not-allowed hover:bg-slate-100"
                : "w-full bg-[#003366] hover:bg-[#002244] text-white"
            }
          >
            {isInPlanner ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Added to Planner
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Planner
              </>
            )}
          </Button>
        </div>
      )}
      {showRemoveButton && onRemoveFromPlanner && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            onClick={() => onRemoveFromPlanner(id)}
            className="w-full bg-red-100 hover:bg-red-200 text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove from Planner
          </Button>
        </div>
      )}
    </Card>
  );
}
