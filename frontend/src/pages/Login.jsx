import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
} from "@mui/material";

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
    <Box
      sx={{
        height: "100vh",
        background: "linear-gradient(to bottom right, #6366f1, #8b5cf6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper elevation={6} sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" fontWeight="bold" align="center" mb={3}>
          Login
        </Typography>
        {err && <Alert severity="error">{err}</Alert>}
        <Box component="form" onSubmit={handle} mt={2}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
          >
            Sign in
          </Button>
          <Typography align="center" mt={2} fontSize={14}>
            No account?{" "}
            <Link to="/register" style={{ color: "#6366f1" }}>
              Register
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
