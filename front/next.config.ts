const nextConfig: any = {};

if (process.env.NEXT_USE_WEBPACK === "1") {
  nextConfig.webpack = (config: { experiments: any }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  };
}

export default nextConfig;
