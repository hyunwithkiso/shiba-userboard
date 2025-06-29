// server.js
const express  = require("express");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const sharp    = require("sharp");

const app = express();

// ────────────────────────────────────
// 기본 설정
// ────────────────────────────────────
sharp.cache(false);

const uploadDirBase = "C:/Users/Administrator/Desktop/nginx-1.26.2/html";
const defaultSubDir = "screenshot";

const typeToDirMap = {
  chat: "chat-api",
  killfeed: "killfeed-api",
};
const allowedTypes = Object.keys(typeToDirMap);

// ────────────────────────────────────
// Multer storage
// ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type           = req.query.type;
    const targetSubDir   = allowedTypes.includes(type) ? typeToDirMap[type] : defaultSubDir;
    const destinationDir = path.join(uploadDirBase, targetSubDir);
    cb(null, destinationDir);
  },
  filename: (_req, file, cb) => {
    const newFileName = Date.now() + path.extname(file.originalname);
    cb(null, newFileName);
  },
});

const upload = multer({ storage });

// ────────────────────────────────────
// POST /files : 업로드 & WebP 변환
// ────────────────────────────────────
app.post("/files", upload.single("files"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "파일 업로드 실패" });
  }

  const inputPath   = req.file.path;        // 업로드된 임시 파일
  const destDir     = req.file.destination; // 최종 저장 디렉토리
  
  const type        = req.query.type;
  const prefix      = allowedTypes.includes(type) ? type : 'screenshot';
  const outputName  = `${prefix}-${req.file.filename}`;
  const outputPath  = path.join(destDir, outputName);

  const urlSubDir   = allowedTypes.includes(type) ? typeToDirMap[type] : defaultSubDir;

  try {
    // 🔑 animated:true → 다중 프레임(GIF/WebP) 유지
    await sharp(inputPath, { animated: true })
      .webp({
        lossless: false,
        loop: 0,      // 0 = 무한 반복 (GIF의 루프 수 보존)
        // 필요 시 quality, effort, delay 등 추가
      })
      .toFile(outputPath);

    await fs.promises.unlink(inputPath); // 원본 삭제

    const fileUrl = `https://proxy.dokku.co.kr/${urlSubDir}/${outputName}`;
    res.json({ message: "파일 업로드 및 WebP 변환 성공", url: fileUrl, fileName : outputName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "이미지 변환 실패" });
  }
});

// ────────────────────────────────────
// 정적 파일 서빙
// ────────────────────────────────────
app.use("/screenshot"  , express.static(path.join(uploadDirBase, "screenshot")));
app.use("/chat-api"    , express.static(path.join(uploadDirBase, "chat-api")));
app.use("/killfeed-api", express.static(path.join(uploadDirBase, "killfeed-api")));

// ────────────────────────────────────
// 서버 시작
// ────────────────────────────────────
app.listen(5005, () => {
  console.log("서버가 포트 5005에서 실행중입니다.");
});