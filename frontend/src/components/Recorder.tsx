import React, {
  useEffect,
  useRef,
  useState,
  Fragment,
} from "react";
import { auth } from "../firebase";
import { useRecording } from "../context/RecordingContext";

/* helper: nicely format mm:ss */
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
    2,
    "0",
  )}`;



export default function Recorder() {
  const { state, dispatch } = useRecording();

  const liveRef = useRef<HTMLVideoElement>(null);
  const reviewRef = useRef<HTMLVideoElement>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [title, setTitle] = useState("");
  /* ------------ helper to start camera ------------ */
  const startCamera = async () => {                     // 🔄 ADDED
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (liveRef.current) liveRef.current.srcObject = stream;
    } catch {
      alert("Cannot access camera/mic");
    }
  };
  /* ---------- boot camera feed once ---------- */
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (liveRef.current) liveRef.current.srcObject = stream;
      })
      .catch(() => alert("Cannot access camera/mic"));
  }, []);


  /* ---------- start camera if READY phase ---------- */
  useEffect(() => {
    if (state.phase === "READY") {
      const tracks = (liveRef.current?.srcObject as MediaStream | null)?.getTracks() || [];
      const ended  = tracks.every((t) => t.readyState === "ended");
      if (!tracks.length || ended) startCamera();
    }
  }, [state.phase]);
  
  /* -------------------------------------------------- */


  /* ---------- countdown → start recording ---------- */
  useEffect(() => {
    if (state.phase !== "COUNTDOWN") return;
    if (state.countdown === 0) {
      startRecording();
      return;
    }
    const id = setTimeout(() => dispatch({ type: "TICK_COUNTDOWN" }), 1_000);
    return () => clearTimeout(id);
  }, [state.phase, state.countdown]);

  /* ---------- show blob preview in REVIEW ---------- */
  useEffect(() => {
    if (state.phase !== "REVIEW" || !state.blob || !reviewRef.current) return;
    reviewRef.current.srcObject = null;            // ✅ clear old stream
    const url = URL.createObjectURL(state.blob);
    reviewRef.current.src = url;
    reviewRef.current.play();
    return () => URL.revokeObjectURL(url);
  }, [state.phase, state.blob]);

  /* ------------------------------------------------------------------ */
  const startRecording = () => {
    if (!liveRef.current?.srcObject) return;

    chunksRef.current = [];

    const mr = new MediaRecorder(liveRef.current.srcObject as MediaStream, {
      mimeType: "video/webm",
    });

    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);

    mr.onstop = () => {
      /* stop camera tracks so webcam freezes */
      (liveRef.current?.srcObject as MediaStream)
        ?.getTracks()
        .forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      dispatch({ type: "STOP_RECORDING", blob });
    };

    mr.start();
    mediaRecorder.current = mr;
    dispatch({ type: "START_RECORDING" });
  };

  const stopRecording = () => mediaRecorder.current?.stop();
  const discard = () => dispatch({ type: "DISCARD" });

  const upload = async () => {
    if (!state.blob) return;
    dispatch({ type: "UPLOAD_START" });

    try {
      const form = new FormData();
      form.append("file", state.blob, `${title || "untitled"}.webm`);
      form.append("filename", title || "Untitled recording");

      const token = await auth.currentUser!.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/videos/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      window.dispatchEvent(new Event("refresh-videos"));
      dispatch({ type: "UPLOAD_SUCCESS" });
      setTitle("");
    } catch {
      dispatch({ type: "UPLOAD_FAIL" });
      alert("Upload failed – please try again.");
    }
  };
  /* ------------------------------------------------------------------ */

  return (
    <section className="mb-10 space-y-4">
      {/* ---------- video area (key forces remount) ---------- */}
      {state.phase === "REVIEW" ? (
        <video
          key="review"                 /* ✅ remounts → no srcObject */
          ref={reviewRef}
          controls
          className="w-full max-w-4xl aspect-video bg-black rounded-xl shadow-xl"
        />
      ) : (
        <video
          key="live"
          ref={liveRef}
          autoPlay
          muted
          playsInline
          className="w-full max-w-4xl aspect-video bg-black rounded-xl shadow-xl"
        />
      )}

      {/* overlay countdown */}
      {state.phase === "COUNTDOWN" && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-7xl font-bold backdrop-brightness-50 select-none">
          {state.countdown}
        </div>
      )}

      {/* ---------- toolbar ---------- */}
      <Toolbar
        phase={state.phase}
        timer={state.timer}
        startCountdown={() => dispatch({ type: "START_COUNTDOWN" })}
        stopRecording={stopRecording}
        discard={discard}
        upload={upload}
        title={title}
        setTitle={setTitle}
      />
    </section>
  );
}

/* ————————————————— toolbar ————————————————— */

function Toolbar(props: {
  phase: string;
  timer: number;
  startCountdown: () => void;
  stopRecording: () => void;
  discard: () => void;
  upload: () => void;
  title: string;
  setTitle: (s: string) => void;
}) {
  const {
    phase,
    timer,
    startCountdown,
    stopRecording,
    discard,
    upload,
    title,
    setTitle,
  } = props;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      {phase === "READY" && (
        <button className="btn-primary" onClick={startCountdown}>
          ▶️ Record
        </button>
      )}

      {phase === "RECORDING" && (
        <Fragment>
          <div className="flex items-center gap-2 font-mono text-red-600">
            <span className="animate-pulse">●</span>
            {fmt(timer)}
          </div>
          <button className="btn-danger" onClick={stopRecording}>
            ⏹ Stop
          </button>
        </Fragment>
      )}

      {phase === "REVIEW" && (
        <Fragment>
          <input
            className="input flex-1"
            placeholder="Recording title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            className="btn-primary disabled:opacity-40"
            disabled={!title.trim()}
            onClick={upload}
          >
            💾 Save
          </button>
          <button className="btn-secondary" onClick={discard}>
            🗑 Discard
          </button>
        </Fragment>
      )}

      {phase === "UPLOADING" && (
        <span className="text-indigo-600 animate-pulse">Uploading…</span>
      )}
    </div>
  );
}
