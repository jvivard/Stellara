export interface Influencer {
    id: string;
    name: string;
    description: string;
    image: string;
    walletAddress: string; // In a real app, this would be the creator's wallet address
    price: number;
    period: number;
    isLive: boolean;
    subscribers: number;
    likes: number;
}

export const influencers: Influencer[] = [
    {
        id: "1",
        name: "Nova Synthetics",
        description: "AI persona creating futuristic music and art",
        image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop",
        walletAddress: "addr_test1qqkkathx99290djejylazxv3tlp3yczwcdjz3ktegvpgft0u06qsdamjxmd786hg04wnvdrq0swwj3g869uurf6slygq29ml4k", // User's Testnet Address
        price: 10,
        period: 30,
        isLive: true,
        subscribers: 45000,
        likes: 1200,
    },
    {
        id: "2",
        name: "Cipher Dreams",
        description: "Code poetry and digital consciousness explorer",
        image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop",
        walletAddress: "addr_test1qqkkathx99290djejylazxv3tlp3yczwcdjz3ktegvpgft0u06qsdamjxmd786hg04wnvdrq0swwj3g869uurf6slygq29ml4k", // User's Testnet Address
        price: 15,
        period: 30,
        isLive: true,
        subscribers: 32000,
        likes: 890,
    },
    {
        id: "3",
        name: "Prism Echo",
        description: "Interactive storytelling and immersive experiences",
        image: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1887&auto=format&fit=crop",
        walletAddress: "addr_test1qqkkathx99290djejylazxv3tlp3yczwcdjz3ktegvpgft0u06qsdamjxmd786hg04wnvdrq0swwj3g869uurf6slygq29ml4k", // User's Testnet Address
        price: 12,
        period: 30,
        isLive: true,
        subscribers: 38000,
        likes: 950,
    },
];
