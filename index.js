const express = require("express");

const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");

const app = express();

const MONGO_URL =
  "mongodb+srv://file:dap196421@cluster0.flyo0.mongodb.net/file-uploader?retryWrites=true&w=majority";
// connection
const conn = mongoose.createConnection(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// init gfs
let gfs;
conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
});

// Storage
const storage = new GridFsStorage({
  url: MONGO_URL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }

        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({
  storage,
});

app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", `true`);
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://file-uploader-diazevedo.vercel.app"
  );

  gfs.find().toArray((err, files) => {
    // check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "no files exist",
      });
    }

    return res.json(files);
  });
});

app.get("/files/:filename", async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", `true`);
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://file-uploader-diazevedo.vercel.app"
  );

  gfs
    .find({
      filename: req.params.filename,
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist",
        });
      }

      gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
});

app.post("/files", upload.single("file"), (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", `true`);
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://file-uploader-diazevedo.vercel.app"
  );

  res.status(201).json({
    file: req.file,
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server running on ${port}, http://localhost:${port}`)
);
