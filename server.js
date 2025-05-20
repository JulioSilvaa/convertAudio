const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => res.json({ message: "API Rodando" }));

app.post("/convert-audio", upload.single("file"), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `converted/${req.file.filename}.ogg`;

  ffmpeg(inputPath)
    .audioCodec("libopus")
    .outputOptions([
      "-vn",
      "-b:a 32k",
      "-vbr on",
      "-compression_level 10",
      "-frame_duration 60",
      "-application voip",
    ])
    .save(outputPath)
    .on("end", () => {
      res.sendFile(path.resolve(outputPath), () => {
        fs.unlinkSync(inputPath); // limpa arquivos temporários
        fs.unlinkSync(outputPath);
      });
    })
    .on("error", (err) => {
      res.status(500).json({ error: err.message });
    });
});

app.listen(3000, () => {
  console.log("API rodando na porta 3000");
});
