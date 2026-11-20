import { useState, useEffect, useRef, useCallback } from "react";

// convert seconds to string format M:SS for display
function toMSS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// convert from M:SS to seconds
function fromMSS(str) {
  const parts = str.split(":");
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s)) return null;
  return m * 60 + s;
}

/**
 * 
 * @param {object} videoRef:          ref to the media element (or YT adapter); used to seek and read currentTime
 * @param {number} duration:          total video duration in seconds
 * @param {boolean} mediaReady:       whether the media is loaded and the loop bar should be interactive
 * @param {boolean} enabled:          if loop mode is activated
 * @param {function} onEnabledChange: set function for enabled
 * 
 * localEnabled:      boolean   - local state for enabled if not pass as parameter
 * isControlled:      boolean   - true when enabled prop is passed; switches between controlled/uncontrolled
 * effectiveEnabled:  boolean   - the enabled value actually used; enabled prop if controlled, else localEnabled
 * setEnabled:        function  - the setter actually used; onEnabledChange if controlled, else setLocalEnabled
 * loopA:             number    - loop start marker position in seconds
 * loopB:             number    - loop end marker position in seconds
 * inputA:            string    - text field value for loop A in "M:SS" format
 * inputB:            string    - text field value for loop B in "M:SS" format
 * playhead           number    - current playback position in seconds
 * 
 * barRef:            RefObject<HTMLDivElement>       - the loop bar element; used for getBoundingClientRect on mouse events
 * dragging:          RefObject<"A" | "B" | null>     - which marker is currently being dragged
 * draggingRegion:    RefObject<{ startX: number, startA: number, startB: number, moved: boolean } | null> - region dragging information
 * playheadDragging:  RefObject<boolean>              - true while the playhead is being dragged
 * loopARef:          RefObject<number>               - ref kept in sync with loopA state for use in callbacks
 * loopBRef:          RefObject<number>               - ref kept in sync with loopB state for use in callbacks
 * durationRef:       RefObject<number>               - ref kept in sync with duration prop for use in callbacks
 * @returns 
 */
