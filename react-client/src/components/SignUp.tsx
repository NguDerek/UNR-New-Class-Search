import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import UNR_Logo from "../assets/UNR_Logo.svg"

interface SignUpProps {
  onSignUp: () => void;
  onNavigateToLogin: () => void;
}

export function SignUp({ onSignUp, onNavigateToLogin }: SignUpProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Mock account creation - in a real app, this would call an API
    onSignUp();
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

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-[#003366] mb-6 text-center">Create Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@nevada.unr.edu"
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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              Create Account
            </Button>
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

          {/* Back to Login */}
          <div className="text-center">
            <p className="text-slate-600 mb-3">Already have an account?</p>
            <Button
              type="button"
              onClick={onNavigateToLogin}
              variant="outline"
              className="w-full h-11 border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white rounded-lg transition-colors"
            >
              Sign In
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