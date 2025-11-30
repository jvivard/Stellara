"use client";

import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import dynamic from "next/dynamic";
import { Heart, Share2, MessageCircle, ShieldCheck, Play, Lock, Unlock } from "lucide-react";
import { useState, useEffect } from "react";
import { useSubscriptions } from "@/context/SubscriptionContext";
import type { Script } from "lucid-cardano";
import plutus from "../../../utils/plutus.json";

const WalletConnect = dynamic(() => import("@/components/WalletConnect"), { ssr: false });

export default function ProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const [activeTab, setActiveTab] = useState("reels");
    const { isSubscribed, addSubscription } = useSubscriptions();

    const [influencer, setInfluencer] = useState<any>(null);
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const subscribed = influencer ? isSubscribed(influencer.id) : false;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Creator Profile
                const profileRes = await fetch(`http://localhost:8000/creators/${id}`);
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setInfluencer({
                        ...profileData,
                        image: profileData.avatar_url, // Map avatar_url to image
                        price: profileData.subscription_price / 1000000 // Convert Lovelace to ADA
                    });
                }

                // 2. Fetch Reels
                const reelsRes = await fetch("http://localhost:8000/reels");
                if (reelsRes.ok) {
                    const reelsData = await reelsRes.json();
                    // Filter for this creator
                    const creatorReels = reelsData.reels.filter((r: any) => r.creator_id === id);
                    setReels(creatorReels);
                }
            } catch (e) {
                console.error("Error fetching profile data:", e);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const handleSubscribe = async () => {
        setProcessing(true);
        try {
            if (!window.cardano) {
                alert("Cardano wallet not found! Please install Nami or Lace.");
                setProcessing(false);
                return;
            }

            const walletProvider = window.cardano.nami || window.cardano.lace;
            if (!walletProvider) {
                alert("Please install Nami or Lace wallet to subscribe.");
                setProcessing(false);
                return;
            }

            const { Lucid, Blockfrost, Data, Constr } = await import("lucid-cardano");
            const apiKey = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY;
            if (!apiKey) {
                alert("API Key missing");
                setProcessing(false);
                return;
            }

            const lucid = await Lucid.new(
                new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", apiKey),
                "Preprod"
            );
            const api = await walletProvider.enable();
            lucid.selectWallet(api);

            const validator: Script = {
                type: "PlutusV2",
                script: plutus.validators[0].compiledCode,
            };
            const scriptAddress = lucid.utils.validatorToAddress(validator);

            const subscriberAddress = await lucid.wallet.address();
            const subscriberDetails = lucid.utils.getAddressDetails(subscriberAddress);
            const subscriberPKH = subscriberDetails.paymentCredential?.hash;

            if (!subscriberPKH) throw new Error("Could not get subscriber PKH");

            const creatorDetails = lucid.utils.getAddressDetails(influencer.wallet_address);
            const creatorPKH = creatorDetails.paymentCredential?.hash;

            if (!creatorPKH) throw new Error("Could not get creator PKH");

            // Price in Lovelace (from DB it is in Lovelace)
            const priceLovelace = BigInt(influencer.subscription_price);
            const period = 30; // Default 30 days

            const datum = Data.to(new Constr(0, [
                subscriberPKH,
                creatorPKH,
                priceLovelace,
                BigInt(86400000 * period),
                BigInt(Date.now() + 86400000 * period)
            ]));

            const tx = await lucid
                .newTx()
                .payToContract(scriptAddress, { inline: datum }, { lovelace: priceLovelace })
                .complete();

            const signedTx = await tx.sign().complete();
            const txHash = await signedTx.submit();

            console.log("Subscription TX:", txHash);
            alert(`Subscription successful! TX: ${txHash}`);

            // Notify backend agent
            await fetch("http://localhost:8000/notify_subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscriber: subscriberAddress,
                    tier: "basic",
                    tx_hash: txHash,
                    creator_id: influencer.id
                })
            });

            // Update local state
            addSubscription(influencer.id);

        } catch (e) {
            console.error("Subscription error:", e);
            alert("Subscription failed. See console for details.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex min-h-screen bg-black text-white items-center justify-center">Loading Profile...</div>;
    }

    if (!influencer) {
        return <div className="flex min-h-screen bg-black text-white items-center justify-center">Influencer not found</div>;
    }

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar />

            <main className="flex-1 ml-64">
                {/* Cover Image */}
                <div className="h-64 w-full relative">
                    <img
                        src={influencer.image}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                </div>

                <div className="px-8 -mt-20 relative z-10">
                    {/* Profile Header */}
                    <div className="flex justify-between items-end mb-8">
                        <div className="flex items-end gap-6">
                            <div className="w-40 h-40 rounded-full border-4 border-black overflow-hidden bg-gray-800">
                                <img src={influencer.image} alt={influencer.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-3xl font-bold">{influencer.name}</h1>
                                    <ShieldCheck className="text-blue-400" size={24} />
                                </div>
                                <p className="text-gray-400">{influencer.description}</p>
                                <div className="flex gap-4 mt-2 text-sm text-gray-300">
                                    <span><strong className="text-white">0</strong> Subscribers</span>
                                    <span><strong className="text-white">0</strong> Likes</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mb-4">
                            <button className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                                <Share2 size={20} />
                            </button>
                            <button className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                                <MessageCircle size={20} />
                            </button>
                            <button
                                onClick={handleSubscribe}
                                disabled={processing || subscribed}
                                className={`px-6 py-3 font-bold rounded-full transition-colors ${subscribed
                                    ? "bg-green-600 text-white cursor-default"
                                    : "bg-white text-black hover:bg-gray-200"
                                    }`}
                            >
                                {processing ? "Processing..." : subscribed ? "Subscribed" : `Subscribe (${influencer.price} ADA)`}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-8 border-b border-gray-800 mb-8">
                        {["reels", "exclusive", "about"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === tab ? "border-purple-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {activeTab === "reels" && (
                        <div className="grid grid-cols-3 gap-4">
                            {reels.length > 0 ? (
                                reels.map((reel) => (
                                    <div key={reel.id} className="aspect-[9/16] bg-gray-900 rounded-xl relative group cursor-pointer overflow-hidden border border-gray-800 hover:border-purple-500 transition-all">
                                        <video
                                            src={reel.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            onMouseOver={(e) => e.currentTarget.play()}
                                            onMouseOut={(e) => {
                                                e.currentTarget.pause();
                                                e.currentTarget.currentTime = 0;
                                            }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
                                            <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={48} />
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                                            <p className="text-sm font-bold truncate">{reel.description || "Untitled Reel"}</p>
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>{reel.is_ai ? "🤖 AI" : "📹 Real"}</span>
                                                <span>{new Date(reel.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-3 text-center py-10 text-gray-500">
                                    No reels uploaded yet.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "exclusive" && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Mock exclusive content for now, or filter reels by is_exclusive */}
                            <div className="col-span-2 text-center py-10 text-gray-500">
                                No exclusive content yet.
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
