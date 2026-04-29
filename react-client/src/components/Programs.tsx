import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, ExternalLink, BookOpen } from "lucide-react";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Info } from "lucide-react";
import { courseAPI } from "../services/api";
import type { CollegeGroup, Program } from "../services/api";
import type { Role } from "../lib/permissions";
const API_BASE_URL = 'api';

interface ProgramsProps {
  role: Role;
  currentMajorPoid?: string | null;       // pass in from auth state
  onMajorSelected?: (poid: string) => void; // optional callback to update parent
}

export function Programs({ role, currentMajorPoid, onMajorSelected }: ProgramsProps) {
  const [colleges, setColleges] = useState<CollegeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedPoid, setSelectedPoid] = useState<string | null>(currentMajorPoid ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    courseAPI.fetchPrograms()
      .then(setColleges)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedPoid(currentMajorPoid ?? null);
  }, [currentMajorPoid]);

  const filtered = colleges
    .map((c) => ({
      ...c,
      majors: c.majors.filter((m) =>
        m.major_title.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((c) => c.majors.length > 0);

  const handleSelectMajor = async (poid: string) => {
    setSaving(true);
    try {
      await courseAPI.setUserMajor(poid);
      setSelectedPoid(poid);
      onMajorSelected?.(poid);
    } catch (e) {
      alert("Failed to save major. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdvisorUpload = async (poid: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_BASE_URL}/programs/${poid}/attachments`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!response.ok) {
      alert("Upload failed.");
      return;
    }
    // Refresh programs so the new attachment appears
    courseAPI.fetchPrograms().then(setColleges);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Disclaimer */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-blue-900 text-sm">
          <span className="font-medium">Note:</span> Select your major to get
          tailored course recommendations.
        </p>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-[#003366] mb-2">Programs</h1>
        <p className="text-slate-600">Explore all UNR programs and majors</p>
        {selectedPoid && (
          <p className="mt-2 text-sm text-green-700 font-medium">
            ✓ Your major is set
          </p>
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

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((college) => (
            <Card key={college.college} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#003366]">{college.college}</CardTitle>
              </CardHeader>

              <div className="px-6 pb-4 divide-y divide-slate-100">
                {college.majors.map((major) => {
                  const isExpanded  = expanded === major.major_poid;
                  const isSelected  = selectedPoid === major.major_poid;

                  return (
                    <div key={major.major_poid} className="py-3">
                      {/* Major row */}
                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={() =>
                            setExpanded(isExpanded ? null : major.major_poid)
                          }
                          className="flex items-center gap-2 text-left text-sm font-medium text-slate-800 hover:text-[#003366] flex-1"
                        >
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" />
                            : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                          }
                          {major.major_title}
                          {isSelected && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
                              Your Major
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Catalog link */}
                          <a
                            href={major.major_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#003366] border border-slate-200 rounded-md px-2 py-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Catalog
                          </a>

                          {/* Select Major — students only */}
                          {(role === "Student" || role === "Guest") && (
                            <button
                              onClick={() => handleSelectMajor(major.major_poid)}
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
                      {isExpanded && (
                        <div className="mt-3 ml-6 space-y-3">
                          {/* Description */}
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {major.description}
                          </p>

                          {/* Attachments */}
                          {major.attachments.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                Resources
                              </p>
                              <ul className="space-y-1">
                                {major.attachments.map((att) => (
                                  <li key={att.id}>
                                    <a
                                      href={`/api/programs/attachments/${att.id}/download`}
                                      className="text-sm text-[#003366] hover:underline"
                                    >
                                      📎 {att.originalName}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Advisor upload — per major */}
                          {role === "Advisor" && (
                            <div className="pt-2">
                              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#003366] text-white text-xs rounded-lg cursor-pointer hover:bg-[#004080]">
                                Upload Resource
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAdvisorUpload(major.major_poid, file);
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          {filtered.length === 0 && (
            <p className="text-slate-500 text-sm">No programs match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}