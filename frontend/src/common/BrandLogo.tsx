type Props = {
  size?: number;
  showName?: boolean;
  tone?: "auto" | "light";
  className?: string;
};

export default function BrandLogo({
  size = 40,
  showName = true,
  tone = "auto",
  className = "",
}: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/images/logo/logo.png"
        alt="Finora"
        width={size}
        height={size}
        className="shrink-0 object-contain"
      />
      {showName && (
        <span
          className={`font-semibold tracking-tight ${
            tone === "light" ? "text-white" : "text-brand-800 dark:text-white"
          }`}
          style={{ fontSize: size * 0.6 }}
        >
          Finora
        </span>
      )}
    </span>
  );
}