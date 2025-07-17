"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/ProfilePage');
    }
  }, [user, loading, router]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-deep-sea">Loading...</div>
      </div>
    );
  }

  // Don't render login form if user is already logged in
  if (user) {
    return null;
  }

  const handleLoginSuccess = () => {
    router.push('/ProfilePage');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 flex items-center justify-center">
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
  );
} 