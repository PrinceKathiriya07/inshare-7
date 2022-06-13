const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const File = require("../models/file");
const { v4: uuid4 } = require("uuid");
const { find } = require("../models/file");

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

let upload = multer({
  storage,
  limit: { fileSize: 1000000 * 100 },
}).single("myfile");

router.post("/", (req, res) => {
  // Store file
  upload(req, res, async (err) => {
    // Validate requrest
    if (!req.file) {
      return res.json({ error: "all Fileds are require" });
    }

    if (err) {
      return res.status(500).send({ error: err.message });
    }
    // store into db
    const file = new File({
      filename: req.file.filename,
      uuid: uuid4(),
      path: req.file.path,
      size: req.file.size,
    });

    const response = await file.save();
    return res.json({
      file: `${process.env.APP_BASE_URL}/files/${response.uuid}`,
    });
  });

  // respose ->link
});

router.post("/send", async (req, res) => {
  const { uuid, emailTo, emailForm } = req.body;
  // validate requrest
  if (!uuid || !emailTo || !emailForm) {
    return res.status(422).send({ error: "All Fields are require" });
  }

  const file = await File.findOne({ uuid: uuid });
  if (file.sender) {
    return res.status(422).send({ error: "Email alredy Sent." });
  }

  file.sender = emailForm;
  file.receiver = emailTo;
  const response = await file.save();

  // Sned Mail
  const sendMail = require("../services/emailServices");
  sendMail({
    from: emailForm,
    to: emailTo,
    subject: "InShare file sharing",
    text: `${emailForm} shared a file With You`,
    html: require("../services/emailTemplate")({
      emailFrom: emailForm,
      downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
      size: parseInt(file.size / 1000) + " KB",
      expires: "24 hours",
    }),
  });
  return res.send({ success: true });
});

module.exports = router;
