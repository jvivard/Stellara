import { Play } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ReelsSection() {
    const [reels, setReels] = useState<any[]>([]);

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const res = await fetch("http://localhost:8000/reels");
                if (res.ok) {
                    const data = await res.json();
                    // Take top 5 recent reels
                    setReels(data.reels.slice(0, 5));
                }
            } catch (e) {
                console.error("Error fetching reels:", e);
            }
        };

        fetchReels();
    }, []);

    if (reels.length === 0) {
        return null; // Don't show section if no reels
    }

    return (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Live & Reels</h2>
                <Link href="/reels" className="text-purple-500 hover:text-purple-400 text-sm font-semibold">View All</Link>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {reels.map((reel) => (
                    <Link key={reel.id} href={`/profile/${reel.creator_id}`} className="block min-w-[200px]">
                        <div className="h-[350px] bg-gray-800 rounded-2xl relative overflow-hidden group cursor-pointer border border-gray-700 hover:border-purple-500 transition-all">
                            <video
                                src={reel.url}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                muted
                                onMouseOver={(e) => e.currentTarget.play()}
                                onMouseOut={(e) => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none"></div>
                            <div className="absolute bottom-4 left-4 pointer-events-none">
                                <p className="text-white font-bold text-sm">{reel.creator_name}</p>
                                <p className="text-gray-400 text-xs">{reel.is_ai ? "AI Generated" : "Live Now"}</p>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Play size={20} className="text-white ml-1" />
                            </div>
                            {/* <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                LIVE
                            </div> */}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
