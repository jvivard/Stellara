"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import { Search, Bell, Settings } from "lucide-react";

const WalletConnect = dynamic(() => import("@/components/WalletConnect"), { ssr: false });
const PersonaCard = dynamic(() => import("@/components/PersonaCard"), { ssr: false });
const ReelsSection = dynamic(() => import("@/components/ReelsSection"), { ssr: false });

export default function Home() {
  const [creators, setCreators] = useState<any[]>([]);

  const fetchCreators = () => {
    fetch("http://localhost:8000/creators")
      .then(res => res.json())
      .then(data => setCreators(data.creators || []))
      .catch(err => console.error("Failed to fetch creators:", err));
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search AI personas..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <WalletConnect />
            <button className="text-gray-400 hover:text-white">
              <Bell size={24} />
            </button>
            <button className="text-gray-400 hover:text-white">
              <Settings size={24} />
            </button>
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
              SA
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">
            Discover AI <span className="text-gray-500">Personas</span>
          </h1>
          <p className="text-gray-400">Explore and subscribe to the most captivating AI personalities</p>
        </div>

        <ReelsSection />

        {/* Creators Grid */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
            Trending Creators
          </h3>

          {creators.length === 0 ? (
            <div className="text-center py-10 bg-gray-800 rounded-lg">
              <p className="text-gray-400 mb-4">No creators found yet.</p>
              <p className="text-sm">Go to the Creator Studio to create the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <PersonaCard
                  key={creator.id}
                  id={creator.id}
                  name={creator.name}
                  role="AI Creator"
                  description={creator.description}
                  imageUrl={creator.avatar_url}
                  price={creator.subscription_price}
                  creatorAddress={creator.wallet_address}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
