import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Alert,
} from "@mui/material";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, pw);
      nav("/dash");
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        background: "linear-gradient(to bottom right, #14b8a6, #10b981)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper elevation={6} sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" fontWeight="bold" align="center" mb={3}>
          Register
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
            Create account
          </Button>
          <Typography align="center" mt={2} fontSize={14}>
            Already registered?{" "}
            <Link to="/login" style={{ color: "#14b8a6" }}>
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
