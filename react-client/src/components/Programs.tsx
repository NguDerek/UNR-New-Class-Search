import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, ExternalLink, BookOpen, File, Trash2 } from "lucide-react";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Info } from "lucide-react";
import { courseAPI } from "../services/api";
import type { ProgramsResponse, Program } from "../services/api";
import type { Role } from "../lib/permissions";

interface ProgramsProps {
  role: Role;
  currentMajorPoid?: string | null;
  onMajorSelected?: (poid: string) => void;
}

function ProgramRow({
  program, role, selectedPoid, saving, csrfToken,
  onSelect, onRefresh,
}: {
  program: Program;
  role: Role;
  selectedPoid: string | null;
  saving: boolean;
  csrfToken: string;
  onSelect: (poid: string) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const isSelected = selectedPoid === program.poid;
  const canSelect  = role === "Student" && program.level === "undergraduate";

  const handleUpload = async (file: globalThis.File) => {
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      const formData = new FormData();
      formData.append("program_id", program.poid);
      formData.append("file", file);

      const res = await fetch(`/api/programs/attachments/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadSuccess("File uploaded successfully!");
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attId: number, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    setDeletingId(attId);
    try {
      const res = await fetch(`/api/programs/attachments/${attId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
      });
      if (!res.ok) throw new Error("Delete failed");
      onRefresh();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      {/* Row header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left text-sm font-medium text-slate-800 hover:text-[#003366] flex-1"
        >
          {expanded
            ? <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" />
            : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
          {program.title}
          {isSelected && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
              Your Major
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={program.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#003366] border border-slate-200 rounded-md px-2 py-1"
          >
            <ExternalLink className="w-3 h-3" /> Catalog
          </a>

          {canSelect && (
            <button
              onClick={() => onSelect(program.poid)}
              disabled={isSelected || saving}
              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-md border transition-colors ${
                isSelected
                  ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                  : "bg-[#003366] text-white border-[#003366] hover:bg-[#004080]"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              {isSelected ? "Selected" : "Select Major"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-3 ml-6 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{program.description}</p>

          {/* Attachments list */}
          {program.attachments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Resources
              </p>
              <ul className="space-y-1">
                {program.attachments.map((att) => (
                  <li key={att.id} className="flex items-center gap-2">
                    <a
                      href={`/api/programs/attachments/${att.id}/download`}
                      className="text-sm text-[#003366] hover:underline flex items-center gap-1"
                    >
                      📎 {att.originalName}
                    </a>
                    {role === "Advisor" && (
                      <button
                        onClick={() => handleDelete(att.id, att.originalName)}
                        disabled={deletingId === att.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors disabled:opacity-50 ml-1"
                        title="Delete file"
                      >
                        {deletingId === att.id
                          ? <span className="text-xs">Deleting...</span>
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Advisor upload */}
          {role === "Advisor" && (
            <div className="pt-1">
              <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] cursor-pointer">
                <File className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Resource"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </label>
              {uploadError   && <p className="text-xs text-red-600 mt-1 text-center">{uploadError}</p>}
              {uploadSuccess && <p className="text-xs text-green-600 mt-1 text-center">{uploadSuccess}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollegeCard({
  college, undergraduate, graduate, role, selectedPoid, saving,
  csrfToken, search, onSelect, onRefresh,
}: {
  college: string;
  undergraduate: Program[];
  graduate: Program[];
  role: Role;
  selectedPoid: string | null;
  saving: boolean;
  csrfToken: string;
  search: string;
  onSelect: (poid: string) => void;
  onRefresh: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab]             = useState<"undergraduate" | "graduate">("undergraduate");

  const filter = (list: Program[]) =>
    list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const filteredUndergrad = filter(undergraduate);
  const filteredGrad      = filter(graduate);
  const hasGrad           = filteredGrad.length > 0;
  const hasUndergrad      = filteredUndergrad.length > 0;

  // If search hides all programs in current tab, auto-switch
  const effectiveTab = tab === "undergraduate" && !hasUndergrad && hasGrad
    ? "graduate"
    : tab === "graduate" && !hasGrad && hasUndergrad
    ? "undergraduate"
    : tab;

  const activeList = effectiveTab === "undergraduate" ? filteredUndergrad : filteredGrad;

  // Hide card entirely if search matches nothing
  if (!hasUndergrad && !hasGrad) return null;

  const sharedRowProps = { role, selectedPoid, saving, csrfToken, onSelect, onRefresh };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#003366]">{college}</CardTitle>
          {collapsed
            ? <ChevronDown className="w-5 h-5 text-slate-400" />
            : <ChevronUp className="w-5 h-5 text-slate-400" />}
        </div>
      </CardHeader>

      {!collapsed && (
        <div className="px-6 pb-4">
          {/* Undergrad / Grad tabs — only show if both exist */}
          {(hasUndergrad && hasGrad) && (
            <div className="flex gap-2 mb-4 border-b border-slate-100">
              {(["undergraduate", "graduate"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 px-1 text-sm font-medium capitalize border-b-2 transition-colors ${
                    effectiveTab === t
                      ? "border-[#003366] text-[#003366]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {activeList.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">No programs match your search.</p>
          ) : (
            activeList.map((program) => (
              <ProgramRow key={program.poid} program={program} {...sharedRowProps} />
            ))
          )}
        </div>
      )}
    </Card>
  );
}

export function Programs({ role, currentMajorPoid, onMajorSelected }: ProgramsProps) {
  const [data, setData] = useState<ProgramsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPoid, setSelectedPoid] = useState<string | null>(currentMajorPoid ?? null);
  const [saving, setSaving] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [minorsOpen, setMinorsOpen] = useState(false);

  const refresh = () =>
    courseAPI.fetchPrograms().then(setData).catch((err) => setError(err.message));

  useEffect(() => {
    courseAPI.fetchPrograms()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedPoid(currentMajorPoid ?? null);
  }, [currentMajorPoid]);

  useEffect(() => {
    fetch("/api/csrf-token", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrf_token))
      .catch(() => console.error("Failed to fetch CSRF token"));
  }, []);

  const handleSelectMajor = async (poid: string) => {
    setSaving(true);
    try {
      await courseAPI.setUserMajor(poid);
      setSelectedPoid(poid);
      onMajorSelected?.(poid);
    } catch {
      alert("Failed to save major. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredMinors = (data?.minors ?? []).filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const sharedProps = {
    role, selectedPoid, saving, csrfToken,
    search,
    onSelect: handleSelectMajor,
    onRefresh: refresh,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Note */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-blue-900 text-sm">
          <span className="font-medium">Note:</span> Select an undergraduate
          program as your major to get tailored course recommendations.
        </p>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-[#003366] mb-2">Programs</h1>
        <p className="text-slate-600">Explore all UNR programs and majors</p>
        {selectedPoid && (
          <p className="mt-2 text-sm text-green-700 font-medium">✓ Your major is set</p>
        )}
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search for programs..."
            className="pl-10 h-12 border-slate-200 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-slate-500">Loading programs...</p>}
      {error   && <p className="text-red-500">{error}</p>}

      {!loading && !error && data && (
        <div className="space-y-4">
          {/* College cards */}
          {data.colleges.map((c) => (
            <CollegeCard
              key={c.college}
              college={c.college}
              undergraduate={c.undergraduate}
              graduate={c.graduate}
              {...sharedProps}
            />
          ))}

          {/* Minors — collapsible */}
          {filteredMinors.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setMinorsOpen(!minorsOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#003366]">Minors</CardTitle>
                  {minorsOpen
                    ? <ChevronUp className="w-5 h-5 text-slate-400" />
                    : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </CardHeader>
              {minorsOpen && (
                <div className="px-6 pb-4">
                  {filteredMinors.map((program) => (
                    <ProgramRow
                      key={program.poid}
                      program={program}
                      {...{ role, selectedPoid, saving, csrfToken,
                            onSelect: handleSelectMajor, onRefresh: refresh }}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}

          {data.colleges.every((c) =>
            [...c.undergraduate, ...c.graduate].every(
              (p) => !p.title.toLowerCase().includes(search.toLowerCase())
            )
          ) && filteredMinors.length === 0 && (
            <p className="text-slate-500 text-sm">No programs match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}