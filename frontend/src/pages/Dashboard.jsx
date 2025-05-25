import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import Recorder from "../components/Recorder";
import LibraryGrid from "../components/LibraryGrid";
import { RecordingProvider } from "../context/RecordingContext";
import {
  Container,
  Typography,
  Box,
  Divider,
  Button,
  Stack,
} from "@mui/material";

export default function Dashboard() {
  return (
    <RecordingProvider>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">
            🎥 My Recordings
          </Typography>
          <Button variant="outlined" onClick={() => signOut(auth)}>
            Sign Out
          </Button>
        </Stack>

        {/* Record Section */}
        <Box mb={6}>
          <Typography variant="h6" gutterBottom>
            Record a New Video
          </Typography>
          <Recorder />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Library Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Your Recordings
          </Typography>
          <LibraryGrid />
        </Box>
      </Container>
    </RecordingProvider>
  );
}
