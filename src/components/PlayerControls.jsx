import { useState, useEffect } from "react";

function toMSS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── SVG icons ──────────────────────────────────────────────────────────────

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0E0F12">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0E0F12">
      <rect x="6" y="5" width="4" height="14" rx="1"/>
      <rect x="14" y="5" width="4" height="14" rx="1"/>
    </svg>
  );
}

function IconVolume({ muted }) {
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

function IconLoop() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l4 4-4 4"/>
      <path d="M3 11V9a3 3 0 013-3h15"/>
      <path d="M7 22l-4-4 4-4"/>
      <path d="M21 13v2a3 3 0 01-3 3H3"/>
    </svg>
  );
}

function IconMirror() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18"/>
      <path d="M8 7l-5 5 5 5V7z"/>
      <path d="M16 7l5 5-5 5V7z"/>
    </svg>
  );
}

function IconFullscreen({ isFs }) {
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

// ── Component ───────────────────────────────────────────────────────────────

export default function PlayerControls({
  videoRef,
  playerPanelRef,
  duration,
  mediaReady = true,
  mirrored = false,
  onMirrorToggle = null,
  onSpeedChange = null,
  loopEnabled = false,
  onLoopToggle = null,
}) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFs, setIsFs] = useState(false);

  // Sync play/pause from DOM events + click-to-toggle
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onClick = () => video.paused ? video.play() : video.pause();
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("click", onClick);
    video.style.cursor = "pointer";
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("click", onClick);
    };
  }, [mediaReady]);

  // Poll currentTime + playing state (also covers YT adapter)
  useEffect(() => {
    if (!mediaReady) return;
    const id = setInterval(() => {
      if (!videoRef.current) return;
      setCurrentTime(videoRef.current.currentTime);
      setPlaying(!videoRef.current.paused);
    }, 100);
    return () => clearInterval(id);
  }, [mediaReady]);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
  }

  function handleVolume(e) {
    const val = parseFloat(e.target.value);
    const v = videoRef.current;
    if (v) v.volume = val;
    setVolume(val);
    if (val === 0) setMuted(true);
    else if (muted) { setMuted(false); if (v) v.muted = false; }
  }

  function handleSpeed(e) {
    const val = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.playbackRate = val;
    setSpeed(val);
    onSpeedChange?.(val);
  }

  function resetSpeed() {
    if (videoRef.current) videoRef.current.playbackRate = 1;
    setSpeed(1);
    onSpeedChange?.(1);
  }

  function handleFullscreen() {
    const el = playerPanelRef?.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  const effectiveMuted = muted || volume === 0;

  return (
    <div className="player-controls">
      {/* Left cluster: play, time, volume */}
      <div className="ctrl-left">
        <button
          className="ctrl-play"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>

        <span className="ctrl-time">
          {toMSS(currentTime)} <span className="dur">/ {toMSS(duration)}</span>
        </span>

        <div className="ctrl-volume-wrapper">
          <button className="ctrl-icon-btn" onClick={toggleMute} aria-label={effectiveMuted ? "Unmute" : "Mute"}>
            <IconVolume muted={effectiveMuted} />
          </button>
          <input
            className="ctrl-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={effectiveMuted ? 0 : volume}
            onChange={handleVolume}
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Right cluster: speed, loop, mirror, fullscreen */}
      <div className="ctrl-right">
        {/* Speed pill */}
        <div className="ctrl-speed-pill">
          <span className="ctrl-speed-label">Speed</span>
          <input
            className="ctrl-speed-slider"
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            value={speed}
            onChange={handleSpeed}
            aria-label="Playback speed"
          />
          <button
            className="ctrl-speed-reset"
            onClick={resetSpeed}
            aria-label="Reset speed to 1×"
          >
            {speed}×
          </button>
        </div>

        {/* Loop toggle — controlled by parent via props, or self-managed */}
        {onLoopToggle !== null && (
          <button
            className={`ctrl-toggle${loopEnabled ? " active" : ""}`}
            onClick={onLoopToggle}
            aria-pressed={loopEnabled}
          >
            <IconLoop />
            Loop
          </button>
        )}

        {/* Mirror toggle */}
        {onMirrorToggle && (
          <button
            className={`ctrl-toggle${mirrored ? " active" : ""}`}
            onClick={onMirrorToggle}
            aria-pressed={mirrored}
          >
            <IconMirror />
            Mirror
          </button>
        )}

        {/* Fullscreen */}
        <button
          className="ctrl-fullscreen"
          onClick={handleFullscreen}
          aria-label={isFs ? "Exit fullscreen" : "Fullscreen"}
        >
          <IconFullscreen isFs={isFs} />
        </button>
      </div>
    </div>
  );
}
