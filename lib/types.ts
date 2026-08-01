export type MbcService = {
  id: string;
  category: string;
  name: string;
  price: number;
  price_label: string | null;
  duration_minutes: number;
  sort_order: number;
  is_active: boolean;
};

export type Enquiry = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  service: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  image: string;
  caption: string;
  category: string;
  sort_order: number;
  is_active: boolean;
};

export type BlogPost = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  published_at: string;
  sort_order: number;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  author: string | null;
  tags: string[];
};

export const GALLERY_CATEGORIES = [
  "Salon Interior",
  "Hair",
  "Nails",
  "Skin Care",
  "Brows & Lashes",
  "Makeup",
  "Spa",
];

export const BLOG_CATEGORIES = [
  "Skincare",
  "Hair Care",
  "Nail Care",
  "Brows & Lashes",
  "Wellness",
  "Beauty Tips",
];

export type Staff = {
  id: string;
  full_name: string | null;
  role: "admin" | "therapist" | null;
  photo_url: string | null;
  display_role: string | null;
  bio: string | null;
  show_on_site: boolean;
  sort_order: number;
  team_categories: string[];
};

/**
 * Which Our Team section(s) a staff member appears in on the public site.
 * Separate from `role` above, which is portal login permission (admin vs
 * therapist access) and must stay a single value — this is just branding,
 * and someone can carry two or three of these at once (e.g. a nail tech who
 * also does massage is both Beauty Specialist and Therapist).
 */
export const TEAM_CATEGORIES = [
  "Therapist",
  "Beauty Specialist",
  "Support Team",
  "Admin",
] as const;

export const SERVICE_CATEGORIES = [
  "Hair Services",
  "Nail Care",
  "Skin Care / Facials",
  "Brows & Lashes",
  "Waxing",
  "Makeup & Styling",
  "Body & Massage",
];

export type MbcPackage = {
  id: string;
  name: string;
  icon: string;
  includes: string[];
  duration: string;
  price: number;
  price_label: string | null;
  sort_order: number;
  is_active: boolean;
};

// Keep in sync with the icon set drawn in maricel-beauty-center/components/ServiceIcon.tsx
export const PACKAGE_ICONS = [
  "hair",
  "skin",
  "nails",
  "lashes",
  "waxing",
  "makeup",
  "lotus",
  "sparkle",
  "hygiene",
  "hands",
  "bottle",
  "heart",
  "crown",
] as const;

export type HeroImage = {
  id: string;
  page_key: string;
  sort_order: number;
  eyebrow: string | null;
  title_lead: string;
  title_accent: string | null;
  body: string | null;
  image: string;
  is_active: boolean;
};

export const HERO_PAGES = [
  { key: "home", label: "Home", multi: true },
  { key: "about", label: "About Us", multi: false },
  { key: "services", label: "Services", multi: false },
  { key: "packages", label: "Packages", multi: false },
  { key: "book-appointment", label: "Book Appointment", multi: false },
  { key: "our-team", label: "Our Team", multi: false },
  { key: "careers", label: "Careers", multi: false },
  { key: "gallery", label: "Gallery", multi: false },
  { key: "blog", label: "Blog", multi: false },
  { key: "contact", label: "Contact", multi: false },
  { key: "reviews", label: "Reviews", multi: false },
] as const;

// PostgREST reports a missing/uncached table as PGRST205 rather than passing
// through Postgres's raw 42P01.
export const TABLE_MISSING = new Set(["PGRST205", "42P01"]);
export const COLUMN_MISSING = new Set(["PGRST204", "42703"]);