export default function LoopBar({ videoRef, duration, mediaReady = true, enabled = false, onEnabledChange }) {
  // If enabled/onEnabledChange not provided, manage locally (backwards-compat for YouTubePlayer)
  const [localEnabled, setLocalEnabled] = useState(false);
  const isControlled = onEnabledChange !== undefined;
  const effectiveEnabled = isControlled ? enabled : localEnabled;
  const setEnabled = isControlled
    ? onEnabledChange
    : setLocalEnabled;
  const [loopA, setLoopA] = useState(0);
  const [loopB, setLoopB] = useState(0);
  const [inputA, setInputA] = useState("0:00");
  const [inputB, setInputB] = useState("0:00");
  const [playhead, setPlayhead] = useState(0);

  const barRef = useRef(null);
  const dragging = useRef(null); // 'A' | 'B' | null
  const draggingRegion = useRef(null); // { startX, startA, startB } | null
  const playheadDragging = useRef(false);
  const loopARef = useRef(0);
  const loopBRef = useRef(0);
  const durationRef = useRef(duration);

  // Keep durationRef current so closures always see latest duration
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Sync refs whenever marker A/B changes.
  useEffect(() => {
    loopARef.current = loopA;
  }, [loopA]);

  useEffect(() => {
    loopBRef.current = loopB;
  }, [loopB]);

  // function to update both state and ref
  function updateA(val) {
    loopARef.current = val;
    setLoopA(val);
  }

  function updateB(val) {
    loopBRef.current = val;
    setLoopB(val);
  }

  // When loop is first enabled, set A/B to 25%/75% of duration
  useEffect(() => {
    if (effectiveEnabled && duration > 0) {
      const a = duration * 0.25;
      const b = duration * 0.75;
      updateA(a);
      updateB(b);
      setInputA(toMSS(a));
      setInputB(toMSS(b));
    }
  }, [effectiveEnabled, duration]);

  // Loop enforcement
  // set currenttime and playhead to marker A if out of loop region
  // function checks every second
  useEffect(() => {
    if (!videoRef.current || !mediaReady) return;
    const id = setInterval(() => {
      const t = videoRef.current.currentTime;
      if (effectiveEnabled && t >= loopBRef.current || t < loopARef.current) {
        videoRef.current.currentTime = loopARef.current;
      }
      if (!playheadDragging.current) {
        setPlayhead(videoRef.current.currentTime);
      }
    }, 100);
    return () => clearInterval(id);
  }, [effectiveEnabled, mediaReady]);

  // Get mouse position relative to the playbar
  const getPositionFromMouse = useCallback((clientX) => {
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * durationRef.current;
  }, []);

  // setting which marker user is dragging
  function handleMarkerMouseDown(marker) {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging.current = marker;
    };
  }

  // record initial info of markers, mouse position, if mouse moved
  function handleRegionMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    // Record intent to drag region, but don't commit until mouse actually moves.
    // If mouseup fires with no movement, onMouseUp treats it as a seek click.
    draggingRegion.current = {
      startX: e.clientX,
      startA: loopARef.current,
      startB: loopBRef.current,
      moved: false,
    };
  }

  // handles clicking directly on the loop bar background to seek the video (NOT dragging loop region)
  function handleBarMouseDown(e) {
    // Always seek on bar click; child handlers (marker, region, playhead) call stopPropagation
    e.preventDefault();
    const t = getPositionFromMouse(e.clientX);
    setPlayhead(t);
    if (videoRef.current) videoRef.current.currentTime = t;
    playheadDragging.current = true;
  }

  // Register global mouse listeners once — everything reads from refs
  useEffect(() => {
    function onMouseMove(e) {
      // Playhead drag
      if (playheadDragging.current) {
        const t = getPositionFromMouse(e.clientX);
        setPlayhead(t);
        videoRef.current.currentTime = t;
        return;
      }

      if (draggingRegion.current) {
        const rect = barRef.current.getBoundingClientRect();
        const delta =
          ((e.clientX - draggingRegion.current.startX) / rect.width) *
          durationRef.current;
        if (!draggingRegion.current.moved && Math.abs(e.clientX - draggingRegion.current.startX) > 3) {
          draggingRegion.current.moved = true;
        }
        if (!draggingRegion.current.moved) return;
        const gap =
          draggingRegion.current.startB - draggingRegion.current.startA;

        let newA = draggingRegion.current.startA + delta;
        let newB = draggingRegion.current.startB + delta;

        if (newA < 0) {
          newA = 0;
          newB = gap;
        }
        if (newB > durationRef.current) {
          newB = durationRef.current;
          newA = durationRef.current - gap;
        }

        updateA(newA);
        updateB(newB);
        setInputA(toMSS(newA));
        setInputB(toMSS(newB));
        return;
      }

      if (!dragging.current) return;
      const secs = getPositionFromMouse(e.clientX);
      if (dragging.current === "A") {
        updateA(secs);
        setInputA(toMSS(secs));
      } else {
        updateB(secs);
        setInputB(toMSS(secs));
      }
    }

    function onMouseUp() {
      playheadDragging.current = false;

      if (draggingRegion.current) {
        if (!draggingRegion.current.moved) {
          // No movement — treat as a seek click to where the user clicked
          const t = getPositionFromMouse(draggingRegion.current.startX);
          setPlayhead(t);
          if (videoRef.current) videoRef.current.currentTime = t;
        }
        draggingRegion.current = null;
        return;
      }
      if (!dragging.current) return;

      // Sort so A is always ≤ B
      const [sorted1, sorted2] = [loopARef.current, loopBRef.current].sort(
        (a, b) => a - b,
      );
      updateA(sorted1);
      updateB(sorted2);
      setInputA(toMSS(sorted1));
      setInputB(toMSS(sorted2));
      dragging.current = null;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function handleInputCommit(marker, value) {
    const secs = fromMSS(value);
    if (secs === null || secs < 0 || secs > durationRef.current) return;

    const a = marker === "A" ? secs : loopARef.current;
    const b = marker === "B" ? secs : loopBRef.current;

    const [sorted1, sorted2] = [a, b].sort((x, y) => x - y);
    updateA(sorted1);
    updateB(sorted2);
    setInputA(toMSS(sorted1));
    setInputB(toMSS(sorted2));
  }

  const pctA = duration > 0 ? (loopA / duration) * 100 : 25;
  const pctB = duration > 0 ? (loopB / duration) * 100 : 75;
  const pctPlayhead = duration > 0 ? (playhead / duration) * 100 : 0;

  return (
    <div className="loop-bar-wrapper">
      <div className="loop-bar" ref={barRef} onMouseDown={handleBarMouseDown}>
        {/* Orange progress fill up to playhead */}
        <div
          className="loop-progress"
          style={{ width: `${pctPlayhead}%` }}
        />

        {effectiveEnabled && (
          <>
            <div
              className="loop-region"
              style={{ left: `${pctA}%`, width: `${pctB - pctA}%` }}
              onMouseDown={handleRegionMouseDown}
            />
            <div
              className="loop-marker marker-a"
              style={{ left: `${pctA}%` }}
              onMouseDown={handleMarkerMouseDown("A")}
            />
            <div
              className="loop-marker marker-b"
              style={{ left: `${pctB}%` }}
              onMouseDown={handleMarkerMouseDown("B")}
            />
          </>
        )}

        <div
          className="loop-playhead"
          style={{ left: `${pctPlayhead}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            playheadDragging.current = true;
          }}
        />
      </div>

      {effectiveEnabled && (
        <div className="loop-timestamps">
          <label>
            A:
            <input
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              onBlur={(e) => handleInputCommit("A", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInputCommit("A", e.target.value);
                }
              }}
            />
          </label>
          <label>
            B:
            <input
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              onBlur={(e) => handleInputCommit("B", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInputCommit("B", e.target.value);
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
