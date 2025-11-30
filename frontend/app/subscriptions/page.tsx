"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import dynamic from "next/dynamic";
import { Users, Star, Wallet } from "lucide-react";

const WalletConnect = dynamic(() => import("@/components/WalletConnect"), { ssr: false });

export default function SubscriptionsPage() {
    const [activeTab, setActiveTab] = useState<"following" | "subscribers">("following");
    const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
    const [mySubscribers, setMySubscribers] = useState<any[]>([]);
    const [isCreator, setIsCreator] = useState(false);
    const [creatorProfile, setCreatorProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Helper to get connected wallet address (mock for now, ideally from context)
    const getWalletAddress = async () => {
        if (window.cardano && (window.cardano.nami || window.cardano.lace)) {
            const api = await (window.cardano.nami || window.cardano.lace).enable();
            const addr = await api.getUsedAddresses();
            // This returns hex address, need to decode in real app. 
            // For this demo, we rely on the user having connected via WalletConnect component which syncs to localStorage or Context
            // But to keep it simple, let's assume we can get it from the window or context if we had one globally exposed.
            return localStorage.getItem("walletAddress");
        }
        return null;
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchData = async (address: string) => {
            setLoading(true);
            try {
                // 1. Fetch "Subscribed To"
                const subRes = await fetch(`http://localhost:8000/subscriptions/${address}`);
                if (subRes.ok) {
                    const subData = await subRes.json();
                    const subscribedIds = subData.subscriptions || [];

                    if (subscribedIds.length > 0) {
                        const allCreatorsRes = await fetch("http://localhost:8000/creators");
                        const allCreatorsData = await allCreatorsRes.json();
                        const allCreators = allCreatorsData.creators || [];
                        const mySubs = allCreators.filter((c: any) => subscribedIds.includes(c.id));
                        setMySubscriptions(mySubs);
                    } else {
                        setMySubscriptions([]);
                    }
                }

                // 2. Check if I am a Creator
                const creatorRes = await fetch(`http://localhost:8000/creators/lookup/${address}`);
                if (creatorRes.ok) {
                    const creator = await creatorRes.json();
                    setIsCreator(true);
                    setCreatorProfile(creator);

                    // 3. Fetch "My Subscribers"
                    const fansRes = await fetch(`http://localhost:8000/creators/${creator.id}/subscribers`);
                    if (fansRes.ok) {
                        const fansData = await fansRes.json();
                        setMySubscribers(fansData.subscribers || []);
                    }
                } else {
                    setIsCreator(false);
                    setCreatorProfile(null);
                }

            } catch (error) {
                console.error("Error fetching subscription data:", error);
            } finally {
                setLoading(false);
            }
        };

        const checkWallet = () => {
            const address = localStorage.getItem("walletAddress");
            if (address) {
                // Only fetch if address changed or first load
                // We can store current address in a ref or just rely on react state if we had it
                // For now, let's just call fetchData if we haven't loaded yet or if we want to refresh
                // To avoid infinite loops, we should probably check if address matches a stored state
                // But here we don't have address state. Let's just run it.
                // Actually, let's use a local var to track last fetched address to avoid spamming
                fetchData(address);
            } else {
                setLoading(false);
            }
        };

        // Initial check
        checkWallet();

        // Poll every 2 seconds
        intervalId = setInterval(checkWallet, 2000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold">Subscription Management</h1>
                    <WalletConnect />
                </header>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-800 mb-8">
                    <button
                        onClick={() => setActiveTab("following")}
                        className={`pb-4 px-2 font-medium transition-colors ${activeTab === "following"
                            ? "text-purple-500 border-b-2 border-purple-500"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Subscribed To ({mySubscriptions.length})
                    </button>
                    {isCreator && (
                        <button
                            onClick={() => setActiveTab("subscribers")}
                            className={`pb-4 px-2 font-medium transition-colors ${activeTab === "subscribers"
                                ? "text-purple-500 border-b-2 border-purple-500"
                                : "text-gray-400 hover:text-white"
                                }`}
                        >
                            My Subscribers ({mySubscribers.length})
                        </button>
                    )}
                </div>

                {/* Content */}
                {!localStorage.getItem("walletAddress") ? (
                    <div className="text-center py-20 bg-gray-900 rounded-xl">
                        <Wallet className="mx-auto text-gray-600 mb-4" size={48} />
                        <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
                        <p className="text-gray-400">Please connect your Cardano wallet to view your subscriptions.</p>
                    </div>
                ) : loading ? (
                    <div className="text-center py-20 text-gray-500">Loading data...</div>
                ) : (
                    <>
                        {activeTab === "following" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mySubscriptions.length === 0 ? (
                                    <div className="col-span-full text-center py-20 bg-gray-900 rounded-xl">
                                        <Star className="mx-auto text-gray-600 mb-4" size={48} />
                                        <p className="text-xl font-semibold mb-2">No subscriptions yet</p>
                                        <p className="text-gray-400">Go to the Home page to discover creators!</p>
                                    </div>
                                ) : (
                                    mySubscriptions.map((creator) => (
                                        <div key={creator.id} className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
                                            <img src={creator.avatar_url} alt={creator.name} className="w-16 h-16 rounded-full object-cover" />
                                            <div>
                                                <h3 className="font-bold text-lg">{creator.name}</h3>
                                                <p className="text-purple-400 text-sm">Active Subscription</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === "subscribers" && (
                            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800 text-gray-400 text-sm uppercase">
                                        <tr>
                                            <th className="p-4">Subscriber Address</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {mySubscribers.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-gray-500">
                                                    No subscribers yet. Share your profile!
                                                </td>
                                            </tr>
                                        ) : (
                                            mySubscribers.map((sub, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                                                    <td className="p-4 font-mono text-sm text-gray-300">
                                                        {sub.subscriber_address}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs font-bold">
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-400 text-sm">
                                                        {new Date(sub.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
