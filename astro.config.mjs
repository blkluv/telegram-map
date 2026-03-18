import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import { getRequiredIcons } from "./src/lib/getRequiredIcons";

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/blog": "/",
  },
  site: "https://whisk.atl5d.com",
  integrations: [
    tailwind(),
    sitemap(),
    icon({
      include: getRequiredIcons(),
    }),
  ],
});
