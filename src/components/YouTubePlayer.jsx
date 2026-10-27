import { useState, useEffect, useRef, useCallback } from "react";
import LoopBar from "./LoopBar";
import PlayerControls from "./PlayerControls";

// Load the YouTube IFrame API
function loadYTApi(onReady) {
  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }

  if (!document.getElementById("yt-api-script")) {
    const tag = document.createElement("script");
    tag.id = "yt-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }

  window.onYouTubeIframeAPIReady = onReady;
}

function extractVideoId(url) {
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Adapter: wraps YT.Player behind the same interface as a native <video> element.
// LoopBar and PlayerControls speak only to this object — they never know it's YouTube.
function createYTAdapter(playerRef) {
  return {
    get currentTime()     { return playerRef.current.getCurrentTime() },
    set currentTime(t)    { playerRef.current.seekTo(t, true) },
    get paused()          { return playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING },
    get duration()        { return playerRef.current.getDuration() },
    play()                { playerRef.current.playVideo() },
    pause()               { playerRef.current.pauseVideo() },
    get playbackRate()    { return playerRef.current.getPlaybackRate() },
    set playbackRate(n)   { playerRef.current.setPlaybackRate(n) },
    get volume()          { return playerRef.current.getVolume() / 100 },
    set volume(n)         { playerRef.current.setVolume(n * 100) },
    get muted()           { return playerRef.current.isMuted() },
    set muted(v)          { v ? playerRef.current.mute() : playerRef.current.unMute() },
    // YT uses onStateChange instead of DOM events — no-ops keep PlayerControls happy
    addEventListener()    {},
    removeEventListener() {},
    style:                {},
  };
}

export default function YouTubePlayer() {
  const [input, setInput] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [error, setError] = useState("");
  const [mirrored, setMirrored] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [speed, setSpeed] = useState(1);

  const [isFs, setIsFs] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const isFsRef = useRef(false);

  const playerPanelRef = useRef(null);
  const containerRef   = useRef(null); // div YT replaces with iframe
  const playerRef      = useRef(null); // YT.Player instance
  const adapterRef     = useRef(null); // adapter object passed to LoopBar + PlayerControls

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      isFsRef.current = fs;
      setIsFs(fs);
      if (fs) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setControlsVisible(false), 5000);
      } else {
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

  const resetHideTimer = useCallback(() => {
    if (!isFsRef.current) return;
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 5000);
  }, []);

  function handleLoad() {
    const id = extractVideoId(input.trim());
    if (!id) {
      setError("Could not find a video ID in that URL.");
      return;
    }
    setError("");
    setVideoId(id);
  }

  useEffect(() => {
    if (!videoId) return;

    loadYTApi(() => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        adapterRef.current = null;
        setMediaReady(false);
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, controls: 0 },
        events: {
          onReady: () => {
            adapterRef.current = createYTAdapter(playerRef);
            setDuration(playerRef.current.getDuration());
            setMediaReady(true);
          },
        },
      });
    });
  }, [videoId]);

  return (
    <div
      className="yt-player-panel"
      ref={playerPanelRef}
      onMouseMove={isFs ? resetHideTimer : undefined}
      onMouseDown={isFs ? resetHideTimer : undefined}
      style={{ cursor: isFs && !controlsVisible ? "none" : undefined }}
    >
      {/* URL input row — hidden in fullscreen */}
      {!isFs && (
        <>
          <div className="yt-input-row">
            <input
              className="yt-input"
              type="url"
              placeholder="Paste a YouTube link"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            />
            <button className="yt-load-btn" onClick={handleLoad}>Load</button>
          </div>
          {error && <p style={{ color: "#FF6B4A", fontSize: "13px", margin: 0 }}>{error}</p>}
        </>
      )}

      {videoId && (
        <>
          {/* Wrapper so badges can overlay the video without being inside overflow:hidden */}
          <div className="yt-video-stack">
            <div className="video-area">
              <div
                style={{
                  width: "100%", height: "100%",
                  transform: mirrored ? "scaleX(-1)" : "none",
                  transition: "transform 200ms ease"
                }}
              >
                <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
              </div>
            </div>

            {/* Badge overlay — sibling of video-area, same size, no overflow:hidden */}
            <div className="yt-badge-overlay">
              {mirrored && <div className="video-mirror-badge">Mirrored</div>}
              {speed !== 1 && <div className="video-speed-badge">{speed}×</div>}
            </div>
          </div>

          <div
            className="fs-overlay"
            style={isFs ? {
              opacity: controlsVisible ? 1 : 0,
              transition: "opacity 400ms ease",
              pointerEvents: controlsVisible ? "all" : "none",
            } : undefined}
          >
            <LoopBar
              videoRef={adapterRef}
              duration={duration}
              mediaReady={mediaReady}
              enabled={loopEnabled}
              onEnabledChange={setLoopEnabled}
            />
            <PlayerControls
              videoRef={adapterRef}
              playerPanelRef={playerPanelRef}
              duration={duration}
              mediaReady={mediaReady}
              mirrored={mirrored}
              onMirrorToggle={() => setMirrored(m => !m)}
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
