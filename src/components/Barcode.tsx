import { encodeCode128 } from "@/lib/barcode";

/**
 * Renders a scannable Code 128 barcode as inline SVG — no image request, and
 * it prints crisply at any size.
 */
export function Barcode({
  value,
  height = 60,
  className = "",
}: {
  value: string;
  height?: number;
  className?: string;
}) {
  const encoded = encodeCode128(value);

  if (!encoded) {
    return (
      <p className="font-mono text-sm text-slate-500">
        {value} <span className="text-xs">(not encodable)</span>
      </p>
    );
  }

  const quietZone = 10; // Scanners need clear space either side.
  const width = encoded.totalWidth + quietZone * 2;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-xs"
        role="img"
        aria-label={`Barcode for ${value}`}
        preserveAspectRatio="none"
      >
        <rect width={width} height={height} fill="#ffffff" />
        {encoded.bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x + quietZone}
            y={0}
            width={bar.width}
            height={height}
            fill="#0f172a"
          />
        ))}
      </svg>
      <p className="mt-1 text-center font-mono text-xs tracking-widest text-slate-700">
        {value}
      </p>
    </div>
  );
}
