const sizes = {
  sm: { mark: 'h-9 w-9 rounded-xl', icon: 'h-5 w-5', text: 'text-base' },
  lg: { mark: 'h-16 w-16 rounded-2xl', icon: 'h-9 w-9', text: 'text-2xl' },
} as const;

export default function Logo({
  size = 'lg',
  showText = true,
}: {
  size?: 'sm' | 'lg';
  showText?: boolean;
}) {
  const s = sizes[size];

  return (
    <div
      className="flex items-center gap-3"
      role={showText ? undefined : 'img'}
      aria-label={showText ? undefined : 'Consultorios Médicos'}
    >
      <div
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md ${s.mark}`}
      >
        {/* Same mark as src/app/icon.svg; keep both in sync */}
        <svg
          className={s.icon}
          viewBox="0 0 24 24"
          fill="white"
          aria-hidden="true"
        >
          <rect x="9.75" y="2" width="4.5" height="20" rx="2.25" />
          <rect
            x="9.75"
            y="2"
            width="4.5"
            height="20"
            rx="2.25"
            transform="rotate(60 12 12)"
          />
          <rect
            x="9.75"
            y="2"
            width="4.5"
            height="20"
            rx="2.25"
            transform="rotate(120 12 12)"
          />
        </svg>
      </div>
      {showText && (
        <div className={`leading-tight ${s.text}`}>
          <div className="font-bold text-gray-900">Consultorios</div>
          <div className="font-medium text-cyan-600">Médicos</div>
        </div>
      )}
    </div>
  );
}
