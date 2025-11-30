"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Music, Play, Pause } from "lucide-react";
import Link from "next/link";
import { useSubscriptions } from "@/context/SubscriptionContext";

const MOCK_REELS = [
    {
        id: 1,
        url: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4",
        creator: "cosmic_vibes",
        description: "Neon nights in the metaverse 🌃 #cyberpunk #ai",
        likes: "12.5K",
        comments: "842",
        music: "Original Audio - cosmic_vibes",
        isExclusive: false,
        isAI: true
    },
    {
        id: 2,
        url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-video-of-a-man-with-heads-like-a-fan-32649-large.mp4",
        creator: "digital_dreamer",
        description: "When the AI generates your dreams 🤯 #generativeart",
        likes: "8.2K",
        comments: "320",
        music: "Dreamscape - AI Generated",
        isExclusive: true,
        isAI: true
    },
    {
        id: 3,
        url: "https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-336-large.mp4",
        creator: "art_bot_9000",
        description: "Fluid dynamics simulation test v4.2 💧",
        likes: "25K",
        comments: "1.2K",
        music: "Flow State - Liquid DnB",
        isExclusive: false,
        isAI: false
    }
];

export default function ReelsPlayer() {
    const [currentReel, setCurrentReel] = useState(0);
    const [reels, setReels] = useState<any[]>(MOCK_REELS);
    const [isPlaying, setIsPlaying] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const { isSubscribed } = useSubscriptions();

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const res = await fetch("http://localhost:8000/reels");
                if (res.ok) {
                    const data = await res.json();
                    const dbReels = data.reels || [];

                    // Map DB format to UI format if needed, or just use as is
                    // DB has snake_case, UI might expect camelCase or just use snake_case
                    // Let's normalize to what the component expects
                    const formattedReels = dbReels.map((r: any) => ({
                        id: r.id,
                        url: r.url,
                        creator: r.creator_name,
                        creator_id: r.creator_id,
                        description: r.description,
                        likes: r.likes || "0",
                        comments: r.comments || "0",
                        music: "Original Audio",
                        isExclusive: r.is_exclusive,
                        isAI: r.is_ai
                    }));

                    setReels([...formattedReels, ...MOCK_REELS]);
                }
            } catch (e) {
                console.error("Error fetching reels:", e);
            }
        };

        fetchReels();
    }, []);

    useEffect(() => {
        // Auto-play/pause based on scroll
        videoRefs.current.forEach((video, index) => {
            if (video) {
                if (index === currentReel) {
                    video.currentTime = 0;
                    video.play().catch(() => setIsPlaying(false));
                    setIsPlaying(true);
                } else {
                    video.pause();
                }
            }
        });
    }, [currentReel, reels]);

    const handleScroll = () => {
        if (containerRef.current) {
            const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
            if (index !== currentReel) {
                setCurrentReel(index);
            }
        }
    };

    const togglePlay = (index: number) => {
        const video = videoRefs.current[index];
        if (video) {
            if (video.paused) {
                video.play();
                setIsPlaying(true);
            } else {
                video.pause();
                setIsPlaying(false);
            }
        }
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="h-[85vh] w-full max-w-md mx-auto bg-black rounded-xl overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative"
            style={{ scrollBehavior: "smooth" }}
        >
            {reels.map((reel, index) => (
                <div key={reel.id} className="h-full w-full snap-start relative flex items-center justify-center bg-gray-900">
                    {/* Video */}
                    <div
                        className="relative w-full h-full cursor-pointer"
                        onClick={() => togglePlay(index)}
                    >
                        <video
                            ref={el => { videoRefs.current[index] = el; }}
                            src={reel.url}
                            className="h-full w-full object-cover"
                            loop
                            muted={false} // Try unmuted, browser might block
                            playsInline
                        />

                        {/* Play/Pause Overlay */}
                        {!isPlaying && index === currentReel && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                <Play size={64} className="text-white/80" fill="white" />
                            </div>
                        )}
                    </div>

                    {/* Overlay UI */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 flex flex-col justify-end p-4 pointer-events-none">
                        <div className="pointer-events-auto">

                            {/* Exclusive Badge */}
                            {reel.isExclusive && (
                                <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    SUBSCRIBER ONLY
                                </div>
                            )}

                            {/* AI Badge */}
                            {reel.isAI && (
                                <div className="absolute top-4 left-4 bg-blue-600/80 text-white text-xs font-bold px-3 py-1 rounded-full border border-blue-400/50">
                                    🤖 AI GENERATED
                                </div>
                            )}

                            {/* Right Sidebar Actions */}
                            <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">
                                        <Heart size={28} className="text-white" />
                                    </div>
                                    <span className="text-xs font-bold">{reel.likes}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">
                                        <MessageCircle size={28} className="text-white" />
                                    </div>
                                    <span className="text-xs font-bold">{reel.comments}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="bg-gray-800 p-3 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">
                                        <Share2 size={28} className="text-white" />
                                    </div>
                                    <span className="text-xs font-bold">Share</span>
                                </div>
                            </div>

                            {/* Bottom Info */}
                            <div className="mb-4 pr-16">
                                <div className="flex items-center gap-2 mb-2">
                                    <Link href={`/profile/${reel.creator_id || reel.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
                                            {/* Use avatar if available, else initial */}
                                            {reel.creator_avatar ? (
                                                <img src={reel.creator_avatar} alt={reel.creator} className="w-full h-full object-cover" />
                                            ) : (
                                                reel.creator[0].toUpperCase()
                                            )}
                                        </div>
                                        <span className="font-bold text-lg">@{reel.creator}</span>
                                    </Link>

                                    {/* Subscribe Button */}
                                    {reel.creator_id && !isSubscribed(reel.creator_id) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent video toggle
                                                window.location.href = `/profile/${reel.creator_id}`;
                                            }}
                                            className="border border-white/50 px-3 py-1 rounded-full text-xs font-bold hover:bg-white hover:text-black transition-colors"
                                        >
                                            Subscribe
                                        </button>
                                    )}
                                    {reel.creator_id && isSubscribed(reel.creator_id) && (
                                        <span className="bg-green-600/80 px-2 py-0.5 rounded text-[10px] font-bold">
                                            Subscribed
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm mb-2">{reel.description}</p>
                                <div className="flex items-center gap-2 text-xs opacity-80">
                                    <Music size={14} />
                                    <span>{reel.music}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

