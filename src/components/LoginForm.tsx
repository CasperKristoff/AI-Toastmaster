"use client";

import { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import app from "../constants/firebaseConfig";

interface LoginFormProps {
  onLoginSuccess?: (user: unknown) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    const auth = getAuth(app);
    try {
      if (isSignupMode) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        // Update the user's display name with the full name
        if (fullName.trim()) {
          await updateProfile(userCredential.user, {
            displayName: fullName.trim(),
          });
        }
        setSuccess("Signup successful! You can now log in.");
        if (onLoginSuccess) onLoginSuccess(userCredential.user);
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        if (onLoginSuccess) onLoginSuccess(userCredential.user);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isSignupMode
            ? "Signup failed"
            : "Login failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  return (
    <div className="relative">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-deep-sea/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-kimchi/5 rounded-full blur-3xl"></div>
          {/* Main content */}
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-md ring-1 ring-black/5 p-8 sm:p-12">
            <div className="text-center space-y-8">
              {/* Header section */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-poppins font-bold bg-gradient-to-r from-dark-royalty to-deep-sea bg-clip-text text-transparent pb-1">
                  {isSignupMode ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-lg text-deep-sea/80 font-poppins">
                  {isSignupMode
                    ? "Sign up to access AI Toastmaster"
                    : "Sign in to access AI Toastmaster"}
                </p>
              </div>
              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {isSignupMode && (
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-deep-sea mb-2"
                      >
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isSignupMode}
                        className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your full name"
                      />
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-deep-sea mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-deep-sea mb-2"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-dark-royalty/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-600 text-sm">{success}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full group relative bg-gradient-to-r from-dark-royalty/100 to-dark-royalty/75 text-white px-8 py-4 rounded-xl font-poppins text-lg font-medium tracking-wide shadow-lg shadow-deep-sea/20 hover:shadow-md hover:shadow-deep-sea/25 transition-all duration-300 ease-out hover:-translate-y-[1px] disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  <span className="relative z-10">
                    {isLoading
                      ? isSignupMode
                        ? "Signing Up..."
                        : "Signing In..."
                      : isSignupMode
                        ? "Sign Up"
                        : "Sign In"}
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dark-royalty/80 to-dark-royalty opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"></div>
                </button>
              </form>

              {/* Toggle between login and signup */}
              <div className="text-center">
                <p className="text-deep-sea/70 text-sm">
                  {isSignupMode
                    ? "Already have an account?"
                    : "Don't have an account?"}
                  <button
                    onClick={toggleMode}
                    className="ml-2 text-dark-royalty hover:text-deep-sea font-medium transition-colors duration-300"
                  >
                    {isSignupMode ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
