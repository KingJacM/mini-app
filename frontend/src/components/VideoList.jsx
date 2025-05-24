import { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function VideoList() {
  const [videos, setVideos] = useState([]);
  const [err, setErr] = useState("");

  const fetchVideos = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(import.meta.env.VITE_API_URL + "/videos", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setVideos(data);
    } catch (ex) { setErr("Failed to load videos"); }
  };

  useEffect(() => {
    fetchVideos();
    window.addEventListener("refresh-videos", fetchVideos);
    return ()=>window.removeEventListener("refresh-videos", fetchVideos);
  }, []);

  const rename = async (id, filename) => {
    const token = await auth.currentUser.getIdToken();
    await fetch(import.meta.env.VITE_API_URL + `/videos/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });
    fetchVideos();
  };

  const del = async (id) => {
    if (!confirm("Delete this recording?")) return;
    const token = await auth.currentUser.getIdToken();
    await fetch(import.meta.env.VITE_API_URL + `/videos/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    fetchVideos();
  };

  if (err) return <div className="alert-error">{err}</div>;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map(v => (
        <div key={v.id} className="border rounded-xl p-3 shadow-sm flex flex-col">
          <video src={v.s3_url} controls className="rounded mb-2"></video>
          <input className="input text-center font-semibold" defaultValue={v.filename}
                 onBlur={e=>rename(v.id, e.target.value)} />
          <div className="flex justify-between mt-2 text-sm">
            <a href={v.s3_url} download className="link">Download</a>
            <button className="text-red-600" onClick={()=>del(v.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
