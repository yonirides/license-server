const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const MONGO_URI = "TON_MONGO_URI";
const API_SECRET = "TON_SECRET_ULTRA_SECURE";

// Connexion DB
mongoose.connect(MONGO_URI);

// Schema sécurisé
const License = mongoose.model("License", {
  key: String,
  userId: Number,
  hwid: String,
  activated: Boolean
});

// 🔑 génération clé sécurisée
function generateKey() {
  return "LIC-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

// ======================
// 💳 WEBHOOK PAYHIP
// ======================
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

  console.log("NEW KEY:", key);

  res.json({ key });
});

// ======================
// 🔐 ACTIVER + VÉRIFIER
// ======================
app.get("/check", async (req, res) => {
  const { key, userId, hwid, secret } = req.query;

  if (secret !== API_SECRET) {
    return res.send("unauthorized");
  }

  const license = await License.findOne({ key });

  if (!license) return res.send("invalid");

  // ❌ clé déjà liée à un autre user
  if (license.activated) {
    if (license.userId != userId || license.hwid != hwid) {
      return res.send("invalid");
    }
    return res.send("valid");
  }

  // ✅ première activation
  license.userId = parseInt(userId);
  license.hwid = hwid;
  license.activated = true;

  await license.save();

  return res.send("valid");
});

app.listen(3000, () => console.log("🚀 API PRO ONLINE"));
