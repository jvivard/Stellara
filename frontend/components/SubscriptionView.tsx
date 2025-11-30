"use client";

import { useState } from "react";
import type { Script } from "lucid-cardano";
import plutus from "../utils/plutus.json";

export default function SubscriptionView() {
    const [creatorAddr, setCreatorAddr] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const subscribe = async () => {
        setLoading(true);
        try {
            const apiKey = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY;
            if (!apiKey) {
                alert("Blockfrost API Key is missing! Please set NEXT_PUBLIC_BLOCKFROST_API_KEY in .env.local");
                return;
            }

            const { Lucid, Blockfrost, Data, Constr } = await import("lucid-cardano");

            // Initialize Lucid
            const lucid = await Lucid.new(
                new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", apiKey),
                "Preprod"
            );
            const walletProvider = window.cardano.nami || window.cardano.lace;
            if (!walletProvider) {
                alert("Nami or Lace Wallet not found! Please install the Nami or Lace extension.");
                setLoading(false);
                return;
            }

            const api = await walletProvider.enable();
            lucid.selectWallet(api);

            const validator: Script = {
                type: "PlutusV2",
                script: plutus.validators[0].compiledCode,
            };
            const scriptAddress = lucid.utils.validatorToAddress(validator);

            const datum = Data.to(new Constr(0, [
                "SUBSCRIBER_PKH", // Placeholder bytes
                "CREATOR_PKH",    // Placeholder bytes
                BigInt(10000000),           // Price
                BigInt(86400000 * 30),      // Period
                BigInt(Date.now() + 86400000 * 30) // Next payment
            ]));

            const tx = await lucid
                .newTx()
                .payToContract(scriptAddress, { inline: datum }, { lovelace: BigInt(10000000) })
                .complete();

            const signedTx = await tx.sign().complete();
            const txHash = await signedTx.submit();

            alert(`Subscribed! Tx Hash: ${txHash}`);

            // Notify Masumi Agent
            try {
                await fetch("http://localhost:8000/notify_subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subscriber: await lucid.wallet.address(),
                        tx_hash: txHash,
                        tier: "basic"
                    })
                });
                console.log("Masumi Agent notified.");
            } catch (agentError) {
                console.error("Failed to notify agent:", agentError);
            }
        } catch (error) {
            console.error("Subscription failed:", error);
            alert("Subscription failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded shadow-md mt-4">
            <h2 className="text-2xl font-bold mb-4">Fan Subscription</h2>
            <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Creator Address / Hash</label>
                <input
                    type="text"
                    value={creatorAddr}
                    onChange={(e) => setCreatorAddr(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
            </div>
            <button
                onClick={subscribe}
                disabled={loading}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
                {loading ? "Processing..." : "Subscribe (10 ADA)"}
            </button>
        </div>
    );
}
