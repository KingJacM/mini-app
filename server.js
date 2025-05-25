const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const certOptions = {
  key: fs.readFileSync(path.join(__dirname, "cert/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert/cert.pem")),
};

app.use(express.static(path.join(__dirname, "frontend/dist")));

https.createServer(certOptions, app).listen(PORT, () => {
  console.log(`✅ HTTPS server running at https://54.252.156.241:3000`);
});
