"use client";

import { Heart, Users, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Script } from "lucid-cardano";
import plutus from "../utils/plutus.json";
import Link from "next/link";
import { useSubscriptions } from "@/context/SubscriptionContext";

interface PersonaCardProps {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    creatorAddress: string;
    role?: string;
}

export default function PersonaCard({
    id,
    name,
    description,
    imageUrl,
    price,
    creatorAddress,
    role = "AI Creator"
}: PersonaCardProps) {
    const [loading, setLoading] = useState(false);
    const { isSubscribed, addSubscription } = useSubscriptions();
    const subscribed = isSubscribed(id);

    // Defaults for missing data
    const subscribersCount = 0;
    const likesCount = 0;
    const period = 30; // Default 30 days

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            if (!window.cardano) {
                alert("Cardano wallet not found! Please install Nami or Lace.");
                setLoading(false);
                return;
            }

            const walletProvider = window.cardano.nami || window.cardano.lace;
            if (!walletProvider) {
                alert("Please install Nami or Lace wallet to subscribe.");
                setLoading(false);
                return;
            }

            const { Lucid, Blockfrost, Data, Constr } = await import("lucid-cardano");
            const apiKey = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY;
            if (!apiKey) {
                alert("API Key missing");
                setLoading(false);
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

            const creatorDetails = lucid.utils.getAddressDetails(creatorAddress);
            const creatorPKH = creatorDetails.paymentCredential?.hash;

            if (!creatorPKH) throw new Error("Could not get creator PKH");

            // Price in Lovelace
            const priceLovelace = BigInt(price); // Price is already in Lovelace from DB

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

            alert(`Subscribed to ${name}! Tx: ${txHash}`);

            addSubscription(id);

            await fetch("http://localhost:8000/notify_subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscriber: await lucid.wallet.address(),
                    tx_hash: txHash,
                    tier: "basic",
                    creator_id: id
                })
            });

        } catch (error) {
            console.error(error);
            alert("Subscription failed. See console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all duration-300 group relative">
            <Link href={`/profile/${id}`} className="block">
                <div className="relative h-80 overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        LIVE
                    </div>
                    <button className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-pink-600 transition-colors">
                        <Heart size={18} />
                    </button>
                </div>

                <div className="p-4 pb-0">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-0.5">{name}</h3>
                            <p className="text-gray-400 text-xs">{role}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                    </div>

                    <p className="text-gray-400 text-xs mb-3 line-clamp-2 h-8">
                        {description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>{subscribersCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart size={14} />
                            <span>{likesCount}</span>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="px-4 pb-4">
                <button
                    onClick={handleSubscribe}
                    disabled={loading || subscribed}
                    className={`w-full font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm ${subscribed
                        ? "bg-green-600 text-white cursor-default"
                        : "bg-white text-black hover:bg-gray-200"
                        }`}
                >
                    <Sparkles size={16} className={subscribed ? "text-white" : "text-purple-600"} />
                    {loading ? "Processing..." : subscribed ? "Subscribed" : `Subscribe (${(price / 1000000).toFixed(1)} ADA)`}
                </button>
            </div>
        </div>
    );
}
