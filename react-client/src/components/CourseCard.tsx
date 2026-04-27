import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Clock, MapPin, Users, GraduationCap, Video, Plus, Check, Trash2, ArrowRightLeft, File } from "lucide-react";
import type { Role } from "../lib/permissions";
import { useState, useEffect } from "react";

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
  section: string;
  level: string;
  courseCareer: string;
  modeOfInstruction: string;
  role?: Role;
  isInPlanner?: boolean;
  onAddToPlanner?: (courseId: string) => void;
  showPlannerButton?: boolean;
  onRemoveFromPlanner?: (courseId: string) => void;
  showRemoveButton?: boolean
  onLoginPrompt?: () => void;
  showSwapButton?: boolean;
  onSwapPrompt?: (courseId: string) => void;
  showSearchSwapButton?: boolean;
  onSwapWithCourse?: (courseId: string) => void;
  isConflict?: boolean;
  attachments?: Array<{
    id: number;
    original_name: string;
    mime_type: string;
    download_url: string;
  }>;
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
  role,
  isInPlanner = false,
  onAddToPlanner,
  showPlannerButton = false,
  onRemoveFromPlanner,
  showRemoveButton = false,
  onLoginPrompt,
  showSwapButton = false,
  onSwapPrompt,
  showSearchSwapButton = false,
  onSwapWithCourse,
  isConflict = false,
  attachments,
  
}: CourseCardProps) {
  const availabilityPercent = (enrolled / capacity) * 100;
  const availabilityStatus =
    availabilityPercent >= 90
      ? "full"
      : availabilityPercent >= 70
      ? "limited"
      : "open";
  const [csrfToken, setCsrfToken] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
      fetch('/api/csrf-token', {
        credentials: 'include',
      })
        .then(response => response.json())
        .then(data => setCsrfToken(data.csrf_token))
        .catch(error => console.error('Failed to fetch CSRF token:', error));
    }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess("");

      const formData = new FormData();
      formData.append("section_id", id);
      formData.append("file", file);

      const res = await fetch("/api/attachments/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          'X-CSRFToken': csrfToken,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadSuccess("File uploaded successfully");
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attId: number, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;

    try {
      setDeletingId(attId);

      const res = await fetch(`/api/attachments/${attId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken }
      });

      if (!res.ok) throw new Error('Delete failed');

    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  {/* Color themeing for when classes conflict */}
  const theme = isConflict
  ? {
      card: "border-red-600 bg-red-50",
      code: "from-red-600 to-rose-600",
      department: "border-red-300",
      courseCareer: "bg-red-100 text-red-700 border-red-200",
      component: "border-red-300",
      credits: "text-red-700 bg-red-100",
      section: "border-red-300",
      schedule: "text-red-500",
      location: "text-red-500",
      modeOfInstruction: "text-red-500",
      availability: "text-red-500",
      removeBtn: "bg-red-200 hover:bg-red-300"
    }
  : {
      card: "border-slate-200 bg-white",
      code: "from-indigo-600 to-blue-600",
      department: "border-slate-300",
      courseCareer: "bg-indigo-100 text-indigo-700 border-indigo-200",
      component: "border-slate-300",
      credits: "text-slate-500 bg-slate-100",
      section: "border-slate-300",
      schedule: "text-indigo-500",
      location: "text-indigo-500",
      modeOfInstruction: "text-indigo-500",
      availability: "text-indigo-500",
      removeBtn: "bg-red-100 hover:bg-red-200"
    }

  return (
    <Card className={`p-6 hover:shadow-xl transition-all duration-200 border rounded-xl 
      ${theme.card}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`bg-linear-to-r ${theme.code} bg-clip-text text-transparent`}>{code}</span>
            <Badge variant="outline" className={`border-slate-300 ${theme.department}`}>{department}</Badge>
            <Badge variant="secondary" className={`${theme.courseCareer}`}>{courseCareer}</Badge>
            <Badge variant="outline" className={`border-slate-300 ${theme.component}`}> {component}</Badge>
            <div className={`flex items-center gap-1.5 text-sm ${theme.credits} px-3 py-1 rounded-full`}>
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
            {capacity} Total Seats
          </Badge>
          <Badge variant="outline" className={`${theme.section} text-slate-600`}>
            Section {section}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <Clock className={`w-4 h-4 ${theme.schedule} shrink-0`} />
          <span>{schedule}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <MapPin className={`w-4 h-4 ${theme.location} shrink-0`} />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <Video className={`w-4 h-4 ${theme.modeOfInstruction} shrink-0`} />
          <span>{modeOfInstruction}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <Users className={`w-4 h-4 ${theme.availability} shrink-0`} />
          <span>
            {availabilityStatus === "open"
              ? "Seats Available"
              : availabilityStatus === "limited"
              ? "Limited Seats"
              : "Class Full"}
          </span>
        </div>
      </div>

      {/* Section Files */}
      {attachments && attachments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="font-medium mb-3 text-slate-900 flex items-center gap-2">
            Section Files ({attachments.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200">
              <a
                href={att.download_url}
                download={att.original_name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors text-sm border border-slate-200"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-md flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {att.mime_type?.startsWith("image/") ? "IMG" :
                    att.mime_type?.includes("pdf") ? "PDF" : "DOC"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-slate-900">{att.original_name}</p>
                  <p className="text-xs text-slate-500">
                    {att.mime_type?.split("/")[1]?.replace("pdf", "PDF") || "File"}
                  </p>
                </div>
              </a>
              {/* Instructor: Delete button */}
                {role === "Instructor" && (
                  <button
                    onClick={() => handleDelete(att.id, att.original_name)}
                    disabled={deletingId === att.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                    title="Delete file"
                  >
                    {deletingId === att.id ? (
                      <span className="text-xs">Deleting...</span>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest: show login prompt button */}
      {role === "Guest" && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            onClick={onLoginPrompt}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
          >
            Login to Add to Planner
          </Button>
        </div>
      )}

      {/* Authenticated: show add button */}
      {role === "Student" && showPlannerButton && onAddToPlanner && (
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

      {/* Remove button (planner page only) */}
      {showRemoveButton && onRemoveFromPlanner && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            onClick={() => onRemoveFromPlanner(id)}
            className={`w-full ${theme.removeBtn} text-red-700`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove from Planner
          </Button>
        </div>
      )}

      {/* Instructor upload button */}
      {role === "Instructor" && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244]">
            <File className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Course File"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>

          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          {uploadSuccess && <p className="text-sm text-green-600">{uploadSuccess}</p>}
        </div>
      )}

      {/* Planner Swap Button */}
      {showSwapButton && onSwapPrompt &&(
        <div className="mt-4">
          <Button
            onClick={() => onSwapPrompt(id)}
            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Swap Course
          </Button>
        </div>
      )}
      {/* Swap button inside swap modal */}
      {showSearchSwapButton && onSwapWithCourse &&(
        <div className="mt-4">
          <Button
            onClick={() => onSwapWithCourse(id)}
            disabled={isInPlanner}
            className={
              isInPlanner
                ? "w-full bg-slate-100 text-slate-600 cursor-not-allowed hover:bg-slate-100"
                : "w-full bg-blue-100 hover:bg-blue-200 text-blue-700"
            }
          >
            {isInPlanner ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Already added to Planner
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Switch
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
