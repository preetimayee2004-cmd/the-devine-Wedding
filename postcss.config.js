import { fileURLToPath } from "node:url";

// Paths are resolved from this file, so the site builds the same from any working directory.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL("./tailwind.config.ts", import.meta.url)) },
    autoprefixer: {},
  },
};
