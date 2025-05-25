import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import Recorder from "../components/Recorder";
import LibraryGrid from "../components/LibraryGrid";
import { RecordingProvider } from "../context/RecordingContext";

export default function Dashboard() {
  return (
    <RecordingProvider>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">🎥 My Recordings</h1>
          <button className="btn-secondary" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </header>

        <Recorder />
        <LibraryGrid />
      </div>
    </RecordingProvider>
  );
}
