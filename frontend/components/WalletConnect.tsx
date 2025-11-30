"use client";

import { useState, useEffect } from "react";
import type { Lucid } from "lucid-cardano";
import { useSubscriptions } from "../context/SubscriptionContext";

export default function WalletConnect() {
    const [wallet, setWallet] = useState<Lucid | null>(null);
    const [address, setAddress] = useState<string>("");
    const { syncSubscriptions } = useSubscriptions();

    const connectWallet = async () => {
        try {
            console.log("Starting wallet connection...");
            const apiKey = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY;
            if (!apiKey) {
                alert("Blockfrost API Key is missing! Please set NEXT_PUBLIC_BLOCKFROST_API_KEY in .env.local");
                return;
            }

            console.log("Importing Lucid...");
            const { Lucid, Blockfrost } = await import("lucid-cardano");

            console.log("Initializing Lucid...");
            const lucid = await Lucid.new(
                new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", apiKey),
                "Preprod"
            );

            if (!window.cardano) {
                alert("Cardano wallet not found! Please install Nami or Lace.");
                return;
            }

            const walletProvider = window.cardano.nami || window.cardano.lace;
            if (!walletProvider) {
                alert("Nami or Lace Wallet not found! Please install the Nami or Lace extension.");
                return;
            }

            console.log("Enabling wallet...");
            const api = await walletProvider.enable();

            console.log("Selecting wallet...");
            lucid.selectWallet(api);

            console.log("Getting address...");
            const addr = await lucid.wallet.address();
            console.log("Address:", addr);

            setWallet(lucid);
            setAddress(addr);
            localStorage.setItem("walletAddress", addr); // Save for other components

            // Sync subscriptions from cloud
            console.log("Syncing subscriptions...");
            await syncSubscriptions(addr);
            console.log("Wallet connected successfully!");

        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert(`Error connecting wallet: ${error}`);
        }
    };

    return (
        <div className="p-4">
            {address ? (
                <p>Connected: {address}</p>
            ) : (
                <button
                    onClick={connectWallet}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Connect Nami Wallet
                </button>
            )}
        </div>
    );
}
