/** The Verdict mark: a ruled bulletin with a tick stamped on it. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="var(--navy)" />
      <path d="M6 7h12M6 10.5h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <path d="M7.5 15.5l2.8 2.8L17 12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
