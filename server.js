const express = require("express");
const app = express();

app.use(express.json());

const licenses = {};

function generateKey() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

app.post("/webhook", (req, res) => {
  const email = req.body.email;

  const key = generateKey();

  licenses[key] = {
    userId: null,
    active: true,
    email: email
  };

  console.log("Nouvelle clé :", key);

  res.sendStatus(200);
});

app.get("/check", (req, res) => {
  const { key, userId } = req.query;

  const license = licenses[key];

  if (!license) return res.send("invalid");

  if (!license.userId) {
    license.userId = parseInt(userId);
  }

  if (license.userId != userId) {
    return res.send("invalid");
  }

  res.send("valid");
});

app.listen(3000, () => console.log("Serveur lancé"));
