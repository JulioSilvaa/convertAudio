const express = require("express");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Rodando com Descriptografia" });
});

app.post("/convert-audio", async (req, res) => {
  const { mediaKey, mimetype, url } = req.body;

  if (!mediaKey || !mimetype || !url) {
    return res.status(400).json({
      error: "Parâmetros obrigatórios ausentes: mediaKey, mimetype e url.",
    });
  }

  try {
    const msgStub = {
      audioMessage: {
        mediaKey,
        mimetype,
        url,
        fileLength: 99999, // pode ser qualquer valor
        mediaSha256: Buffer.alloc(32), // stub
      },
    };

    const buffer = await downloadMediaMessage(msgStub.audioMessage, "buffer");

    const timestamp = Date.now();
    const inputPath = `uploads/audio-${timestamp}.ogg`;
    const outputPath = `converted/audio-${timestamp}-converted.ogg`;

    fs.writeFileSync(inputPath, buffer);

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
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      })
      .on("error", (err) => {
        console.error("Erro ao converter:", err);
        res.status(500).json({ error: err.message });
        fs.existsSync(inputPath) && fs.unlinkSync(inputPath);
      });
  } catch (err) {
    console.error("Erro na descriptografia:", err);
    res
      .status(500)
      .json({ error: "Falha ao descriptografar o áudio", detail: err.message });
  }
});

app.listen(3000, () => {
  console.log("API rodando na porta 3000");
});
