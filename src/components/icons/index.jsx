// ── Playback ─────────────────────────────────────────────────────────────────

export function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0E0F12">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}

export function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0E0F12">
      <rect x="6" y="5" width="4" height="14" rx="1"/>
      <rect x="14" y="5" width="4" height="14" rx="1"/>
    </svg>
  );
}

export function IconVolume({ muted }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H3v6h3l5 4z"/>
      {muted ? (
        <>
          <path d="M16 9l6 6"/>
          <path d="M22 9l-6 6"/>
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 010 7"/>
          <path d="M18.5 5.5a9 9 0 010 13"/>
        </>
      )}
    </svg>
  );
}

export function IconFullscreen({ isFs }) {
  return isFs ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4v5H4"/>
      <path d="M15 4v5h5"/>
      <path d="M9 20v-5H4"/>
      <path d="M15 20v-5h5"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V4h5"/>
      <path d="M20 9V4h-5"/>
      <path d="M4 15v5h5"/>
      <path d="M20 15v5h-5"/>
    </svg>
  );
}

// ── Controls ─────────────────────────────────────────────────────────────────

export function IconLoop() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l4 4-4 4"/>
      <path d="M3 11V9a3 3 0 013-3h15"/>
      <path d="M7 22l-4-4 4-4"/>
      <path d="M21 13v2a3 3 0 01-3 3H3"/>
    </svg>
  );
}

export function IconMirror() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18"/>
      <path d="M8 7l-5 5 5 5V7z"/>
      <path d="M16 7l5 5-5 5V7z"/>
    </svg>
  );
}

// ── File / Upload ─────────────────────────────────────────────────────────────

export function IconVideo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9BA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="13" height="14" rx="2"/>
      <path d="M16 10l5-3v10l-5-3"/>
    </svg>
  );
}

export function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

export function IconAudioPlaceholder() {
  return (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3A3B44" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function IconGitHub() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}
