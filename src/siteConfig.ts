import siteConfigJson from "./siteConfig.json";
import siteConfigTestJson from "./siteConfig-test.json";

export interface SiteConfiguration {
  name: string;
  bio: string;
  profilePicture: string;
  url: string;
  isBlogDisplayed: boolean;
  /** How many blog posts to show on the homepage */
  blogHomePostLimit?: number;
  hideArchive?: boolean;
  contactFormEnabled: boolean;
  web3FormsAccessKey: string;
  /** Umami analytics website ID */
  umamiWebsiteId: string;
  iconLinks: IconLink[];
  customLinks: CustomLink[];
}

type ColorVariant = "base" | "primary" | "secondary" | "neutral";

interface IconLink {
  icon: string;
  url: string;
  color?: ColorVariant;
}

interface CustomLink {
  icon?: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  imageAlt?: string;
  imageDark?: string;
  imageAltDark?: string;
  carouselImages?: string[];
  carouselImageAlts?: string[];
  video?: string;
  color?: ColorVariant;
  newTab?: boolean;
  download?: boolean;
}

// In normal builds the site uses siteConfig.json.
// For Playwright/end-to-end tests we build a test variant of the site
// with PUBLIC_USE_TEST_SITE_CONFIG=true so that we can safely use
// alternate configuration without affecting production behavior.
const rawConfig = (typeof process !== 'undefined' && process.env.PUBLIC_USE_TEST_SITE_CONFIG === 'true')
  ? siteConfigTestJson
  : siteConfigJson;

export const SITE: SiteConfiguration = {
  ...rawConfig,
};

export default SITE;
