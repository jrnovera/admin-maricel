/**
 * MBC brand mark — a stylised woman with flowing hair above the "MBC"
 * wordmark, drawn as inline SVG so it stays crisp at any size and can be
 * recoloured for light/dark surfaces.
 */
export default function Logo({
  className = "",
  variant = "full",
  color = "#e0218a",
}: {
  className?: string;
  /** "full" = mark + wordmark + tagline · "mark" = silhouette only · "stacked" = mark over wordmark */
  variant?: "full" | "mark" | "stacked";
  color?: string;
}) {
  const mark = (
    <g fill={color}>
      {/* Face profile */}
      <path d="M96 34c-9.5 0-17.4 5.4-21 13.2-1.5 3.3-2.2 6.9-2.1 10.5.1 4.2 1.2 8.2 2.4 12.2.5 1.6.4 2.6-.6 3.9-1.2 1.5-2.3 3.1-3.2 4.8-.7 1.3-.4 2.2 1 2.6l3 .9c1 .3 1.4.9 1.3 1.9-.2 2-.3 4-.3 6 0 2.2 1.1 3.6 3.2 4.2 3.6 1 7.2 1.2 10.9.6 1.1-.2 1.6.2 1.6 1.3v6.6c0 1.3.6 1.7 1.8 1.4 1.4-.4 2-1.2 2-2.7V85c0-1.5-.5-2.1-2-2.3-2.9-.4-5.7-1-8.4-2.2-1.4-.6-1.7-1.4-1-2.7.6-1.1 1.5-1.9 2.6-2.5 1-.5 1.2-1.2.6-2.1-.5-.8-1.2-1.5-2-2-1.2-.8-1.3-1.7-.6-2.9 1.6-2.6 2.5-5.4 2.6-8.5.1-2.6-.6-4.9-2.4-6.8-.8-.9-.7-1.7.2-2.4 2.6-2 5.6-3 8.9-3.2 1.4-.1 2-.8 1.9-2.2-.1-1.1.4-1.6 1.5-1.6 2.4 0 4.7.5 6.8 1.7 1.1.6 1.9.3 2.4-.8.4-1 1-1.3 2-1 1.4.4 2.4 1.3 3.2 2.5.6.9 1.4 1.1 2.4.7 1.2-.5 1.6-1.4 1.2-2.6C111.6 38.4 104.6 34 96 34z" />
      {/* Flowing hair strands sweeping to the right */}
      <path d="M116 45c6.4 3.9 11.5 9.1 15.2 15.6 5.1 8.9 7 18.5 6 28.6-.5 5.4-1.9 10.6-4 15.6-.4 1-1 1.3-2 1-1-.4-1.3-1.1-1-2.2 3.4-11.7 3-23.1-2-34.2-2.9-6.4-7.2-11.7-12.9-15.8-1.2-.9-1.4-1.8-.6-3 .8-1.2 1.7-1.4 3-.6z" />
      <path d="M124 58c8.2 6.8 13.2 15.5 14.8 26 1.4 9.3-.2 18.2-4.4 26.6-.6 1.2-1.4 1.5-2.6 1-1.1-.5-1.4-1.4-.8-2.5 5.4-10.6 6.4-21.6 2.7-32.9-2.1-6.5-5.8-12-10.9-16.5-1.1-1-1.2-2-.2-3s2-1 3.1-.3z" />
      <path d="M104 44c9 1.3 16.6 5.4 22.6 12.3 7.6 8.7 11 18.9 10.3 30.4-.3 4.9-1.4 9.6-3.3 14.1-.5 1.2-1.3 1.6-2.5 1.2s-1.6-1.3-1.2-2.5c4.4-11.5 3.9-22.7-2-33.5-4.9-9-12.4-14.7-22.3-17.1-1.4-.3-2-1.1-1.7-2.5.3-1.5 1.2-2 2.1-1.7z" />
      <path d="M112 88c1.3 7.5.3 14.7-3.1 21.5-.6 1.2-1.5 1.5-2.7 1s-1.5-1.4-.9-2.6c3.1-6.2 3.9-12.6 2.5-19.4-.3-1.4.2-2.2 1.6-2.5s2.3.3 2.6 2z" />
      <path d="M120 78c2.8 10.9 1.5 21.2-3.9 31-.7 1.2-1.6 1.5-2.8.9-1.1-.6-1.4-1.5-.7-2.7 5-8.9 6.1-18.2 3.5-28-.4-1.4.1-2.3 1.5-2.7s2.1.1 2.4 1.5z" />
      {/* Shoulder / neck sweep */}
      <path d="M72 104c-4.6 2.4-8.4 5.7-11.4 9.9-.9 1.2-1.8 1.4-3 .6s-1.3-1.8-.4-3c3.5-4.9 8-8.8 13.4-11.6 1.3-.7 2.2-.4 2.8.9s.2 2.3-1.4 3.2z" />
      <path d="M86 110c-8.9.6-16.6 4-23.1 10.1-1 1-2 1-3 0s-1-2 0-3c7.3-6.9 16-10.7 26-11.3 1.4-.1 2.2.6 2.3 2s-.7 2.1-2.2 2.2z" />
    </g>
  );

  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 200 140"
        className={className}
        role="img"
        aria-label="Maricel Beauty Center"
      >
        {mark}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 260"
      className={className}
      role="img"
      aria-label="Maricel Beauty Center"
    >
      {mark}
      {/* MBC wordmark */}
      <text
        x="100"
        y="200"
        textAnchor="middle"
        fill={color}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="76"
        letterSpacing="-2"
      >
        MBC
      </text>
      <text
        x="100"
        y="228"
        textAnchor="middle"
        fill={color}
        fontFamily="system-ui, sans-serif"
        fontWeight="500"
        fontSize="17"
        letterSpacing="1.5"
      >
        MARICEL BEAUTY CENTER
      </text>
    </svg>
  );
}
