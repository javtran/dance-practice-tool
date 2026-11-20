import { useState, useEffect } from "react";
import { IconPlay, IconPause, IconVolume, IconLoop, IconMirror, IconFullscreen } from "./icons";

// convert seconds to m:ss string format
function toMSS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * 
 * @param {object} videoRef:         ref to the media element (or YT adapter); used to read/set playback state
 * @param {object} playerPanelRef:   ref to the player panel div; passed to the Fullscreen API
 * @param {number} duration:         total video duration in seconds
 * @param {boolean} mediaReady:      whether the media is loaded and controls should be enabled
 * @param {boolean} mirrored:        whether the video is currently mirrored
 * @param {function} onMirrorToggle: callback to toggle mirror state in the parent
 * @param {function} onSpeedChange:  callback fired with the new speed value when user changes speed
 * @param {boolean} loopEnabled:     whether loop mode is active
 * @param {function} onLoopToggle:   callback to toggle loop mode in the parent
 * 
 * playing:     boolean — true while the media is playing; drives the play/pause icon
 * currentTime: number  — current playback position in seconds; updates on timeupdate event
 * volume:      number  — current volume 0–1; shown in the volume slider
 * muted:       boolean — whether audio is muted; drives the volume icon
 * speed:       number  — current playback rate (default 1.0); local copy for the speed display
 * isFs:        boolean — whether the player panel is in fullscreen       
 * @returns 
 */
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
    const onVolumeChange = () => {
      setMuted(video.muted);
      if (!video.muted) setVolume(video.volume);
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("click", onClick);
    video.addEventListener("volumechange", onVolumeChange);
    video.style.cursor = "pointer";
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("click", onClick);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, [mediaReady]);

  // Poll currentTime + playing state (also covers YT adapter)
  useEffect(() => {
    if (!mediaReady) return;
    const id = setInterval(() => {
      if (!videoRef.current) return;
      setCurrentTime(videoRef.current.currentTime);
      setPlaying(!videoRef.current.paused);
      // Keep mute/volume in sync for YT adapter (no volumechange DOM event)
      setMuted(videoRef.current.muted);
      if (!videoRef.current.muted) setVolume(videoRef.current.volume);
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
