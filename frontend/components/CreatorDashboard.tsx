"use client";

import { useState, useEffect } from "react";
import { Settings, Layout, Upload, Users, DollarSign, Trash2 } from "lucide-react";

export default function CreatorDashboard({ onProfileCreated }: { onProfileCreated?: () => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("10000000"); // 10 ADA
    const [walletAddress, setWalletAddress] = useState("");
    const [status, setStatus] = useState("");
    const [existingProfile, setExistingProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"canvas" | "settings">("canvas");
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [myReels, setMyReels] = useState<any[]>([]);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadDesc, setUploadDesc] = useState("");
    const [isExclusive, setIsExclusive] = useState(false);
    const [isAI, setIsAI] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch reels helper
    const fetchMyReels = async () => {
        if (!existingProfile) return;
        try {
            const res = await fetch("http://localhost:8000/reels");
            if (res.ok) {
                const data = await res.json();
                // Filter for this creator
                const userReels = data.reels.filter((r: any) => r.creator_id === existingProfile.id);
                setMyReels(userReels);
            }
        } catch (e) {
            console.error("Error fetching reels:", e);
        }
    };

    // Check for existing profile on mount and poll for wallet
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkProfile = async (address: string) => {
            setWalletAddress(address);
            try {
                const res = await fetch(`http://localhost:8000/creators/lookup/${address}`);
                if (res.ok) {
                    const profile = await res.json();
                    setExistingProfile(profile);
                    setName(profile.name);
                    setDescription(profile.description);
                    setPrice(profile.subscription_price.toString());
                    setActiveTab("canvas");

                    // Fetch Subscribers Count
                    const subRes = await fetch(`http://localhost:8000/creators/${profile.id}/subscribers`);
                    if (subRes.ok) {
                        const subData = await subRes.json();
                        setSubscriberCount(subData.subscribers.length);
                    }
                } else {
                    setActiveTab("settings");
                }
            } catch (e) {
                console.error("Error checking profile:", e);
                setActiveTab("settings");
            }
            setIsLoading(false);
        };

        const checkWallet = () => {
            const address = localStorage.getItem("walletAddress");
            if (address && address !== walletAddress) {
                checkProfile(address);
            } else if (!address) {
                setIsLoading(false); // Stop loading if no wallet, show connect prompt
            }
        };

        // Initial check
        checkWallet();

        // Poll every 1 second if no wallet is found yet
        intervalId = setInterval(checkWallet, 1000);

        return () => clearInterval(intervalId);
    }, [walletAddress]);

    // Fetch reels when profile is loaded
    useEffect(() => {
        if (existingProfile) {
            fetchMyReels();
        }
    }, [existingProfile]);

    const handleUpload = async () => {
        if (!uploadFile || !existingProfile) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append("file", uploadFile);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:8000/upload");

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = async () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    const fileUrl = response.url;

                    // 2. Create Reel Metadata
                    const reelPayload = {
                        creator_id: existingProfile.id,
                        creator_name: existingProfile.name,
                        url: fileUrl,
                        description: uploadDesc,
                        is_exclusive: isExclusive,
                        is_ai: isAI
                    };

                    const res = await fetch("http://localhost:8000/reels", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(reelPayload)
                    });

                    if (res.ok) {
                        // Success! 
                        setShowUploadModal(false);
                        setIsUploading(false);
                        setUploadFile(null);
                        setUploadDesc("");
                        fetchMyReels(); // Refresh list
                    } else {
                        alert("Failed to save reel metadata.");
                        setIsUploading(false);
                    }
                } else {
                    alert("File upload failed.");
                    setIsUploading(false);
                }
            };

            xhr.onerror = () => {
                alert("Network error during upload.");
                setIsUploading(false);
            };

            xhr.send(formData);

        } catch (e) {
            console.error(e);
            alert("Error uploading.");
            setIsUploading(false);
        }
    };

    const handleDeleteReel = async (reelId: string) => {
        if (!confirm("Are you sure you want to delete this reel?")) return;

        try {
            const res = await fetch(`http://localhost:8000/reels/${reelId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                // Refresh list
                fetchMyReels();
            } else {
                alert("Failed to delete reel.");
            }
        } catch (e) {
            console.error("Error deleting reel:", e);
            alert("Network error.");
        }
    };

    const handleDelete = async () => {
        if (!existingProfile) return;
        if (!confirm("Are you sure you want to delete your persona? This cannot be undone.")) return;

        setStatus("Deleting...");
        try {
            const res = await fetch(`http://localhost:8000/creators/${existingProfile.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setStatus("Profile Deleted.");
                setExistingProfile(null);
                setName("");
                setDescription("");
                setActiveTab("settings");
                if (onProfileCreated) onProfileCreated();
            } else {
                setStatus("Error deleting profile.");
            }
        } catch (e) {
            console.error(e);
            setStatus("Network error.");
        }
    };

    const handleSave = async () => {
        setStatus("Saving...");
        try {
            const payload = {
                name,
                description,
                wallet_address: walletAddress || "addr_test1...",
                subscription_price: parseInt(price),
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            };

            let url = "http://localhost:8000/creators";
            let method = "POST";

            if (existingProfile) {
                url = `http://localhost:8000/creators/${existingProfile.id}`;
                method = "PUT";
            }

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStatus(existingProfile ? "Profile Updated!" : "Profile Created!");
                if (!existingProfile) {
                    const data = await res.json();
                    setExistingProfile({ ...payload, id: data.creator_id });
                } else {
                    setExistingProfile({ ...existingProfile, ...payload });
                }

                if (onProfileCreated) onProfileCreated();
            } else {
                setStatus("Error saving profile.");
            }
        } catch (e) {
            console.error(e);
            setStatus("Network error.");
        }
    };

    if (isLoading) {
        return <div className="text-center p-10 text-gray-400">Loading Studio...</div>;
    }

    if (!walletAddress) {
        return (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-6">Please connect your Cardano wallet to access the Creator Studio.</p>
            </div>
        );
    }

    if (!existingProfile && activeTab === "canvas") {
        return (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Start Your Journey</h2>
                <p className="text-gray-400 mb-6">You don't have a creator profile yet.</p>
                <button
                    onClick={() => setActiveTab("settings")}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-full"
                >
                    Create Persona
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            {/* Upload Modal */}
            {showUploadModal && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">Upload New Content</h3>

                        <div className="space-y-4">
                            {/* File Input */}
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {uploadFile ? (
                                    <p className="text-green-400 font-bold">{uploadFile.name}</p>
                                ) : (
                                    <div className="text-gray-400">
                                        <Upload className="mx-auto mb-2" />
                                        <p>Click to select video</p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Description & Hashtags</label>
                                <textarea
                                    className="w-full bg-gray-800 rounded p-2 text-white"
                                    placeholder="Check out my new AI art! #cyberpunk #ai"
                                    value={uploadDesc}
                                    onChange={(e) => setUploadDesc(e.target.value)}
                                />
                            </div>

                            {/* Toggles */}
                            <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                                <span className="font-medium">Subscriber Exclusive? 🔒</span>
                                <button
                                    onClick={() => setIsExclusive(!isExclusive)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${isExclusive ? "bg-purple-600" : "bg-gray-600"}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isExclusive ? "left-7" : "left-1"}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                                <span className="font-medium">AI Generated? 🤖</span>
                                <button
                                    onClick={() => setIsAI(!isAI)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${isAI ? "bg-blue-600" : "bg-gray-600"}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isAI ? "left-7" : "left-1"}`} />
                                </button>
                            </div>

                            {/* Actions */}
                            {isUploading ? (
                                <div className="mt-6">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Uploading...</span>
                                        <span>{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className="flex-1 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={!uploadFile}
                                        className="flex-1 bg-purple-600 hover:bg-purple-500 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Post Reel 🚀
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Header / Tabs */}
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveTab("canvas")}
                    disabled={!existingProfile}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === "canvas"
                        ? "bg-gray-800 text-purple-400 border-b-2 border-purple-500"
                        : "bg-gray-900 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                >
                    <Layout size={18} />
                    Creator Canvas
                </button>
                <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === "settings"
                        ? "bg-gray-800 text-purple-400 border-b-2 border-purple-500"
                        : "bg-gray-900 text-gray-400 hover:text-white"
                        }`}
                >
                    <Settings size={18} />
                    Settings
                </button>
            </div>

            <div className="p-6">
                {activeTab === "canvas" && existingProfile && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Welcome, {existingProfile.name} 👋</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
                            >
                                <Upload size={18} />
                                Upload Content
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-700 p-4 rounded-xl">
                                <div className="flex items-center gap-3 mb-2 text-gray-400">
                                    <Users size={20} />
                                    <span>Total Subscribers</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{subscriberCount}</p>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-xl">
                                <div className="flex items-center gap-3 mb-2 text-gray-400">
                                    <DollarSign size={20} />
                                    <span>Monthly Earnings</span>
                                </div>
                                <p className="text-3xl font-bold text-green-400">0 ₳</p>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-xl">
                                <div className="flex items-center gap-3 mb-2 text-gray-400">
                                    <Layout size={20} />
                                    <span>Content Pieces</span>
                                </div>
                                <p className="text-3xl font-bold text-blue-400">{myReels.length}</p>
                            </div>
                        </div>

                        {myReels.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {myReels.map((reel) => (
                                    <div key={reel.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 relative group">
                                        <video
                                            src={reel.url}
                                            className="w-full h-48 object-cover"
                                        />

                                        {/* Delete Overlay */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDeleteReel(reel.id)}
                                                className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm"
                                                title="Delete Reel"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="p-3">
                                            <p className="text-sm font-bold truncate">{reel.description}</p>
                                            <div className="flex justify-between mt-2 text-xs text-gray-400">
                                                <span>{reel.is_exclusive ? "🔒 Exclusive" : "🌍 Public"}</span>
                                                <span>{reel.is_ai ? "🤖 AI" : "📹 Real"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        ) : (
                            <div className="bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
                                <p className="text-gray-500 mb-4">You haven't uploaded any exclusive content yet.</p>
                                <p className="text-sm text-gray-600">Your subscribers are waiting!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold mb-6">
                            {existingProfile ? "Edit Profile Details" : "Create Your Persona"}
                        </h2>

                        <div>
                            <label className="block text-sm font-medium mb-1">Display Name</label>
                            <input
                                className="w-full p-2 rounded bg-gray-700 text-white"
                                placeholder="e.g. Cosmic Artist"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bio / Description</label>
                            <textarea
                                className="w-full p-2 rounded bg-gray-700 text-white h-32"
                                placeholder="What do you create?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Wallet Address (for payments)</label>
                            <input
                                className="w-full p-2 rounded bg-gray-700 text-white"
                                placeholder="addr_test1..."
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Subscription Price (Lovelace)</label>
                            <input
                                className="w-full p-2 rounded bg-gray-700 text-white"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <p className="text-xs text-gray-400 mt-1">1 ADA = 1,000,000 Lovelace</p>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                {existingProfile ? "Save Changes" : "Launch Subscription Plan 🚀"}
                            </button>

                            {existingProfile && (
                                <button
                                    onClick={handleDelete}
                                    className="px-6 bg-red-900/50 hover:bg-red-900 text-red-200 font-bold py-3 rounded-lg transition-colors border border-red-800"
                                >
                                    Delete Persona
                                </button>
                            )}
                        </div>
                        {status && <p className="text-center mt-2 font-bold text-yellow-400">{status}</p>}
                    </div>
                )}
            </div>
        </div >
    );
}
