import { Home, Users, Heart, Play, CreditCard, ShoppingBag, Settings, User, Video } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
    return (
        <div className="w-64 bg-gray-900 h-screen p-6 flex flex-col border-r border-gray-800 fixed left-0 top-0">
            <div className="flex items-center gap-2 mb-10">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">S</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wider">STELLARA</h1>
            </div>

            <div className="space-y-8 flex-1">
                <div>
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">General</h3>
                    <nav className="space-y-2">
                        <Link href="/" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                            <Home size={20} />
                            <span>Home</span>
                        </Link>
                        <Link href="/" className="flex items-center gap-3 text-white bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                            <Users size={20} />
                            <span>AI Influencers</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                            <Heart size={20} />
                            <span>Favorites</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                            <Play size={20} />
                            <span>Live</span>
                        </Link>
                    </nav>
                </div>

                <div>
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">Premium</h3>
                    <nav className="space-y-2">
                        <Link href="/subscriptions" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                            <CreditCard size={20} />
                            <span>Subscriptions</span>
                        </Link>
                        <Link href="/reels" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                            <Video size={20} />
                            <span>Reels</span>
                        </Link>
                        <Link href="/creator" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">
                            <ShoppingBag size={20} />
                            <span>Creator Studio</span>
                        </Link>
                    </nav>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-800">
                <div className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">User Account</p>
                        <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                    <Settings size={16} />
                </div>
            </div>
        </div>
    );
}
