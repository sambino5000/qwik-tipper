import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  return {
    ssr: { target: "webworker", noExternal: true },
    plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
    optimizeDeps: {
      include: ["lean-qr", "chronik-client", "@samrock5000/cashscript"], //'@bitauth/libauth'
    },
  };
});
