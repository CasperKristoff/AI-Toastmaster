"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If user is already logged in, redirect to ProfilePage
  if (user) {
    router.push('/ProfilePage');
    return null;
  }

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-deep-sea">Loading...</div>
      </div>
    );
  }

  const handleLoginSuccess = (user: any) => {
    router.push('/ProfilePage');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10 flex items-center justify-center">
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
  );
} 