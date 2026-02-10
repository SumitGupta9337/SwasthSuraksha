
  const express = require("express");
  const twilio = require("twilio");
  const { v4: uuidv4 } = require("uuid");
  const cors = require("cors");

  const router = express.Router();

  // Enable CORS for frontend
  router.use(cors());

  // ====== CONFIG ======
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE;

  // ====================

  const client = twilio(accountSid, authToken);

  // Temporary store (DB later)
  const tokens = {};

  // Clean up old tokens every hour
  setInterval(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    for (const token in tokens) {
      if (now - tokens[token].createdAt > oneHour) {
        delete tokens[token];
      }
    }
  }, 60 * 60 * 1000);

  // =======================================
  // 1) INCOMING CALL → SMS LINK
  // =======================================
  router.post("/incoming-call", async (req, res) => {
    try {
      const caller = req.body.From;
      console.log("📞 CALL FROM:", caller);

      const token = uuidv4();

      // Store token with phone (expires in 1 hour)
      tokens[token] = {
        phone: caller,
        createdAt: Date.now(),
        used: false,
      };

      // Send SMS with link
      await client.messages.create({
        body: `🚑 SwasthSuraksha Emergency: Click here: https://arden-uncombined-librada.ngrok-free.dev/confirm/${token}`,
        from: twilioNumber,
        to: caller,
      });

      console.log("📱 SMS SENT to:", caller);

      // Voice response
      res.type("text/xml");
      res.send(`
        <Response>
          <Say voice="alice" language="en-IN">
            SwasthSuraksha: We’ve sent you an SMS. Tap the link now to request an ambulance.
          </Say>
          <Hangup/>
        </Response>
      `);
    } catch (error) {
      console.error("Error in incoming call:", error);
      res.type("text/xml");
      res.send(`
        <Response>
          <Say>Sorry, there was an error processing your call. Please try again.</Say>
          <Hangup/>
        </Response>
      `);
    }
  });

  // =======================================
  // 2) TOKEN → PHONE (for frontend)
  // =======================================
  router.get("/token/:token", (req, res) => {
    const data = tokens[req.params.token];

    if (!data) {
      return res.status(404).json({ error: "Invalid or expired token" });
    }

    // Mark as used (optional)
    data.used = true;

    res.json({ 
      phone: data.phone,
      expiresIn: 3600 - Math.floor((Date.now() - data.createdAt) / 1000)
    });
  });

  module.exports = router;

