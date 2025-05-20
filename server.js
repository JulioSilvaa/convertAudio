const express = require("express");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const app = express();

// Middleware para aceitar JSON no corpo das requisições
app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API Rodando com Descriptografia e Conversão de Áudio" });
});

// Rota principal
app.post("/convert-audio", async (req, res) => {
  const { mediaKey, mimetype, url } = req.body;

  // Verificação de parâmetros obrigatórios
  if (!mediaKey || !mimetype || !url) {
    return res.status(400).json({
      error: "Parâmetros obrigatórios ausentes: mediaKey, mimetype e url.",
    });
  }

  try {
    // Stub de mensagem no formato do WhatsApp
    const msgStub = {
      audioMessage: {
        mediaKey,
        mimetype,
        url,
        fileLength: 99999, // valor arbitrário
        mediaSha256: Buffer.alloc(32), // necessário para downloadMediaMessage
      },
    };

    // Descriptografar o áudio (buffer)
    const buffer = await downloadMediaMessage(msgStub.audioMessage, "buffer");

    // Caminhos temporários para salvar e converter
    const timestamp = Date.now();
    const inputPath = uploads / audio - timestamp.ogg;
    const outputPath = converted / audio - timestamp - converted.ogg;

    // Salvar o buffer descriptografado como .ogg
    fs.writeFileSync(inputPath, buffer);

    // Converter com FFmpeg
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
        // Enviar o áudio convertido como resposta
        res.sendFile(path.resolve(outputPath), () => {
          // Limpar arquivos temporários
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      })
      .on("error", (err) => {
        console.error("Erro no FFmpeg:", err);
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        res
          .status(500)
          .json({ error: "Erro ao converter o áudio", detail: err.message });
      });
  } catch (err) {
    console.error("Erro geral:", err);
    res.status(500).json({
      error: "Falha ao descriptografar ou converter o áudio",
      detail: err.message,
    });
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("✅ API rodando na porta 3000");
});
