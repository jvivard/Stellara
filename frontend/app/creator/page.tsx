"use client";

import Sidebar from "@/components/Sidebar";
import dynamic from "next/dynamic";
import { Search, Bell, Settings } from "lucide-react";

const WalletConnect = dynamic(() => import("@/components/WalletConnect"), { ssr: false });
const CreatorDashboard = dynamic(() => import("@/components/CreatorDashboard"), { ssr: false });

export default function CreatorPage() {
    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <div className="flex-1 max-w-xl">
                        <h1 className="text-3xl font-bold">Creator Studio</h1>
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

                {/* Dashboard Module */}
                <section className="mb-12">
                    <CreatorDashboard />
                </section>

            </main>
        </div>
    );
}
