// Stub component for photo date display
// TODO: Implement full PhotoDate component

export default function PhotoDate({
  date,
  className,
}: {
  date?: Date | string
  className?: string
}) {
  const dateStr = date instanceof Date ? date.toLocaleDateString() : date;
  return <span className={className}>{dateStr}</span>;
}
