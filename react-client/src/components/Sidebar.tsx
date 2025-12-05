import { Home, Search, Calendar, GraduationCap, Settings, User } from "lucide-react";
import { cn } from "../lib/utils";
import UNR_Logo from "../assets/UNR_Logo.svg"

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: "home" | "search" | "planner" | "programs" | "settings";
}

interface SidebarProps {
  currentView: "home" | "search" | "planner" | "programs" | "settings";
  onNavigate: (view: "home" | "search" | "planner" | "programs" | "settings") => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const navItems: NavItem[] = [
    { name: "Home", icon: Home, view: "home" },
    { name: "Search", icon: Search, view: "search" },
    { name: "Planner", icon: Calendar, view: "planner" },
    { name: "Programs", icon: GraduationCap, view: "programs" },
    { name: "Settings", icon: Settings, view: "settings" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* Logo and Profile */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center shadow-md shrink-0">
            {/* REPLACE WITH ACTUAL UNR LOGO HERE */}
            <img 
                src={UNR_Logo} 
                alt="UNR Logo" 
                className="w-full h-full object-contain"
            />
          </div>
          <button className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors shrink-0">
            <User className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            {/* TO BE REPLACED WITH USER'S NAME */}
            <p className="text-slate-900 truncate text-sm">John Smith</p>
            <p className="text-xs text-slate-500 truncate">Student</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.view === currentView;
            return (
              <li key={item.name}>
                <button
                  onClick={() => item.view && onNavigate(item.view)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-[#003366] text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
