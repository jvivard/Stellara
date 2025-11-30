/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.experiments = {
            ...config.experiments,
            topLevelAwait: true,
            layers: true,
            asyncWebAssembly: true,
        };
        config.ignoreWarnings = [
            { module: /node_modules\/lucid-cardano/ },
        ];
        return config;
    },
};

export default nextConfig;
