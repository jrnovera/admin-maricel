/**
 * MBC brand logo. Three lockups live in /public, swappable on disk without
 * touching this component:
 *   wide   — logo-wide.png, full color, for light backgrounds
 *   white  — logo-wide-white.png, reversed to solid white, for the dark
 *            sidebar and anywhere else the color version loses contrast
 *   square — logo.png, the stacked original, for tight square slots
 */
export default function Logo({
  className = "",
  variant = "wide",
}: {
  className?: string;
  variant?: "wide" | "white" | "square";
}) {
  const src =
    variant === "white"
      ? "/logo-wide-white.png"
      : variant === "square"
        ? "/logo.png"
        : "/logo-wide.png";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Maricel Beauty Center" className={`object-contain ${className}`} />
  );
}
