import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { Programs } from "./components/Programs";
import { Planner } from "./components/Planner";
import { Login } from "./components/Login";
import { SignUp } from "./components/SignUp"
import { Menu } from "lucide-react";
import type { Role } from "./lib/permissions";
import { AdminDashboard } from "./components/admin/AdminDashboard.tsx";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Search } from "./components/Search.tsx"
import { AboutPage } from "./components/AboutPage.tsx";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Course {
  id: string;
  code: string;
  courseNumber: string;
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
  days: string[];
  courseCareer: string;
  modeOfInstruction: string;
}

export default function App() {
  const navigate = useNavigate();
  console.log("App component rendering");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); };

  useEffect(() => {
    fetch('/api/csrf-token', {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setCsrfToken(data.csrf_token))
      .catch(error => console.error('Failed to fetch CSRF token:', error));
  }, []);

  useEffect(() => {
    const checkAuthStatus = () => {
      fetch("/api/auth/status", {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            setUser(data.user);
          }
        })
        .catch((error) => {
          console.error("Error checking auth status:", error);
        })
        .finally(() => {
          setIsLoadingAuth(false);
        });
    };

    checkAuthStatus();
  }, []);
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch('/api/planner', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const ids = new Set(data.sections.map((s: any) => s.section_id.toString()));
          setPlannedCourseIds(ids as Set<string>);
        }
      })
      .catch(err => console.error('Failed to load planner:', err));
  }, [isAuthenticated]);


  //const [currentView, setCurrentView] = useState<"home" | "search" | "planner" | "programs" | "settings" | "login" | "signup" | "admin">("home");
  
  const role: Role = (user?.role as Role) ?? "Guest";

  /*const publicViews: typeof currentView[] = ["login", "signup"];

  if (!publicViews.includes(currentView) && !viewPermissions[currentView].includes(role)) {
    return (
      <div className="flex-1 p-6 text-center text-red-600">
        You are not authorized to view this page.
      </div>
    );
  }
*/
  
  // Planner state
  const [plannedCourseIds, setPlannedCourseIds] = useState<Set<string>>(new Set());


  const handleAddToPlanner = async (courseId: string) => {
    //setPlannedCourseIds((prev) => new Set(prev).add(courseId));
    try {
      const response = await fetch('/api/planner/section', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ section_id: parseInt(courseId) })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to add to planner:', data.error);
        return;
      }

      setPlannedCourseIds((prev) => new Set(prev).add(courseId));
      console.log('Section added to planner');

    } catch (error) {
      console.error('Error adding to planner:', error);
    }
  };

  const handleRemoveFromPlanner = async (courseId: string) => {
    try {
      const response = await fetch(`/api/planner/section/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken
        }
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to remove from planner:', data.error);
        return;
      }

      setPlannedCourseIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
      console.log('Section removed from planner');

    } catch (error) {
      console.error('Error removing from planner:', error);
    }
  };

  // Handle authentication
  const handleLogin = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    navigate("/");
  };

  const handleSignUp = (userData: User) => {
    //setIsAuthenticated(true);
    //setUser(userData);
    //setCurrentView("home");
    //setAuthView("login");
    navigate("/login");
  };

  const handleLogout = () => {
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Logout failed');
        }
        return response.json();
      })
      .then(() => {
        console.log('Logged out successfully');
        setIsAuthenticated(false);
        setUser(null);
        //setAuthView("login");
        navigate("/");
      })
      .catch((error: Error) => {
        console.error('Logout error:', error);

        //Still log out on frontend even if backend fails
        setIsAuthenticated(false);
        setUser(null);
        navigate("/");
      });
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar onLogout={handleLogout} onToggle={toggleSidebar} isOpen={isSidebarOpen} user={user} onNavigateToLogin={() => navigate("/login")} />

      <title>New Class Search</title>
      
      <div className="flex-1">

        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-3 bg-[#003366] text-white rounded-lg shadow-lg hover:bg-[#004080] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}


        <Routes>
          <Route path="/" element={<Home onGetStarted={() => navigate("/search")} />} />

          <Route
            path="/login"
            element={
              <Login
                onLogin={handleLogin}
                onNavigateToSignUp={() => navigate("/signup")}
              />
            }
          />

          <Route
            path="/signup"
            element={
              <SignUp
                onNavigateToLogin={() => navigate("/login")}
              />
            }
          />

          <Route
            path="/planner"
            element={
              isAuthenticated ? (
                <Planner onRemoveFromPlanner={handleRemoveFromPlanner} 
                         csrfToken = {csrfToken} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/search"
            element={
              <Search 
                isAuthenticated={isAuthenticated}
                role={role}
                plannedCourseIds={plannedCourseIds}
                handleAddToPlanner={handleAddToPlanner}
                onLoginPrompt={() => navigate("/login")}
              />
            }
          />

          <Route path="/programs" element={<Programs role={role} />} />
          <Route path="/settings" element={<Settings />} />

          <Route
            path="/admin"
            element={role === "Admin" ? <AdminDashboard /> : <Navigate to="/" replace />}
          />

          <Route path="/about" element={<AboutPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}