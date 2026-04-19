import { GraduationCap, Users, BookOpen, Award } from "lucide-react";

export function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Page Title Section */}
      <div className="mb-8 lg:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-[#003366]">About Our Project</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Mission Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-[#003366] mb-3">New Class Search</h2>
          <p className="text-slate-600 leading-relaxed">
            CS 426 Senior Project in Computer Science <br></br>
            Spring 2026 | University of Nevada, Reno <br></br>
            Department of Computer Science and Engineering
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-[#003366]">Comprehensive Search</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Filter courses by term, subject, career level, mode of instruction, and more 
              to find exactly what you need.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-[#003366]">Course Planning</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Add courses to your planner to visualize your semester schedule and track 
              your total credits.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-[#003366]">Real-time Updates</h3>
            </div>
            <p className="text-slate-600 text-sm">
              See enrollment status and seat availability at a glance to make informed 
              decisions about your course selections.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-[#003366]">Student-Focused</h3>
            </div>
            <p className="text-slate-600 text-sm">
              Built with student needs in mind, featuring a clean, modern interface that 
              prioritizes usability and accessibility.
            </p>
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="text-[#003366] mb-3">System Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Version</span>
              <span className="text-slate-900 font-medium">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Last Updated</span>
              <span className="text-slate-900 font-medium">April 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Institution</span>
              <span className="text-slate-900 font-medium">University of Nevada, Reno</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
