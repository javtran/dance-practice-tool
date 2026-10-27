import { useRef, useState, useEffect, useCallback } from "react";
import LoopBar from "./LoopBar";
import PlayerControls from "./PlayerControls";

export default function FilePlayer() {
  const videoRef = useRef(null);
  const playerPanelRef = useRef(null);
  const fileInputRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [mirrored, setMirrored] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const isFsRef = useRef(false);

  // Track fullscreen state — keep a ref in sync so the timer callback is never stale
  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      isFsRef.current = fs;
      setIsFs(fs);
      if (fs) {
        // Entered fullscreen — start the hide timer immediately
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setControlsVisible(false), 5000);
      } else {
        // Left fullscreen — always show controls
        clearTimeout(hideTimerRef.current);
        setControlsVisible(true);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Show controls and restart the 5s timer — reads isFsRef so it's never stale
  const resetHideTimer = useCallback(() => {
    if (!isFsRef.current) return;
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 5000);
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "audio";
    setSrc(url);
    setFileName(file.name);
    setFileType(type);
    setMirrored(false);
    setDuration(0);
  }

  return (
    <div
      className="player-panel"
      ref={playerPanelRef}
      onMouseMove={isFs ? resetHideTimer : undefined}
      style={{ cursor: isFs && !controlsVisible ? "none" : undefined }}
    >
      {/* File picker / chip — shown above the video */}
      {!isFs && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {src ? (
            <div className="file-chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9BA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="13" height="14" rx="2"/>
                <path d="M16 10l5-3v10l-5-3"/>
              </svg>
              <span className="file-chip-name">{fileName}</span>
              <button className="file-chip-btn" onClick={() => fileInputRef.current?.click()}>
                Change
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <label className="upload-zone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Choose a video or audio file
              <input
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      )}

      {src && (
        <>
          {/* Grid stack: video-area and badge-overlay share the same cell */}
          <div className="yt-video-stack">
            <div className="video-area">
              {fileType === "video" ? (
                <video
                  ref={videoRef}
                  src={src}
                  style={{
                    width: "100%", height: "100%", objectFit: "contain",
                    transform: mirrored ? "scaleX(-1)" : "none",
                    transition: "transform 200ms ease"
                  }}
                  onLoadedMetadata={() => setDuration(videoRef.current.duration)}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                  <audio
                    ref={videoRef}
                    src={src}
                    style={{ width: "80%" }}
                    controls={false}
                    onLoadedMetadata={() => setDuration(videoRef.current.duration)}
                  />
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3A3B44" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
              )}
            </div>
            {/* Badge overlay: outside overflow:hidden, not inside mirrored element */}
            <div className="yt-badge-overlay">
              {mirrored && fileType === "video" && (
                <div className="video-mirror-badge">Mirrored</div>
              )}
              {speed !== 1 && (
                <div className="video-speed-badge">{speed}×</div>
              )}
            </div>
          </div>

          {/* Controls — fade out in fullscreen when inactive */}
          <div
            className="fs-overlay"
            style={isFs ? {
              opacity: controlsVisible ? 1 : 0,
              transition: "opacity 400ms ease",
              pointerEvents: controlsVisible ? "all" : "none",
            } : undefined}
          >
            <LoopBar
              videoRef={videoRef}
              duration={duration}
              enabled={loopEnabled}
              onEnabledChange={setLoopEnabled}
            />
            <PlayerControls
              videoRef={videoRef}
              playerPanelRef={playerPanelRef}
              duration={duration}
              mirrored={mirrored}
              onMirrorToggle={fileType === "video" ? () => setMirrored(m => !m) : null}
              onSpeedChange={setSpeed}
              loopEnabled={loopEnabled}
              onLoopToggle={() => setLoopEnabled(e => !e)}
            />
          </div>
        </>
      )}
    </div>
  );
}
