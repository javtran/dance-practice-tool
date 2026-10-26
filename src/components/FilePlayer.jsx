import { useRef, useState } from "react";
import LoopBar from "./LoopBar";
import PlayerControls from "./PlayerControls";

export default function FilePlayer() {
  const videoRef = useRef(null);
  const playerPanelRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [mirrored, setMirrored] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [duration, setDuration] = useState(0);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "audio";
    setSrc(url);
    setFileType(type);
    setMirrored(false);
  }

  return (
    <div className="player-panel" ref={playerPanelRef}>
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
                style={{ width: "100%" }}
                onLoadedMetadata={() => setDuration(videoRef.current.duration)}
              />
            ) : (
              <audio
                ref={videoRef}
                src={src}
                onLoadedMetadata={() => setDuration(videoRef.current.duration)}
              />
            )}
          </div>

          <LoopBar videoRef={videoRef} duration={duration} />
          <PlayerControls
            videoRef={videoRef}
            playerPanelRef={playerPanelRef}
            duration={duration}
          />

          {fileType === "video" && (
            <div className="controls">
              <div className="control-group">
                <span>Mirror</span>
                <button onClick={() => setMirrored((m) => !m)}>
                  {mirrored ? "On" : "Off"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
