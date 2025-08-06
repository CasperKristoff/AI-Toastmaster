"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-sea/5 via-white to-kimchi/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-deep-sea/10 to-kimchi/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-dark-royalty/10 to-deep-sea/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navbar */}
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
            onClick={() => router.push("/login")}
          >
            AI Toastmaster
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            title="Log in"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-6 py-12">
        {/* Content Card */}
        <div
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-gray-200/50 hover:shadow-3xl hover:scale-105 hover:bg-white/90 transition-all duration-500 max-w-2xl cursor-pointer group"
          onClick={() => router.push("/login")}
        >
          <div className="space-y-6">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight group-hover:from-indigo-700 group-hover:to-purple-700 transition-all duration-300">
              AI Toastmaster – Your Smart Sidekick for Events creation
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed font-medium group-hover:text-gray-800 transition-colors duration-300">
              Plan, host, and entertain with AI-generated content, games, and
              real-time event flow.
            </p>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-full group-hover:from-indigo-100 group-hover:to-purple-100 transition-all duration-300">
                <div className="w-2 h-2 bg-indigo-500 rounded-full group-hover:bg-indigo-600 transition-colors duration-300"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                  AI-Generated Content
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-full group-hover:from-purple-100 group-hover:to-pink-100 transition-all duration-300">
                <div className="w-2 h-2 bg-purple-500 rounded-full group-hover:bg-purple-600 transition-colors duration-300"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                  Interactive Games
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-pink-50 to-red-50 px-4 py-2 rounded-full group-hover:from-pink-100 group-hover:to-red-100 transition-all duration-300">
                <div className="w-2 h-2 bg-pink-500 rounded-full group-hover:bg-pink-600 transition-colors duration-300"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                  Real-time Flow
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-12 animate-bounce-slow">
          <button
            onClick={() => router.push("/login")}
            className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            Create Your First Event →
          </button>
        </div>
      </main>
    </div>
  );
}
