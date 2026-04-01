const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// 🔐 CONFIG
const MONGO_URI = "TON_MONGO_URI";
const API_SECRET = "TON_SECRET_ULTRA_SECURE";

// 🔗 Connexion DB
mongoose.connect(MONGO_URI);

// 📦 Schema licence
const License = mongoose.model("License", {
  key: String,
  userId: Number,
  activated: Boolean
});

// 🔑 Générateur de clé
function generateKey() {
  return "LIC-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

/*
========================
💳 PAYHIP WEBHOOK
========================
*/
app.post("/webhook", async (req, res) => {
  // 🔒 sécurité webhook
  if (req.body.secret !== API_SECRET) {
    return res.sendStatus(403);
  }

  const key = generateKey();

  await License.create({
    key,
    userId: null,
    activated: false
  });

  console.log("🔑 Nouvelle clé:", key);

  res.json({ success: true, key });
});

/*
========================
🔐 ACTIVATION LICENCE
========================
*/
app.get("/activate", async (req, res) => {
  const { key, userId, secret } = req.query;

  // 🔒 sécurité API
  if (secret !== API_SECRET) {
    return res.send("unauthorized");
  }

  const license = await License.findOne({ key });

  if (!license) return res.send("invalid");

  // ❌ déjà utilisée par un autre
  if (license.activated && license.userId != userId) {
    return res.send("invalid");
  }

  // ✅ première activation
  if (!license.activated) {
    license.userId = parseInt(userId);
    license.activated = true;
    await license.save();
  }

  // ✅ bonne licence
  if (license.userId == userId) {
    return res.send("valid");
  }

  res.send("invalid");
});

app.listen(3000, () => console.log("🚀 API running"));
