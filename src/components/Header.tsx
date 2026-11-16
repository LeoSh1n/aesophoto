interface HeaderProps {
  onStartShoot: () => void;
}

export function Header({ onStartShoot }: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm"
        >
          aesophoto
        </a>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
          <a
            href="#studio"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
          >
            스튜디오
          </a>
          <a
            href="#editor"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
          >
            프레임 편집
          </a>
          <a
            href="#archive"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
          >
            보관함
          </a>
          <a
            href="#guestbook"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
          >
            방명록
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartShoot}
            className="px-4 py-2 text-xs font-semibold tracking-wide text-black bg-white rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            촬영 시작
          </button>
        </div>
      </div>
    </header>
  );
}
