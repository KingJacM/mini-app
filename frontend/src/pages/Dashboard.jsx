import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import Recorder from "../components/Recorder";
import VideoList from "../components/VideoList";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🎥 My Recordings</h1>
        <button className="btn-secondary" onClick={()=>signOut(auth)}>Sign out</button>
      </header>
      <Recorder />
      <VideoList />
    </div>
  );
}
