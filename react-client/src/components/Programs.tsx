import { Search } from "lucide-react";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Info } from "lucide-react";

export function Programs() {
  // TO BE REPLACED WITH UNR'S COLLEGES
  const programCategories = [
    {
      title: "College of Agriculture, Biotechnology & Natural Resources",
    },
    {
      title: "College of Business",
    },
    {
      title: "College of Education & Human Development",
    },
    {
      title: "College of Engineering",
    },
    {
      title: "College of Liberal Arts",
    },
    {
      title: "College of Science",
    },
    {
      title: "School of Medicine",
    },
    {
      title: "School of Public Health",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Disclaimer */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 text-sm">
            <span className="font-medium">Disclaimer:</span> This feature is currently nonfunctional! This feature does not connect with the backend and is display only.
          </p>
        </div>
      </div>

      {/* Page Title Section */}
      <div className="mb-8 lg:mb-12">
        <h1 className="text-[#003366] mb-2">Programs</h1>
        <p className="text-slate-600">Explore all UNR programs and majors</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search for programs..."
            className="pl-10 h-12 border-slate-200 shadow-sm"
          />
        </div>
      </div>

      {/* Program Categories */}
      <div className="space-y-6">
        {programCategories.map((category) => (
          <Card key={category.title} className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#003366]">
                {category.title}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
