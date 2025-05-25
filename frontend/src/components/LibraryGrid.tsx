import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Box,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface Video {
  id: number;
  filename: string;
  s3_url: string;
  created_at: string;
}

export default function LibraryGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  const fetchVideos = async () => {
    setLoading(true);
    const token = await auth.currentUser!.getIdToken();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/videos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setVideos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
    window.addEventListener("refresh-videos", fetchVideos);
    return () => window.removeEventListener("refresh-videos", fetchVideos);
  }, []);

  const rename = async (id: number, filename: string) => {
    const token = await auth.currentUser!.getIdToken();
    await fetch(`${import.meta.env.VITE_API_URL}/videos/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });
    fetchVideos();
    setEditingId(null);
  };

  const del = async (id: number) => {
    if (!confirm("Delete this recording?")) return;
    const token = await auth.currentUser!.getIdToken();
    await fetch(`${import.meta.env.VITE_API_URL}/videos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchVideos();
  };

  if (loading)
    return (
      <Typography align="center" color="text.secondary">
        <CircularProgress sx={{ mt: 4 }} /> Loading recordings…
      </Typography>
    );

  return (
    <Grid container spacing={4}>
      {videos.map((v) => {
        const isEditing = editingId === v.id;

        return (
          <Grid item xs={12} sm={6} md={4} key={v.id}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardMedia
                component="video"
                src={v.s3_url}
                autoPlay={false}
                muted
                controls
                sx={{ height: 200, backgroundColor: "black" }}
              />

              <Box px={2} py={1}>
                {isEditing ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      variant="standard"
                      fullWidth
                    />
                    <IconButton
                      onClick={() => rename(v.id, draftName.trim())}
                      title="Save"
                      disabled={!draftName.trim()}
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton onClick={() => setEditingId(null)} title="Cancel">
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                      variant="body1"
                      sx={{ wordBreak: "break-all", maxWidth: "80%" }}
                    >
                      {v.filename}
                    </Typography>
                    <IconButton
                      onClick={() => {
                        setEditingId(v.id);
                        setDraftName(v.filename);
                      }}
                      title="Edit filename"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Box>

              <CardActions disableSpacing>
                <IconButton
                  onClick={() => location.assign(v.s3_url)}
                  title="Download"
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton onClick={() => del(v.id)} title="Delete">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
