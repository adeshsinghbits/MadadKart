import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ─────────────────────────────────────────────
   Send Email
───────────────────────────────────────────── */
export async function sendEmail(
  payload: EmailPayload
): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    console.log(
      '✅ Email sent:',
      info.messageId
    );
  } catch (error) {
    console.error(
      '❌ Email send error:',
      error
    );

    throw new Error(
      'Failed to send email'
    );
  }
}

export function buildPasswordResetEmail(
  name: string,
  resetUrl: string
) {
  return {
    subject: 'Reset your password',

    text: `
Hi ${name},

Reset your password here:

${resetUrl}

This link expires in 1 hour.

— MadadKart
`,

    html: `
      <div
        style="
          max-width:600px;
          margin:auto;
          padding:24px;
          font-family:sans-serif;
        "
      >
        <h1 style="color:#6366f1">
          MadadKart
        </h1>

        <h2>
          Reset your password
        </h2>

        <p>
          Hi <strong>${name}</strong>,
        </p>

        <p>
          Click below to reset
          your password.
        </p>

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:12px 24px;
            background:#6366f1;
            color:white;
            text-decoration:none;
            border-radius:8px;
            margin-top:12px;
          "
        >
          Reset Password
        </a>

        <p
          style="
            margin-top:24px;
            color:#666;
            font-size:14px;
          "
        >
          This link expires in 1 hour.
        </p>
      </div>
    `,
  };
}