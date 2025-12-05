import { Card, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { User, Bell, Palette, SlidersHorizontal, LogOut } from "lucide-react";
import { Button } from "./ui/Button";
import { useState, useEffect } from "react";

interface SettingsProps {
  onLogout?: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const [csrfToken, setCsrfToken] = useState("");

  //Fetch CSRF token
  useEffect(() => {
    fetch('http://localhost:5000/api/csrf-token', {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setCsrfToken(data.csrf_token))
      .catch(error => console.error('Failed to fetch CSRF token:', error));
  }, []);

  const handleLogout = () => {
    fetch('http://localhost:5000/api/logout', {
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
        if (onLogout) {
          onLogout();
        }
      })
      .catch((error: Error) => {
        console.error('Logout error:', error);
        if (onLogout) {
          onLogout();
        }
      });
  };

  const settingsCards = [
    {
      title: "Account",
      description: "Manage your account information and preferences",
      icon: User,
    },
    {
      title: "Notifications",
      description: "Control how and when you receive notifications",
      icon: Bell,
    },
    {
      title: "Display / Theme",
      description: "Customize the appearance of your interface",
      icon: Palette,
    },
    {
      title: "Other Preferences",
      description: "Additional settings and options",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
      {/* Page Title Section */}
      <div className="mb-8 lg:mb-12">
        <h1 className="text-[#003366] mb-2">Settings</h1>
        <p className="text-slate-600">Manage your preferences and account options</p>
      </div>

      {/* Settings Cards */}
      <div className="space-y-6">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-[#003366]">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}

        {/* Logout Button */}
        {onLogout && (
          <Card className="border-red-200 shadow-sm bg-red-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-red-700">Sign Out</CardTitle>
                    <CardDescription>Sign out of your account</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sign Out
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}