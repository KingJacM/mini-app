// src/components/Recorder.tsx
import React, { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";

type Phase = "IDLE" | "RECORDING" | "PREVIEW";

export default function Recorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [chunks, setChunks] = useState<Blob[]>([]);
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [filename, setFilename] = useState("");

  /* ---------- set up camera ---------- */
  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => alert("Camera or microphone access denied."));
  }, []);

  /* ---------- handlers ---------- */
  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;

    const mr = new MediaRecorder(videoRef.current.srcObject as MediaStream, {
      mimeType: "video/webm",
    });
    mr.ondataavailable = (e) =>
      setChunks((prev) => [...prev, e.data as Blob]);
    mr.onstop = () => setPhase("PREVIEW");
    mr.start();

    mediaRecorderRef.current = mr;
    setChunks([]);
    setPhase("RECORDING");
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  const discard = () => {
    setChunks([]);
    setFilename("");
    setPhase("IDLE");
  };

  const save = async () => {
    if (!chunks.length) return;
    const user = auth.currentUser;
    if (!user) return alert("You’re not logged in.");

    const blob = new Blob(chunks, { type: "video/webm" });
    const form = new FormData();
    form.append("file", blob, `${filename || "untitled"}.webm`);
    form.append("filename", filename || "Untitled recording");

    const token = await user.getIdToken();
    await fetch(`${import.meta.env.VITE_API_URL}/videos/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    window.dispatchEvent(new Event("refresh-videos"));
    discard();
  };

  /* ---------- render ---------- */
  return (
    <section className="mb-10 space-y-4">
      {/* live preview or playback */}
      <video
        ref={videoRef}
        autoPlay
        muted={phase !== "PREVIEW"}
        controls={phase === "PREVIEW"}
        className="w-full max-w-4xl aspect-video bg-black rounded-xl shadow-lg"
      />

      {/* controls */}
      {phase === "IDLE" && (
        <button className="btn-primary" onClick={startRecording}>
          ▶️ Start recording
        </button>
      )}

      {phase === "RECORDING" && (
        <button className="btn-danger" onClick={stopRecording}>
          ⏹ Stop
        </button>
      )}

      {phase === "PREVIEW" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Recording title…"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
          <button
            className="btn-primary disabled:opacity-40"
            disabled={!filename.trim()}
            onClick={save}
          >
            💾 Save
          </button>
          <button className="btn-secondary" onClick={discard}>
            🗑 Discard
          </button>
        </div>
      )}
    </section>
  );
}
