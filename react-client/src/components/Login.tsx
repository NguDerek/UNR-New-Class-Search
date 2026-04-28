import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import UNR_Logo from "../assets/UNR_Logo.svg"

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface LoginProps {
  onLogin: (userData: User) => void;
  onNavigateToSignUp: () => void;
}

type ForgotStep = "idle" | "email" | "code" | "newpassword" | "done";

export function Login({ onLogin, onNavigateToSignUp }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  const [forgotStep, setForgotStep] = useState<ForgotStep>("idle");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    fetch('/api/csrf-token', {
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

    fetch('/api/login', {
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
        onLogin(data.user);
      })
      .catch((error: Error) => {
        setError(error.message || 'Login failed');
      });
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail.includes("@")) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');

      setForgotStep("code");
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (forgotCode.length < 6) {
      setForgotError("Please enter the full 6-digit code");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/verify-reset-code', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ email: forgotEmail, code: forgotCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      setForgotStep("newpassword");
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          email: forgotEmail,
          code: forgotCode,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setForgotStep("done");
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setForgotStep("idle");
    setForgotEmail("");
    setForgotCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
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

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Forget Form - Email */}
          {forgotStep === "email" && (
            <>
              <h2 className="text-[#003366] mb-2 text-center">Reset Password</h2>
              <p className="text-slate-500 text-sm text-center mb-6">
                Enter your email and we'll send you a 6-digit code.
              </p>
              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-700">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="student@unr.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{forgotError}</p>
                  </div>
                )}
                <Button type="submit" disabled={forgotLoading}
                  className="w-full h-11 bg-[#003366] hover:bg-[#004080] text-white rounded-lg">
                  {forgotLoading ? "Sending..." : "Send Code"}
                </Button>
                <button
                type="button"
                onClick={resetForgotFlow}
                className="w-full h-11 border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white rounded-lg transition-colors text-sm font-medium"
              >
                Back to Login
              </button>
              </form>
            </>
          )}

          {/* Forget Form - Code */}
          {forgotStep === "code" && (
            <div className="text-center space-y-4">
              <div className="text-5xl">✉</div>
              <h2 className="text-[#003366]">Check your email</h2>
              <p className="text-slate-600">
                We sent a verification code to <strong>{forgotEmail}</strong>
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="reset-code" className="text-slate-700">
                    Verification Code
                  </Label>
                  <Input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/, ""))}
                    className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>

                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{forgotError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-11 bg-[#003366] hover:bg-[#004080] text-white rounded-lg transition-colors"
                >
                  {forgotLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>

              <button
                type="button"
                onClick={handleSendCode}
                className="text-sm text-[#003366] underline"
              >
                Resend code
              </button>

              <button
                type="button"
                onClick={resetForgotFlow}
                className="w-full h-11 border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white rounded-lg transition-colors text-sm font-medium"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Forget Form - New Password */}
          {forgotStep === "newpassword" && (
            <>
              <h2 className="text-[#003366] mb-2 text-center">New Password</h2>
              <p className="text-slate-500 text-sm text-center mb-6">
                Choose a new password for your account.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-700">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-700">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 bg-slate-50 border-slate-200 focus:border-[#003366] focus:ring-[#003366]"
                  />
                </div>
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{forgotError}</p>
                  </div>
                )}
                <Button type="submit" disabled={forgotLoading}
                  className="w-full h-11 bg-[#003366] hover:bg-[#004080] text-white rounded-lg">
                  {forgotLoading ? "Saving..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}

          {/* Forget Form - Changed Password */}
          {forgotStep === "done" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-[#003366]">Password Reset!</h2>
              <p className="text-slate-500 text-sm">
                Your password has been updated. You can now sign in.
              </p>
              <Button onClick={resetForgotFlow}
                className="w-full h-11 bg-[#003366] hover:bg-[#004080] text-white rounded-lg">
                Back to Sign In
              </Button>
            </div>
          )}

          {/* Login Form*/}
          {forgotStep === "idle" && (
            <>
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
                    onClick={() => setForgotStep("email")}
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
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200 text-sm mt-6">
          © 2025 University of Nevada, Reno
        </p>
      </div>
    </div>
  );
}