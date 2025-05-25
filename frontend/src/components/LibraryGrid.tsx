import React from "react";
import { useEffect, useState } from "react";
import { auth } from "../firebase";

interface Video {
  id: number;
  filename: string;
  s3_url: string;
  created_at: string;
}

export default function LibraryGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    setLoading(true);
    const token = await auth.currentUser!.getIdToken();
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/videos`, {
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
    return <p className="text-center text-gray-500">Loading recordings…</p>;

  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((v) => (
        <li key={v.id} className="rounded-xl overflow-hidden shadow group">
          <div className="relative">
            <video
              src={v.s3_url}
              className="w-full aspect-video object-cover pointer-events-none"
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition">
              <button
                title="Download"
                onClick={() => location.assign(v.s3_url)}
                className="icon-btn"
              >
                ⬇️
              </button>
              <button
                title="Delete"
                onClick={() => del(v.id)}
                className="icon-btn"
              >
                🗑
              </button>
            </div>
          </div>
          <input
            className="w-full px-4 py-2 font-semibold text-center hover:bg-gray-50 focus:bg-white focus:ring"
            defaultValue={v.filename}
            onBlur={(e) => rename(v.id, e.target.value)}
          />
        </li>
      ))}
    </ul>
  );
}
