import { useRef, useState } from "react";
import LoopBar from "./LoopBar";

export default function FilePlayer() {
  const videoRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [mirrored, setMirrored] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [duration, setDuration] = useState(0);

  // Handles file changes from user input, auto detect between video and audio
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "audio";
    setSrc(url);
    setFileType(type);
    setMirrored(false);
  }

  // Handle Speed Change
  function handleSpeedChange(s) {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
  }

  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="player-panel">
      <label className="upload-label">
        <input
          type="file"
          accept="video/*,audio/*"
          onChange={handleFileChange}
        />
        {src ? "Change file" : "Choose video or audio file"}
      </label>

      {src && (
        <>
          <div style={{ transform: mirrored ? "scaleX(-1)" : "none" }}>
            {fileType === "video" ? (
              <video
                ref={videoRef}
                src={src}
                controls
                style={{ width: "100%" }}
                onLoadedMetadata={() => setDuration(videoRef.current.duration)}
              />
            ) : (
              <audio
                ref={videoRef}
                src={src}
                controls
                onLoadedMetadata={() => setDuration(videoRef.current.duration)}
              />
            )}
          </div>

          <LoopBar videoRef={videoRef} duration={duration} />

          <div className="controls">
            <div className="control-group">
              <span>Speed</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  className={speed === s ? "active" : ""}
                  onClick={() => handleSpeedChange(s)}
                >
                  {s}×
                </button>
              ))}
            </div>

            {fileType === "video" && (
              <div className="control-group">
                <span>Mirror</span>
                <button onClick={() => setMirrored((m) => !m)}>
                  {mirrored ? "On" : "Off"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
