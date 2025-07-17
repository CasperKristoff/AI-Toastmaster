"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-deep-sea/10 via-white to-kimchi/10">
      <header className="mb-12">
        <h1 className="text-5xl font-bold text-dark-royalty mb-4">AI Toastmaster</h1>
      </header>
      <main className="text-center max-w-3xl px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-dark-royalty/20">
          <p className="text-lg text-deep-sea/90 mb-6 leading-relaxed">
            AI Toastmaster is a digital event companion designed to help organizers plan and execute unforgettable events using the power of generative AI. The platform supports everything from initial planning (guest list, tone, and event type) to real-time guidance during the event itself. It generates customized toasts, programs, games, and speech content based on user inputs, ensuring a smooth, entertaining, and personalized experience for guests.
          </p>
          <p className="text-lg text-deep-sea/90 mb-8 leading-relaxed">
            Whether you're planning a wedding, birthday, corporate party, or surprise celebration, AI Toastmaster uses structured data, tone presets, and contextual guest profiles to build a unique flow for each event. During the event, the app transitions into a live mode—presenting content, leading activities, and acting as a virtual MC to guide the host and guests through each segment of the evening.
          </p>
          <button
            onClick={() => router.push("/ProfilePage")}
            className="px-8 py-4 bg-dark-royalty text-white rounded-xl text-xl font-semibold hover:bg-dark-royalty/90 transition-all duration-300 shadow-lg hover:scale-105"
          >
            Login
          </button>
        </div>
      </main>
    </div>
  );
}
