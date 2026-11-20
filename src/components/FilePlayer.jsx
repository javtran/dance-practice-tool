import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { IconVideo, IconUpload, IconAudioPlaceholder } from "./icons";
import LoopBar from "./LoopBar";
import ShortcutsLegend from "./ShortcutsLegend";
import PlayerControls from "./PlayerControls";

/**
 * STATE
 * src:             string            - blob URL of the loaded file; null until a file is selected
 * fileName:        string            - display name of the loaded file
 * mirrored:        boolean           - whether the video is horizontally flipped
 * fileType:        "audio" | "video" - media type of the loaded file; determines which element to render
 * duration:        number            - total media duration in seconds; set once the media is loaded
 * speed:           number            - current playback rate (default 1.0)
 * loopEnabled:     boolean           - whether loop mode is active
 * isFs:            boolean           - whether the player panel is in fullscreen
 * controlsVisible: boolean           - true by default; set to false after 5s idle in fullscreen, reset to true on mouse activity
 *
 * REFS
 * videoRef:        RefObject<HTMLVideoElement | HTMLAudioElement> - the media element; used to control playback and seek
 * playerPanelRef:  RefObject<HTMLDivElement>                      - the player panel div; passed to the Fullscreen API in PlayerControls
 * fileInputRef:    RefObject<HTMLInputElement>                    - the hidden file input; .click() is called on it to open the file picker
 * hideTimerRef:    RefObject<ReturnType<typeof setTimeout>>       - handle for the controls hide timer; cleared on mouse activity
 * isFsRef:         RefObject<boolean>                             - mirror of isFs state; gives resetHideTimer stale-closure-free access to the current fullscreen value
 */
const FilePlayer = forwardRef(function FilePlayer(_, ref) {
  const videoRef = useRef(null);
  const playerPanelRef = useRef(null);
  const fileInputRef = useRef(null);
  const hideTimerRef = useRef(null);
  const isFsRef = useRef(false);

  // Imperative handle — exposes playback controls to App.jsx keyboard handler
  useImperativeHandle(ref, () => ({
    play:             () => videoRef.current?.play(),
    pause:            () => videoRef.current?.pause(),
    seek:             (t) => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(t, videoRef.current.duration)); },
    getTime:          () => videoRef.current?.currentTime ?? 0,
    getDuration:      () => videoRef.current?.duration ?? 0,
    toggleMute:       () => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; },
    getVolume:        () => videoRef.current?.volume ?? 0.8,
    setVolume:        (v) => { if (videoRef.current) { videoRef.current.volume = v; if (v > 0) videoRef.current.muted = false; } },
    toggleLoop:       () => setLoopEnabled((e) => !e),
    toggleFullscreen: () => {
      const el = playerPanelRef.current;
      if (!el) return;
      document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
    },
    isPaused: () => videoRef.current?.paused ?? true,
  }), []);

  const [src, setSrc] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [mirrored, setMirrored] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Track fullscreen state — keep a ref in sync so the timer callback is never stale
  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      isFsRef.current = fs;
      setIsFs(fs);
      if (fs) {
        // Entered fullscreen — start the hide timer immediately
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(
          () => setControlsVisible(false),
          5000,
        );
      } else {
        // Left fullscreen — always show controls
        clearTimeout(hideTimerRef.current);
        setControlsVisible(true);
      }
    };
    document.addEventListener("fullscreenchange", onChange);

    // clear off hide timer if not in full screen
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

  // set all needed data when file changed
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
      {!isFs &&
        (src ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="file-chip">
              <IconVideo />
              <span className="file-chip-name">{fileName}</span>
              <button
                className="file-chip-btn"
                onClick={() => fileInputRef.current?.click()}
              >
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
            <p className="yt-input-hint">
              Upload a video or audio file to get started. Use the loop bar to
              mark a section, then adjust speed and mirror to drill the move.
            </p>
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
        ))}

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
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: mirrored ? "scaleX(-1)" : "none",
                    transition: "transform 200ms ease",
                  }}
                  onLoadedMetadata={() =>
                    setDuration(videoRef.current.duration)
                  }
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <audio
                    ref={videoRef}
                    src={src}
                    style={{ width: "80%" }}
                    controls={false}
                    onLoadedMetadata={() =>
                      setDuration(videoRef.current.duration)
                    }
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
              {speed !== 1 && <div className="video-speed-badge">{speed}×</div>}
            </div>
          </div>

          {/* Controls */}
          <div
            className="fs-overlay"
            style={
              isFs
                ? {
                    opacity: controlsVisible ? 1 : 0,
                    transition: "opacity 400ms ease",
                    pointerEvents: controlsVisible ? "all" : "none",
                  }
                : undefined
            }
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
              onMirrorToggle={
                fileType === "video" ? () => setMirrored((m) => !m) : null
              }
              onSpeedChange={setSpeed}
              loopEnabled={loopEnabled}
              onLoopToggle={() => setLoopEnabled((e) => !e)}
            />
          </div>
          {!isFs && <ShortcutsLegend />}
        </>
      )}
    </div>
  );
});

export default FilePlayer;
