type MarkProps = {
  size?: number;
  page?: string;
  peel?: string;
  ink?: string;
  className?: string;
};

/**
 * "The Peel": a page whose corner is lifting away to reveal the honest layer underneath.
 */
export function LogoMark({
  size = 32,
  page = "#FAF6EF",
  peel = "#B8F28F",
  ink = "#121412",
  className,
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 3h20a3 3 0 0 1 3 3v13l-10 10H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"
        fill={page}
        stroke={ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M29 19c-6 0-10 4-10 10 2-4.6 5.4-8 10-10z"
        fill={peel}
        stroke={ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 10.5h12M9 16h7"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "cream";
}) {
  const color = tone === "ink" ? "text-ink" : "text-cream";
  return (
    <span className={`inline-flex items-center gap-2 ${color} ${className}`}>
      <LogoMark
        size={28}
        ink={tone === "ink" ? "#121412" : "#121412"}
      />
      <span className="font-display text-[1.35rem] font-semibold tracking-[-0.03em]">
        AdaptWeb
        <span className="ml-1 rounded-md bg-lime px-1.5 py-0.5 align-middle font-mono text-[0.6rem] font-medium tracking-wider text-ink">
          AI
        </span>
      </span>
    </span>
  );
}
