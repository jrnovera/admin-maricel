/**
 * Every editable string on the public site, grouped the way it appears on the
 * page. This is the single source of truth for the content editor: the
 * `mbc_page_content` table only stores `page_key + field_key -> value`, so
 * adding a new editable string means adding a field here and reading it in the
 * matching site page — never a migration.
 *
 * `placeholder` is what's currently live on the site. For text fields that's
 * the greyed-out example copy; for image fields it's the current photo's URL,
 * shown as the preview until someone uploads a replacement. Leaving a field
 * empty keeps that original wording or photo, which is why nothing here is
 * "required".
 */

export type ContentField = {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  /** "image" swaps the text box for a photo picker in the editor. The value
   *  stored is still just a string — the uploaded file's public URL. */
  type?: "text" | "image";
};

/** `currentUrl` must match the photo hardcoded in the matching site page
 *  (`lib/site.ts`'s `images` map there) — it's what the picker previews
 *  until someone uploads a replacement. The two apps don't share code, so
 *  this is duplicated by hand rather than imported. */
function imageField(key: string, label: string, currentUrl: string): ContentField {
  return { key, label, placeholder: currentUrl, type: "image" };
}

export type ContentSection = {
  key: string;
  label: string;
  hint?: string;
  fields: ContentField[];
};

/** Builds the repeated "icon card" rows (title + description) that several
 *  sections render as a grid, so the schema stays readable. */
function cards(
  prefix: string,
  entries: { title: string; desc: string }[]
): ContentField[] {
  return entries.flatMap((entry, i) => [
    {
      key: `${prefix}.item${i + 1}.title`,
      label: "Title",
      placeholder: entry.title,
    },
    {
      key: `${prefix}.item${i + 1}.desc`,
      label: "Description",
      placeholder: entry.desc,
      multiline: true,
    },
  ]);
}

const ctaSection = (
  title: string,
  subtitle: string,
  button = "Enquire Now"
): ContentSection => ({
  key: "cta",
  label: "Closing Banner",
  hint: "The pink box with a button at the very bottom of the page.",
  fields: [
    { key: "cta.title", label: "Title", placeholder: title },
    {
      key: "cta.subtitle",
      label: "Paragraph",
      placeholder: subtitle,
      multiline: true,
    },
    { key: "cta.button", label: "Button Text", placeholder: button },
  ],
});

