import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "inkredible-tools";
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? `/${repo}` : "";
const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: isProd ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
