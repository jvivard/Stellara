"use client";

import Sidebar from "@/components/Sidebar";
import dynamic from "next/dynamic";
import { Video } from "lucide-react";

const WalletConnect = dynamic(() => import("@/components/WalletConnect"), { ssr: false });
const ReelsPlayer = dynamic(() => import("@/components/ReelsPlayer"), { ssr: false });

export default function ReelsPage() {
    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar />

            <main className="flex-1 ml-64 p-8 flex flex-col items-center">
                {/* Header */}
                <header className="w-full flex justify-between items-center mb-8 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <Video className="text-purple-500" size={32} />
                        <h1 className="text-3xl font-bold">Explore Reels</h1>
                    </div>
                    <WalletConnect />
                </header>

                {/* Reels Feed */}
                <section className="w-full flex justify-center">
                    <ReelsPlayer />
                </section>

            </main>
        </div>
    );
}
