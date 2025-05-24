import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      nav("/dash");
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
      <form onSubmit={handle} className="bg-white p-8 rounded-2xl shadow-xl w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        {err && <p className="text-red-600 text-sm mb-2">{err}</p>}
        <input className="input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        <input className="input mt-3" placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} required/>
        <button className="btn-primary w-full mt-6">Sign in</button>
        <p className="text-center text-sm mt-4">
          No account? <Link className="text-indigo-600" to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
