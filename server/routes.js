const express = require("express");
const twilio = require("twilio");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const router = express.Router();

// Enable CORS
router.use(cors());

/* ================= CONFIG ================= */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE;

const client = twilio(accountSid, authToken);

console.log("Twilio SID:", accountSid ? "OK" : "MISSING");
console.log("Twilio Phone:", twilioNumber || "MISSING");

/* ========================================= */

// Temporary memory store (replace with DB later)
const tokens = {};

/* ============== CLEANUP JOB ============== */
// Remove tokens older than 1 hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const token in tokens) {
    if (now - tokens[token].createdAt > oneHour) {
      delete tokens[token];
    }
  }
}, 15 * 60 * 1000);

/* ========================================= */
/* 1) INCOMING CALL → GENERATE TOKEN + SMS  */
/* ========================================= */

router.post("/incoming-call", async (req, res) => {
  try {
    const caller = req.body.From;
    console.log("📞 CALL FROM:", caller);

    if (!caller) {
      throw new Error("Caller number missing");
    }

    const token = uuidv4();

    tokens[token] = {
      phone: caller,
      createdAt: Date.now(),
      used: false,
    };

    const frontendUrl = process.env.FRONTEND_URL;
    const link = `${frontendUrl}/confirm/${token}`;

    const msg = await client.messages.create({
      body: `🚑 SwasthSuraksha Emergency: Click here: ${link}`,
      from: twilioNumber,
      to: caller,
    });

    console.log("📱 SMS SENT:", msg.sid);

    res.type("text/xml");
    res.send(`
      <Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    हमने आपको एक एसएमएस भेजा है। एम्बुलेंस बुलाने के लिए कृपया लिंक पर क्लिक करें।
  </Say>
  <Hangup/>
</Response>
    `);
  } catch (error) {
    console.error("Incoming call error:", error.message);

    res.type("text/xml");
    res.send(`
      <Response>
        <Say>Sorry, there was an error. Please try again.</Say>
        <Hangup/>
      </Response>
    `);
  }
});

/* ========================================= */
/* 2) VALIDATE TOKEN (SAFE FOR PREVIEW)     */
/* ========================================= */

router.get("/token/:token", (req, res) => {
   console.log("AVAILABLE TOKENS:", Object.keys(tokens));
  console.log("REQUESTED:", req.params.token);
  const data = tokens[req.params.token];

  if (!data) {
    return res.status(404).json({ error: "Invalid or expired token" });
  }

  res.json({
    phone: data.phone,
    used: data.used,
    expiresIn: 3600 - Math.floor((Date.now() - data.createdAt) / 1000),
  });
});

/* ========================================= */
/* 3) CONSUME TOKEN (REAL ACTION)           */
/* ========================================= */

router.post("/token/:token/use", (req, res) => {
  const token = req.params.token;
  const data = tokens[token];

  if (!data) {
    return res.status(404).json({ error: "Invalid or expired token" });
  }

  if (data.used) {
    return res.status(400).json({ error: "Token already used" });
  }

  // burn it
  data.used = true;

  // optional → remove completely
  // delete tokens[token];

  console.log("✅ TOKEN USED:", token);

  res.json({ success: true, phone: data.phone });
});

/* ========================================= */

module.exports = router;
