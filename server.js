const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const MONGO_URI = "mongodb+srv://<db_username>:<db_password>@cluster0.nus0tgp.mongodb.net/?appName=Cluster0";
const API_SECRET = "A7mZ#92_kLpX!2026_RBLX_SECURE";

mongoose.connect(MONGO_URI);

// 📦 Licence
const License = mongoose.model("License", {
  key: String,
  userId: Number,
  hwid: String,
  activated: Boolean
});

// 🔑 clé sécurisée
function generateKey() {
  return "LIC-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

/*
========================
💳 PAYHIP WEBHOOK
========================
*/
app.post("/webhook", async (req, res) => {
  if (req.body.secret !== API_SECRET) {
    return res.sendStatus(403);
  }

  const key = generateKey();

  await License.create({
    key,
    userId: null,
    hwid: null,
    activated: false
  });

  console.log("🔑 KEY:", key);

  res.json({ key });
});

/*
========================
🔐 VÉRIFICATION
========================
*/
app.get("/check", async (req, res) => {
  const { key, userId, hwid, secret } = req.query;

  if (secret !== API_SECRET) {
    return res.send("unauthorized");
  }

  const license = await License.findOne({ key });

  if (!license) return res.send("invalid");

  // déjà utilisée
  if (license.activated) {
    if (license.userId != userId || license.hwid != hwid) {
      return res.send("invalid");
    }
    return res.send("valid");
  }

  // première activation
  license.userId = parseInt(userId);
  license.hwid = hwid;
  license.activated = true;

  await license.save();

  res.send("valid");
});

app.listen(3000, () => console.log("🚀 API ON"));
