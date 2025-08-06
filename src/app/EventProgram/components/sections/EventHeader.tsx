"use client";

import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <nav className="relative z-10 w-full backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center relative">
        <Image
          src="/ToastmasterImage.png"
          alt="AI Toastmaster"
          width={60}
          height={60}
          className="mr-3 hover:scale-110 transition-transform duration-200"
        />
        <span
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200 hover:from-indigo-700 hover:to-purple-700"
          onClick={() => router.push("/ProfilePage")}
        >
          AI Toastmaster
        </span>
      </div>
      <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
          title="Profile"
        >
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 z-50">
            <button
              onClick={async () => {
                setShowDropdown(false);
                const auth = getAuth();
                await signOut(auth);
                router.push("/");
              }}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
