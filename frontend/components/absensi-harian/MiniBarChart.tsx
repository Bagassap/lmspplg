const BAR_HEIGHTS = [45, 75, 58, 92, 68, 82];

// Small decorative bar-sparkline used on stat cards, purely visual (no real
// data behind it) — echoes the little chart glyphs on each stat card in the
// reference design.
export function MiniBarChart({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <div className="flex h-10 shrink-0 items-end gap-1">
      {BAR_HEIGHTS.map((h, i) => (
        <span key={i} className="w-1.5 rounded-full" style={{ height: `${h}%`, backgroundColor: color }} />
      ))}
    </div>
  );
}
