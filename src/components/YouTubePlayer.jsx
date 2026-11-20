import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import LoopBar from "./LoopBar";
import ShortcutsLegend from "./ShortcutsLegend";
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

// Extract YT video id
function extractVideoId(url) {
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Adapter: wraps YT.Player behind the same interface as a native <video> element.
// LoopBar and PlayerControls speak only to this object
function createYTAdapter(playerRef) {
  return {
    get currentTime() {
      return playerRef.current.getCurrentTime();
    },
    set currentTime(t) {
      playerRef.current.seekTo(t, true);
    },
    get paused() {
      return (
        playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING
      );
    },
    get duration() {
      return playerRef.current.getDuration();
    },
    play() {
      playerRef.current.playVideo();
    },
    pause() {
      playerRef.current.pauseVideo();
    },
    get playbackRate() {
      return playerRef.current.getPlaybackRate();
    },
    set playbackRate(n) {
      playerRef.current.setPlaybackRate(n);
    },
    get volume() {
      return playerRef.current.getVolume() / 100;
    },
    set volume(n) {
      playerRef.current.setVolume(n * 100);
    },
    get muted() {
      return playerRef.current.isMuted();
    },
    set muted(v) {
      v ? playerRef.current.mute() : playerRef.current.unMute();
    },
    // YT uses onStateChange instead of DOM events — no-ops keep PlayerControls happy
    addEventListener() {},
    removeEventListener() {},
    style: {},
  };
}

/**
 * STATE
 * input:           string   - raw text in the YouTube URL input field
 * videoId:         string   - extracted video ID from the URL; null until a valid URL is loaded
 * error:           string   - validation message shown when the URL has no valid video ID
 * mirrored:        boolean  - whether the video is horizontally flipped
 * duration:        number   - total video duration in seconds; set once the YT.Player is ready
 * mediaReady:      boolean  - true once YT.Player is created and loaded; gates LoopBar and PlayerControls
 * loopEnabled:     boolean  - whether loop mode is active
 * speed:           number   - current playback rate (default 1.0)
 * isFs:            boolean  - whether the player panel is in fullscreen
 * controlsVisible: boolean - true by default; set to false after 5s idle in fullscreen, reset to true on mouse activity
 *
 * REFS
 * hideTimerRef:   RefObject<ReturnType<typeof setTimeout>> - handle for the controls hide timer; cleared on mouse activity
 * isFsRef:        RefObject<boolean>        - mirror of isFs state; gives resetHideTimer stale-closure-free access to the current fullscreen value
 * playerPanelRef: RefObject<HTMLDivElement> - the player panel div; passed to the Fullscreen API in PlayerControls
 * containerRef:   RefObject<HTMLDivElement> - placeholder div that YT.Player replaces with its iframe on load
 * playerRef:      RefObject<YT.Player>      - the YT.Player instance; used to call YouTube's playback API methods
 * adapterRef:     RefObject<object>         - YT adapter wrapping YT.Player behind a native <video>-like interface; passed to LoopBar and PlayerControls
 */
const YouTubePlayer = forwardRef(function YouTubePlayer(_, ref) {
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
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const adapterRef = useRef(null);

  // Imperative handle — exposes playback controls to App.jsx keyboard handler
  useImperativeHandle(ref, () => ({
    play:             () => adapterRef.current?.play(),
    pause:            () => adapterRef.current?.pause(),
    seek:             (t) => { if (adapterRef.current) adapterRef.current.currentTime = Math.max(0, Math.min(t, adapterRef.current.duration)); },
    getTime:          () => adapterRef.current?.currentTime ?? 0,
    getDuration:      () => adapterRef.current?.duration ?? 0,
    toggleMute:       () => { if (adapterRef.current) adapterRef.current.muted = !adapterRef.current.muted; },
    getVolume:        () => adapterRef.current?.volume ?? 0.8,
    setVolume:        (v) => { if (adapterRef.current) { adapterRef.current.volume = v; if (v > 0) adapterRef.current.muted = false; } },
    toggleLoop:       () => setLoopEnabled((e) => !e),
    toggleFullscreen: () => {
      const el = playerPanelRef.current;
      if (!el) return;
      document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
    },
    isPaused: () => adapterRef.current?.paused ?? true,
  }), []);

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

  // Handles input submit, extracts id from YT link, sets error message if extraction fails
  function handleLoad() {
    const id = extractVideoId(input.trim());
    if (!id) {
      setError("Could not find a video ID in that URL.");
      return;
    }
    setError("");
    setVideoId(id);
  }

  // renders when videoId has a change in value
  useEffect(() => {
    if (!videoId) return;

    // load the YT API, runs below function when YT API is ready
    loadYTApi(() => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        adapterRef.current = null;
        setMediaReady(false);
      }

      // create the YT Player
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
          {!videoId ? (
            <div className="yt-input-hero">
              <p className="yt-input-hint">
                Paste a YouTube link to get started. Use the loop bar to mark a
                section, then adjust speed and mirror to drill the move.
              </p>
              <div className="yt-input-row">
                <input
                  className="yt-input"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLoad()}
                />
                <button className="yt-load-btn" onClick={handleLoad}>
                  Load
                </button>
              </div>
              {error && <p className="yt-input-error">{error}</p>}
            </div>
          ) : (
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
                <button className="yt-load-btn" onClick={handleLoad}>
                  Load
                </button>
              </div>
              {error && <p className="yt-input-error">{error}</p>}
            </>
          )}
        </>
      )}

      {videoId && (
        <>
          {/* Wrapper so badges can overlay the video without being inside overflow:hidden */}
          <div className="yt-video-stack">
            <div className="video-area">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: mirrored ? "scaleX(-1)" : "none",
                  transition: "transform 200ms ease",
                }}
              >
                <div
                  ref={containerRef}
                  style={{ width: "100%", height: "100%" }}
                />
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
              onMirrorToggle={() => setMirrored((m) => !m)}
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

export default YouTubePlayer;