export const PAGE_CONTENT: Record<string, ContentSection[]> = {
  home: [
    {
      key: "about",
      label: "About Intro",
      hint: "The photo and text section just below the homepage slideshow.",
      fields: [
        imageField(
          "about.image",
          "Photo",
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
        ),
        { key: "about.eyebrow", label: "Small Heading", placeholder: "ABOUT US" },
        {
          key: "about.title",
          label: "Title",
          placeholder: "Your Premium Beauty Destination",
        },
        {
          key: "about.body1",
          label: "Paragraph 1",
          placeholder:
            "At Maricel Beauty Center, we believe beauty is personal. Our expert team is dedicated to providing exceptional services using premium products in a relaxing, hygienic, and luxurious environment.",
          multiline: true,
        },
        {
          key: "about.body2",
          label: "Paragraph 2",
          placeholder: "Because you deserve to look and feel your best.",
          multiline: true,
        },
        { key: "about.button", label: "Button Text", placeholder: "Learn More" },
      ],
    },
    {
      key: "services",
      label: "Services Grid",
      hint: "Heading above the six service cards.",
      fields: [
        {
          key: "services.eyebrow",
          label: "Small Heading",
          placeholder: "Our Services",
        },
        {
          key: "services.title",
          label: "Title",
          placeholder: "Enhance. Refresh. Glow.",
        },
        {
          key: "services.button",
          label: "Button Text",
          placeholder: "View All Services",
        },
      ],
    },
    {
      key: "packages",
      label: "Signature Packages Band",
      hint: "The dark photo section that links to the Packages page.",
      fields: [
        imageField(
          "packages.image",
          "Background Photo",
          "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1400&q=80"
        ),
        {
          key: "packages.eyebrow",
          label: "Small Heading",
          placeholder: "SIGNATURE PACKAGES",
        },
        {
          key: "packages.title",
          label: "Title",
          placeholder: "Pamper Yourself, Love Your Glow",
          multiline: true,
        },
        {
          key: "packages.body",
          label: "Paragraph",
          placeholder:
            "Curated packages for your beauty, relaxation, and total confidence.",
          multiline: true,
        },
        {
          key: "packages.button",
          label: "Button Text",
          placeholder: "Explore Packages",
        },
      ],
    },
    {
      key: "why",
      label: "Why Choose Us",
      fields: [
        {
          key: "why.heading",
          label: "Section Heading",
          placeholder: "WHY CHOOSE MARICEL BEAUTY CENTER",
        },
        ...cards("why", [
          {
            title: "Expert Professionals",
            desc: "Skilled and certified experts dedicated to your beauty.",
          },
          {
            title: "Premium Products",
            desc: "We use high-quality, safe and trusted products.",
          },
          {
            title: "Relaxing Ambience",
            desc: "A calm, luxurious space designed for your comfort.",
          },
          {
            title: "Personalized Care",
            desc: "Treatments tailored to your unique needs and goals.",
          },
        ]),
      ],
    },
    ctaSection(
      "Ready to Reveal Your Best?",
      "Send us an enquiry today and let us take care of you."
    ),
  ],

  about: [
    {
      key: "story",
      label: "Our Story",
      fields: [
        imageField(
          "story.image",
          "Main Photo",
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
        ),
        imageField(
          "story.image2",
          "Small Overlapping Photo",
          "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80"
        ),
        { key: "story.eyebrow", label: "Small Heading", placeholder: "Our Story" },
        {
          key: "story.title",
          label: "Title",
          placeholder: "A Passion That Became Our Purpose",
        },
        {
          key: "story.body1",
          label: "Paragraph 1",
          placeholder:
            "Maricel Beauty Center was founded with a simple mission: to provide exceptional beauty care in a warm, elegant, and welcoming space.",
          multiline: true,
        },
        {
          key: "story.body2",
          label: "Paragraph 2",
          placeholder:
            "From the very beginning, our focus has been on combining expertise, premium products, and personalized treatments to enhance natural beauty and boost confidence.",
          multiline: true,
        },
      ],
    },
    {
      key: "values",
      label: "Our Values & Philosophy",
      fields: [
        {
          key: "values.heading",
          label: "Section Heading",
          placeholder: "OUR VALUES & PHILOSOPHY",
        },
        ...cards("values", [
          {
            title: "Quality",
            desc: "We use premium products and modern techniques to deliver outstanding and lasting results.",
          },
          {
            title: "Care",
            desc: "Your comfort and well-being are our priority. Every service is delivered with heart and attention.",
          },
          {
            title: "Expertise",
            desc: "Our team is highly trained and passionate about helping you look and feel your absolute best.",
          },
          {
            title: "Hygiene",
            desc: "We maintain the highest standards of cleanliness and safety in every treatment.",
          },
          {
            title: "Personalized Service",
            desc: "We listen, we understand, and we create beauty solutions tailored just for you.",
          },
        ]),
      ],
    },
    {
      key: "experience",
      label: "The MBC Experience",
      fields: [
        {
          key: "experience.heading",
          label: "Section Heading",
          placeholder: "THE MBC EXPERIENCE",
        },
        ...cards("experience", [
          {
            title: "Luxury You Deserve",
            desc: "A refined space designed for relaxation, beauty, and self-care.",
          },
          {
            title: "Results That Last",
            desc: "Advanced techniques and premium products for visible, long-lasting results.",
          },
          {
            title: "You're In Good Hands",
            desc: "A professional team dedicated to enhancing your natural beauty.",
          },
          {
            title: "Confidence, Always",
            desc: "We're here to help you feel beautiful, confident, and empowered every day.",
          },
        ]),
      ],
    },
    {
      key: "bridal",
      label: "Bridal Package Banner",
      hint: "The photo in the pink \"Most Loved\" banner. The package details are managed elsewhere.",
      fields: [
        imageField(
          "bridal.image",
          "Photo",
          "https://images.unsplash.com/photo-1523268755815-fe7c372a0349?auto=format&fit=crop&w=1000&q=80"
        ),
      ],
    },
    ctaSection(
      "Your Beauty Journey Starts Here",
      "Let our experts bring out the best in you. Send us an enquiry today and experience the MBC difference."
    ),
  ],

  services: [
    {
      key: "brands",
      label: "Brand Strip",
      fields: [
        {
          key: "brands.heading",
          label: "Section Heading",
          placeholder: "OUR PROFESSIONAL BEAUTY BRANDS",
        },
      ],
    },
    ctaSection(
      "Ready to look and feel your best?",
      "Send us an enquiry today and let our experts pamper you with the care you deserve.",
      "ENQUIRE NOW"
    ),
  ],

  packages: [
    {
      key: "intro",
      label: "Intro",
      fields: [
        {
          key: "intro.eyebrow",
          label: "Small Heading",
          placeholder: "BEAUTY. CONVENIENCE. VALUE.",
        },
        {
          key: "intro.body",
          label: "Paragraph",
          placeholder:
            "Our packages are designed to give you a complete head-to-toe experience, combining our most popular treatments in one seamless session. Save time, enjoy better value, and leave feeling renewed.",
          multiline: true,
        },
      ],
    },
    {
      key: "list",
      label: "Package List",
      fields: [
        { key: "list.eyebrow", label: "Small Heading", placeholder: "Our Packages" },
        {
          key: "list.title",
          label: "Title",
          placeholder: "Choose Your Perfect Experience",
        },
      ],
    },
    {
      key: "why",
      label: "Why Choose Our Packages",
      fields: [
        {
          key: "why.heading",
          label: "Section Heading",
          placeholder: "WHY CHOOSE OUR PACKAGES",
        },
        ...cards("why", [
          {
            title: "Expert Therapists",
            desc: "Skilled and certified professionals dedicated to your beauty.",
          },
          {
            title: "Premium Products",
            desc: "We use high-quality, safe and trusted products.",
          },
          {
            title: "Personalized Care",
            desc: "Every package is tailored to your unique needs.",
          },
          {
            title: "Relaxing Ambience",
            desc: "A calm, luxurious space designed for your comfort and renewal.",
          },
        ]),
      ],
    },
    {
      key: "bridal",
      label: "Bridal Package Banner",
      hint: "The photo in the pink \"Most Loved\" banner. The package details are managed elsewhere.",
      fields: [
        imageField(
          "bridal.image",
          "Photo",
          "https://images.unsplash.com/photo-1523268755815-fe7c372a0349?auto=format&fit=crop&w=1000&q=80"
        ),
      ],
    },
    ctaSection(
      "Ready to Pamper Yourself?",
      "Enquire about your favorite package today and let us take care of you.",
      "Enquire About a Package"
    ),
  ],

  contact: [
    {
      key: "visit",
      label: "Visit Our Salon",
      fields: [
        { key: "visit.title", label: "Title", placeholder: "Visit Our Salon" },
        {
          key: "visit.body",
          label: "Paragraph",
          placeholder:
            "We'd love to welcome you to Maricel Beauty Center. Find us at our convenient location.",
          multiline: true,
        },
        {
          key: "visit.mapButton",
          label: "Map Button Text",
          placeholder: "View on Google Maps",
        },
      ],
    },
    {
      key: "hours",
      label: "Opening Hours",
      hint: "This only changes the heading and note below — the actual days and times are set elsewhere.",
      fields: [
        { key: "hours.title", label: "Title", placeholder: "Opening Hours" },
        {
          key: "hours.note",
          label: "Note",
          placeholder:
            "Walk-ins are welcome, but appointments are recommended.",
          multiline: true,
        },
      ],
    },
    {
      key: "form",
      label: "Enquiry Form",
      fields: [
        {
          key: "form.title",
          label: "Title",
          placeholder: "Send Us a Message",
        },
      ],
    },
    ctaSection(
      "Ready to Feel Your Best?",
      "Send us an enquiry today and let us take care of you with love and expertise."
    ),
  ],

  gallery: [
    {
      key: "moments",
      label: "Moments at MBC",
      hint: "The text and 3-photo grid near the bottom of the page.",
      fields: [
        imageField(
          "moments.image1",
          "Photo 1",
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
        ),
        imageField(
          "moments.image2",
          "Photo 2",
          "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=80"
        ),
        imageField(
          "moments.image3",
          "Photo 3",
          "https://images.unsplash.com/photo-1523268755815-fe7c372a0349?auto=format&fit=crop&w=1000&q=80"
        ),
        {
          key: "moments.eyebrow",
          label: "Small Heading",
          placeholder: "Inside Maricel Beauty Center",
        },
        {
          key: "moments.title",
          label: "Title",
          placeholder: "Moments at MBC",
        },
        {
          key: "moments.body",
          label: "Paragraph",
          placeholder:
            "Every corner of MBC is designed with love and attention to detail — to make you feel beautiful, relaxed, and cared for.",
          multiline: true,
        },
        {
          key: "moments.founderLabel",
          label: "Founder Caption",
          placeholder: "FOUNDER",
        },
      ],
    },
    ctaSection(
      "Ready to experience beauty with care?",
      "Send us an enquiry today and let us bring out the best in you."
    ),
  ],

  "our-team": [
    {
      key: "intro",
      label: "Team Intro",
      fields: [
        {
          key: "intro.eyebrow",
          label: "Small Heading",
          placeholder: "Beauty, Care, Passion",
        },
        {
          key: "intro.title",
          label: "Title",
          placeholder: "The Experts Behind Your Glow",
        },
        {
          key: "intro.body",
          label: "Paragraph",
          placeholder:
            "Each member of our team is highly trained and committed to providing you with the best experience possible.",
          multiline: true,
        },
      ],
    },
    {
      key: "closing",
      label: "Closing Banner",
      fields: [
        {
          key: "closing.title",
          label: "Title",
          placeholder: "We're Here For You",
        },
        {
          key: "closing.body",
          label: "Paragraph",
          placeholder: "Our team is ready to help you look and feel your best.",
          multiline: true,
        },
        {
          key: "closing.button1",
          label: "Main Button Text",
          placeholder: "Enquire Now",
        },
        {
          key: "closing.button2",
          label: "Second Button Text",
          placeholder: "Join Our Team",
        },
      ],
    },
  ],
};

export function sectionsFor(pageKey: string): ContentSection[] {
  return PAGE_CONTENT[pageKey] ?? [];
}
