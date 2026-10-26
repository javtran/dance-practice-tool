import { useState, useEffect } from "react";

function toMSS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function PlayerControls({ videoRef, playerPanelRef, duration }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Sync playing state from video events + click to play/pause
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
  }, [videoRef.current]);

  // Poll currentTime
  useEffect(() => {
    const id = setInterval(() => {
      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
    }, 100);
    return () => clearInterval(id);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    playing ? video.pause() : video.play();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  }

  function handleVolume(e) {
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    setMuted(val === 0);
  }

  function handleSpeed(e) {
    const val = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.playbackRate = val;
    setSpeed(val);
  }

  function handleFullscreen() {
    const el = playerPanelRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  return (
    <div className="player-controls">
      <button className="ctrl-btn" onClick={togglePlay}>
        {playing ? "⏸" : "▶"}
      </button>

      <span className="ctrl-time">
        {toMSS(currentTime)} / {toMSS(duration)}
      </span>

      <div className="ctrl-volume-wrapper">
        <button className="ctrl-btn" onClick={toggleMute}>
          {muted || volume === 0 ? "🔇" : "🔊"}
        </button>
        <div className="ctrl-volume-slider">
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={muted ? 0 : volume}
            onChange={handleVolume}
          />
        </div>
      </div>

      <div className="ctrl-speed-wrapper">
        <button className="ctrl-btn ctrl-speed-label">{speed}×</button>
        <div className="ctrl-speed-slider">
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            value={speed}
            onChange={handleSpeed}
          />
        </div>
      </div>

      <button className="ctrl-btn ctrl-btn-fullscreen" onClick={handleFullscreen}>
        ⛶
      </button>
    </div>
  );
}
