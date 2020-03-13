const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const GridfsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");

const router = express.Router();
const Member = require("../models/Member");

// Middleware
router.use(methodOverride("_method"));

const mongoURI = "mongodb://localhost/EHCProjects";

// Connection to the data base
// ES6 Promises
mongoose.Promise = global.Promise;

mongoose.set(`useNewUrlParser`, true);
mongoose.set(`useFindAndModify`, false);
mongoose.set(`useCreateIndex`, true);
mongoose.set(`useUnifiedTopology`, true);
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true });

// Init gfs
let gfs;

conn.once("open", () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

// Create storage engine
const storage = new GridfsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /
router.get("/", (req, res) => {
  Project.find({}, (err, result) => {
    const { Token } = req.cookies;
    res.render("Projects", { projects: result, member: Token });
  });
});

const checkMember = (req, res, next) => {
  const { Token } = req.cookies;
  Member.findById(Token, (err, member) => {
    if (err || !member) {
      return res.redirect("/projects");
    }
    next();
  });
};

router.get("/upload", checkMember, (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // check if file
    if (!files || files.length == 0) {
      const { Token } = req.cookies;
      Member.findById(Token, (err, result) => {
        if (err || !result) {
          return res.render("project", { files: false, member: false });
        }
        return res.render("project", { files: false, member: result });
      });
    } else {
      files.map(file => {
        if (
          file.contentType === "image/jpg" ||
          file.contentType === "image/jpeg" ||
          file.contentType === "image/png"
        ) {
          // Read output to browser
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      const { Token } = req.cookies;
      Member.findById(Token, (err, result) => {
        if (err || !result) {
          return res.render("project", { files: files, member: false });
        }
        return res.render("project", { files: files, member: result });
      });
    }
  });
});

router.get("/files", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // check if file
    if (!files || files.length == 0) {
      return res.status(404).json({
        err: "No file exists"
      });
    }
    // Files
    return res.json(files);
  });
});

router.get("/files/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file == 0) {
      return res.status(404).json({
        err: "No files exists"
      });
    }
    return res.json(file);
  });
});

router.get("/images/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file == 0) {
      return res.status(404).json({
        err: "No files exists"
      });
    }

    if (
      file.contentType === "image/jpg" ||
      file.contentType === "image/jpeg" ||
      file.contentType === "image/png"
    ) {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image"
      });
    }
  });
});

const Project = require("../models/Project");

// @route POST /upload
router.post("/upload", upload.single("file"), (req, res) => {
  const { file } = req;
  const { title, author, content, username } = req.body;
  let id = "-";
  let fileid = "-";
  if (file) {
    id = file.filename;
    fileid = file.id;
  }
  let filepath = id;
  const newProject = new Project({
    title,
    author,
    content,
    filepath,
    fileid,
    username
  });
  newProject.save().then(result => {
    return res.redirect("/projects");
  });
});

router.delete("/files/:id", (req, res) => {
  gfs.remove({ _id: req.params.id, root: "uploads" }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({
        err: err
      });
    }
    res.redirect("/projects");
  });
});

router.post("/delete/:id", (req, res) => {
  const { id } = req.params;
  Project.findByIdAndRemove(id, (err, result) => {
    const file = result.fileid;
    if (file != "-" || file != "") {
      gfs.remove({ _id: file, root: "uploads" }, (err, gridStore) => {
        if (err) {
          return res.status(404).json({
            err: err
          });
        }
        res.redirect("/projects");
      });
    }
  });
});

module.exports = router;
