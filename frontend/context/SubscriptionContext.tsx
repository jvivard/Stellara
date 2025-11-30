"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SubscriptionContextType {
    subscribedCreators: string[];
    addSubscription: (creatorId: string) => void;
    isSubscribed: (creatorId: string) => boolean;
    syncSubscriptions: (address: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [subscribedCreators, setSubscribedCreators] = useState<string[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("stellara_subscriptions");
        if (stored) {
            setSubscribedCreators(JSON.parse(stored));
        }
    }, []);

    const addSubscription = (creatorId: string) => {
        const updated = [...new Set([...subscribedCreators, creatorId])]; // Ensure unique
        setSubscribedCreators(updated);
        localStorage.setItem("stellara_subscriptions", JSON.stringify(updated));
    };

    const syncSubscriptions = async (address: string) => {
        try {
            console.log("Syncing subscriptions for:", address);
            const res = await fetch(`http://localhost:8000/subscriptions/${address}`);
            if (res.ok) {
                const data = await res.json();
                const cloudSubscriptions = data.subscriptions || [];
                console.log("Cloud Sync Result:", cloudSubscriptions);

                // Merge with local
                const merged = [...new Set([...subscribedCreators, ...cloudSubscriptions])];
                setSubscribedCreators(merged);
                localStorage.setItem("stellara_subscriptions", JSON.stringify(merged));
            } else {
                console.warn("Failed to fetch subscriptions:", res.status);
            }
        } catch (error) {
            console.error("Failed to sync subscriptions:", error);
        }
    };

    const isSubscribed = (creatorId: string) => {
        return subscribedCreators.includes(creatorId);
    };

    return (
        <SubscriptionContext.Provider value={{ subscribedCreators, addSubscription, isSubscribed, syncSubscriptions }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscriptions() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error("useSubscriptions must be used within a SubscriptionProvider");
    }
    return context;
}
