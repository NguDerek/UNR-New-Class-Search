import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import UNR_Logo from "../assets/UNR_Logo.svg"

interface LoginProps {
  onLogin: () => void;
  onNavigateToSignUp: () => void;
}

export function Login({ onLogin, onNavigateToSignUp }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/api/csrf-token', {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setCsrfToken(data.csrf_token))
      .catch(error => console.error('Failed to fetch CSRF token:', error));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || 'Login failed');
          });
        }
        return response.json();
      })
      .then((data) => {
        onLogin();
      })
      .catch((error: Error) => {
        setError(error.message || 'Login failed');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#003366] via-[#004080] to-[#003366] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#003366] shadow-lg mb-6 border-4 border-white">
            {/* UNR Logo */}
            <img 
            src={UNR_Logo} 
            alt="UNR Logo" 
            className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-white mb-2">University of Nevada, Reno</h1>
          <p className="text-blue-200">Course Search & Planning</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-[#003366] mb-6 text-center">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@unr.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#003366] hover:bg-[#004080] text-white rounded-lg transition-colors"
            >
              Sign In
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="text-sm text-[#003366] hover:text-[#004080] hover:underline transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">or</span>
            </div>
          </div>

          {/* Create Account */}
          <div className="text-center">
            <p className="text-slate-600 mb-3">Don't have an account?</p>
            <Button
              type="button"
              onClick={onNavigateToSignUp}
              variant="outline"
              className="w-full h-11 border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white rounded-lg transition-colors"
            >
              Create Account
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200 text-sm mt-6">
          © 2025 University of Nevada, Reno
        </p>
      </div>
    </div>
  );
}