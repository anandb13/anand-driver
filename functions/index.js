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
      html: `
        <div style="font-family: Arial, sans-serif; color:#222; line-height: 1.5;">
          <p>Hello,</p>
          <p>Your file <strong>${fileName}</strong> from <em>Anand Drive</em> is attached to this email.</p>
          <p>If this request wasn’t made by you, you can safely ignore this message.</p>
          <br/>
          <p>Regards,<br/>Anand Drive Support</p>
          <hr/>
          <small>This is an automated message but monitored for abuse.</small>
        </div>
      `,
      attachments: [{ filename: fileName, content: base64 }],
    });

    return { success: true };
  }
);
