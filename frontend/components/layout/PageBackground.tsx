export function PageBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: `
          radial-gradient(at 20% 20%, rgba(124, 58, 237, 0.15), transparent 40%),
          radial-gradient(at 80% 30%, rgba(59, 130, 246, 0.10), transparent 45%),
          radial-gradient(at 50% 80%, rgba(236, 72, 153, 0.10), transparent 40%)
        `,
      }}
    />
  );
}
