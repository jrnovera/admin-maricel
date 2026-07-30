export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Enquiries",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUSES = [
  "unpaid",
  "partial",
  "paid",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type Booking = {
  id: string;
  user_id: string | null;
  service_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  service_label: string;
  booking_date: string;
  time_slot: string;
  notes: string | null;
  amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  assigned_therapist_id: string | null;
  created_at: string;
};

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
};

export const SERVICE_CATEGORIES = [
  "Hair Services",
  "Nail Care",
  "Skin Care / Facials",
  "Brows & Lashes",
  "Waxing",
  "Makeup & Styling",
  "Body & Massage",
];

// PostgREST reports a missing/uncached table as PGRST205 rather than passing
// through Postgres's raw 42P01.
export const TABLE_MISSING = new Set(["PGRST205", "42P01"]);
export const COLUMN_MISSING = new Set(["PGRST204", "42703"]);
