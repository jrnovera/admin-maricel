/**
 * MBC brand logo — the same public/logo.png the public site uses, so the
 * portal and the website never drift apart. A plain <img> so the file can be
 * swapped for any size or aspect ratio without touching this component.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Maricel Beauty Center"
      className={`w-auto object-contain ${className}`}
    />
  );
}
