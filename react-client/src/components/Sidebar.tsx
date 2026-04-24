import { Home, Search, Calendar, GraduationCap, Settings, User, LogOut, LayoutDashboard, BookUser} from "lucide-react";
import { cn } from "../lib/utils";
import UNR_Logo from "../assets/UNR_Logo.svg"
import type { Role } from "../lib/permissions";
import { NavLink } from "react-router-dom";

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  roles?: string[];
}

interface SidebarProps {
  onLogout: () => void;
  onToggle: () => void;
  isOpen: boolean;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
  onNavigateToLogin: () => void;
}

export function Sidebar({ onLogout, onToggle, isOpen, user, onNavigateToLogin }: SidebarProps) {
  const role: Role = (user?.role as Role) ?? "Guest";

  const allNavItems: NavItem[] = [
    { name: "Home", icon: Home, to: "/" },
    { name: "Search", icon: Search, to: "/search" },
    { name: "Planner", icon: Calendar, to: "/planner", roles: ["Student"] },
    { name: "Programs", icon: GraduationCap, to: "/programs" },
    { name: "Settings", icon: Settings, to: "/settings", roles: ["Student", "Instructor", "Advisor", "Admin"] },
    { name: "Dashboard", icon: LayoutDashboard, to: "/admin", roles: ["Admin"]},
    { name: "About", icon: BookUser, to: "/about"},
  ];

  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  if (!isOpen) return null;

  return (
    //Old made the logout button go way down page when having huge search result
    //<aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      {/* Logo and Profile */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center shadow-md shrink-0">
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
            <p className="text-slate-900 truncate text-sm">
              {user ? `${user.first_name} ${user.last_name}` : 'Guest'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user ? user.role : ''}
            </p>
          </div>
          <button
            onClick={onToggle}
            className="w-9 h-9 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors shrink-0"
          >
            <span className="text-slate-600 text-xl">✕</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      isActive
                        ? "bg-[#003366] text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Logout Button */}
      {user ? (
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onNavigateToLogin}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-[#003366] text-white hover:bg-[#002244]"
          >
            <LogOut className="w-5 h-5 rotate-180" />  {/* Flipped logout icon = login */}
            <span>Login</span>
          </button>
        </div>
      )}

    </aside>
  );
}
