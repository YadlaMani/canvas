import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, monadTestnet } from "@reown/appkit/networks";

import type { AppKitNetwork } from "@reown/appkit/networks";

export const projectId =
  process.env.PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [monadTestnet] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
