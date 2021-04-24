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

app.get("/about", (req, res) => res.send("About Page Route"));
app.get("/portfolio", (req, res) => res.send("Portfolio Page Route"));
app.get("/contact", (req, res) => res.send("Contact Page Route"));
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server running on ${port}, http://localhost:${port}`)
);
