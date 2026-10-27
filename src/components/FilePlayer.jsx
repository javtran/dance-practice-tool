import { useRef, useState, useEffect, useCallback } from "react";
import { IconVideo, IconUpload, IconAudioPlaceholder } from "./icons";
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
      {/* File picker */}
      {!isFs && ( 
        src ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="file-chip">
              <IconVideo />
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
          </div>
        ) : (
          <div className="yt-input-hero">
            <p className="yt-input-hint">Upload a video or audio file to get started. Use the loop bar to mark a section, then adjust speed and mirror to drill the move.</p>
            <label className="upload-zone upload-zone-hero">
              <IconUpload />
              Choose a video or audio file
              <input
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )
      )}

      {src && (
        <>
          {/* Grid stack: video-area and badge-overlay*/}
          <div className="yt-video-stack">
            {/* video area */}
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
                  <IconAudioPlaceholder />
                </div>
              )}
            </div>
            {/* Badge overlay*/}
            <div className="yt-badge-overlay">
              {mirrored && fileType === "video" && (
                <div className="video-mirror-badge">Mirrored</div>
              )}
              {speed !== 1 && (
                <div className="video-speed-badge">{speed}×</div>
              )}
            </div>
          </div>

          {/* Controls */}
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
