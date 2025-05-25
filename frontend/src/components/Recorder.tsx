import React, { useEffect, useRef, useState, Fragment } from "react";
import { auth } from "../firebase";
import { useRecording } from "../context/RecordingContext";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
    2,
    "0"
  )}`;

export default function Recorder() {
  const { state, dispatch } = useRecording();

  const liveRef = useRef<HTMLVideoElement>(null);
  const reviewRef = useRef<HTMLVideoElement>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [title, setTitle] = useState("");

  const startCamera = async () => {
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

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (liveRef.current) liveRef.current.srcObject = stream;
      })
      .catch(() => alert("Cannot access camera/mic"));
  }, []);

  useEffect(() => {
    if (state.phase === "READY") {
      const tracks =
        (liveRef.current?.srcObject as MediaStream | null)?.getTracks() || [];
      const ended = tracks.every((t) => t.readyState === "ended");
      if (!tracks.length || ended) startCamera();
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "COUNTDOWN") return;
    if (state.countdown === 0) {
      startRecording();
      return;
    }
    const id = setTimeout(() => dispatch({ type: "TICK_COUNTDOWN" }), 1_000);
    return () => clearTimeout(id);
  }, [state.phase, state.countdown]);

  useEffect(() => {
    if (state.phase !== "REVIEW" || !state.blob || !reviewRef.current) return;
    reviewRef.current.srcObject = null;
    const url = URL.createObjectURL(state.blob);
    reviewRef.current.src = url;
    reviewRef.current.play();
    return () => URL.revokeObjectURL(url);
  }, [state.phase, state.blob]);

  const startRecording = () => {
    if (!liveRef.current?.srcObject) return;

    chunksRef.current = [];

    const mr = new MediaRecorder(liveRef.current.srcObject as MediaStream, {
      mimeType: "video/webm",
    });

    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);

    mr.onstop = () => {
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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        {state.phase === "REVIEW" ? (
          <video
            key="review"
            ref={reviewRef}
            controls
            style={{
              width: "100%",
              maxWidth: "960px",
              aspectRatio: "16/9",
              background: "black",
              borderRadius: 12,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            }}
          />
        ) : (
          <video
            key="live"
            ref={liveRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              maxWidth: "960px",
              aspectRatio: "16/9",
              background: "black",
              borderRadius: 12,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            }}
          />
        )}

        {state.phase === "COUNTDOWN" && (
          <Typography
            variant="h2"
            color="white"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              backdropFilter: "brightness(50%)",
            }}
          >
            {state.countdown}
          </Typography>
        )}
      </Box>

      <Paper sx={{ p: 3 }}>
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
      </Paper>
    </Box>
  );
}

/* ———————————————————— Toolbar Component ———————————————————— */

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
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
      {phase === "READY" && (
        <Button variant="contained" color="primary" onClick={startCountdown}>
          ▶️ Start Recording
        </Button>
      )}

      {phase === "RECORDING" && (
        <Fragment>
          <Typography
            fontFamily="monospace"
            fontWeight="bold"
            color="error"
            display="flex"
            alignItems="center"
          >
            <span style={{ marginRight: 8 }}>●</span> {fmt(timer)}
          </Typography>
          <Button variant="contained" color="error" onClick={stopRecording}>
            ⏹ Stop
          </Button>
        </Fragment>
      )}

      {phase === "REVIEW" && (
        <Fragment>
          <TextField
            label="Recording title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={upload}
            disabled={!title.trim()}
          >
            💾 Save
          </Button>
          <Button variant="outlined" color="secondary" onClick={discard}>
            🗑 Discard
          </Button>
        </Fragment>
      )}

      {phase === "UPLOADING" && (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography color="primary">Uploading…</Typography>
        </Stack>
      )}
    </Stack>
  );
}
