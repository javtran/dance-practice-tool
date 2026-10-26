import { useState, useEffect, useRef } from "react";
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

  const playerPanelRef = useRef(null);
  const containerRef   = useRef(null); // div YT replaces with iframe
  const playerRef      = useRef(null); // YT.Player instance
  const adapterRef     = useRef(null); // adapter object passed to LoopBar + PlayerControls

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
    <div className="player-panel" ref={playerPanelRef}>
      <div className="url-row">
        <input
          type="text"
          placeholder="Paste YouTube URL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
        />
        <button onClick={handleLoad}>Load</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {videoId && (
        <>
          <div style={{ transform: mirrored ? "scaleX(-1)" : "none" }}>
            <div
              ref={containerRef}
              style={{ width: "100%", aspectRatio: "16/9" }}
            />
          </div>

          <LoopBar videoRef={adapterRef} duration={duration} mediaReady={mediaReady} />
          <PlayerControls
            videoRef={adapterRef}
            playerPanelRef={playerPanelRef}
            duration={duration}
            mediaReady={mediaReady}
          />

          <div className="controls">
            <div className="control-group">
              <span>Mirror</span>
              <button onClick={() => setMirrored((m) => !m)}>
                {mirrored ? "On" : "Off"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
