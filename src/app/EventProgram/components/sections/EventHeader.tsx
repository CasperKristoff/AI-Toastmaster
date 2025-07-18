"use client";

import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { useRef, useState, useEffect } from "react";

interface EventHeaderProps {
  user: { uid: string; email: string | null } | null;
}

export default function EventHeader({ user }: EventHeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-dark-royalty/10 px-6 py-4 relative">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/ProfilePage')}
            className="text-2xl font-bold text-dark-royalty hover:text-deep-sea transition-colors duration-300 cursor-pointer"
          >
            AI Toastmaster
          </button>
        </div>
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="w-10 h-10 bg-gradient-to-br from-dark-royalty to-deep-sea rounded-full flex items-center justify-center text-white font-semibold hover:scale-110 transition-all duration-300 shadow-lg"
            title="Profile"
          >
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-dark-royalty/10 z-50">
              <button
                onClick={async () => {
                  setShowDropdown(false);
                  const auth = getAuth();
                  await signOut(auth);
                  router.push("/");
                }}
                className="w-full text-left px-4 py-3 text-dark-royalty hover:bg-deep-sea/10 rounded-xl transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 