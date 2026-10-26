import { useState, useEffect, useRef, useCallback } from "react";

function toMSS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function fromMSS(str) {
  const parts = str.split(":");
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s)) return null;
  return m * 60 + s;
}

export default function LoopBar({ videoRef, duration }) {
  const [enabled, setEnabled] = useState(false);
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

  // Sync refs whenever state changes (e.g. on enable)
  useEffect(() => {
    loopARef.current = loopA;
  }, [loopA]);
  useEffect(() => {
    loopBRef.current = loopB;
  }, [loopB]);

  // Helper: update both state and ref together
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
    if (enabled && duration > 0) {
      const a = duration * 0.25;
      const b = duration * 0.75;
      updateA(a);
      updateB(b);
      setInputA(toMSS(a));
      setInputB(toMSS(b));
    }
  }, [enabled, duration]);

  // Loop enforcement + playhead sync
  useEffect(() => {
    if (!videoRef.current) return;
    const id = setInterval(() => {
      const t = videoRef.current.currentTime;
      if (enabled && !videoRef.current.paused && (t >= loopBRef.current || t < loopARef.current)) {
        videoRef.current.currentTime = loopARef.current;
      }
      if (!playheadDragging.current) {
        setPlayhead(videoRef.current.currentTime);
      }
    }, 100);
    return () => clearInterval(id);
  }, [enabled]);

  const getPositionFromMouse = useCallback((clientX) => {
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * durationRef.current;
  }, []);

  function handleMarkerMouseDown(marker) {
    return (e) => {
      e.preventDefault();
      dragging.current = marker;
    };
  }

  function handleRegionMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    draggingRegion.current = {
      startX: e.clientX,
      startA: loopARef.current,
      startB: loopBRef.current,
    };
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
      <button
        className={`toggle-btn ${enabled ? "active" : ""}`}
        onClick={() => setEnabled((e) => !e)}
      >
        Loop {enabled ? "On" : "Off"}
      </button>

      <div className="loop-bar" ref={barRef}>
        {enabled && (
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

      {enabled && (
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
