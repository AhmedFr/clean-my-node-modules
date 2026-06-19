import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is self-contained in site/; pin the root so Next does not
  // infer the parent worktree (which has its own lockfile) as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
