const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();

// Secret
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// --- ONLY EXPORT AN OBJECT OF FUNCTIONS ---
exports.emailFileAttachment = onCall(
  {
    region: "us-central1",
    secrets: [RESEND_API_KEY],
    memory: "1GiB",
    timeoutSeconds: 120,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new Error("You must be logged in.");
    }

    const userEmail = auth.token.email;
    const fullPath = data.fullPath;
    const fileName = data.fileName;

    // Read file
    const bucket = admin.storage().bucket();
    const [buffer] = await bucket.file(fullPath).download();
    const base64 = buffer.toString("base64");

    // Send email
    const resend = new Resend(RESEND_API_KEY.value());

    await resend.emails.send({
      from: "Anand Drive <hello@resend.dev>",
      to: userEmail,
      subject: `Your file: ${fileName}`,
      html: `<p>Your file <strong>${fileName}</strong> is attached.</p>`,
      attachments: [{ filename: fileName, content: base64 }],
    });

    return { success: true };
  }
);
