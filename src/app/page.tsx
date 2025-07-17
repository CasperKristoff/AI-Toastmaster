"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10">
      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-xl border-b border-dark-royalty/10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-dark-royalty cursor-pointer" onClick={() => router.push('/')}>AI Toastmaster</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-dark-royalty text-white rounded-xl text-lg font-semibold hover:bg-dark-royalty/90 transition-all duration-300 shadow hover:scale-105 focus:outline-none"
            title="Log in"
          >
            Log in
          </button>
        </div>
      </nav>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto px-6">
        {/* Hero Image */}
        <div className="mb-8">
          <img 
            src="/ToastmasterImage.png" 
            alt="AI Toastmaster" 
            className="max-w-full h-auto rounded-2xl shadow-lg"
            style={{ maxHeight: '400px' }}
          />
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-dark-royalty/20 mt-12">
          <p className="text-lg text-deep-sea/90 mb-6 leading-relaxed">
            AI Toastmaster is a digital event companion designed to help organizers plan and execute unforgettable events using the power of generative AI. The platform supports everything from initial planning (guest list, tone, and event type) to real-time guidance during the event itself. It generates customized toasts, programs, games, and speech content based on user inputs, ensuring a smooth, entertaining, and personalized experience for guests.
          </p>
          <p className="text-lg text-deep-sea/90 leading-relaxed">
            Whether you&apos;re planning a wedding, birthday, corporate party, or surprise celebration, AI Toastmaster uses structured data, tone presets, and contextual guest profiles to build a unique flow for each event. During the event, the app transitions into a live mode—presenting content, leading activities, and acting as a virtual MC to guide the host and guests through each segment of the evening.
          </p>
        </div>
      </main>
    </div>
  );
}
