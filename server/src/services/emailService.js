console.log("BREVO_API_KEY exists:", !!process.env.BREVO_API_KEY);
console.log("SENDER EMAIL:", process.env.BREVO_SENDER_EMAIL);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

export const sendVerificationEmail = async (
  email,
  token
) => {
  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "UPC",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email }],
        subject: "Verify your email",
        htmlContent: `
          <h2>Verify your email</h2>
          <a href="${verificationUrl}">
            Verify Email
          </a>
        `,
      }),
    }
  );

  const data = await response.json();

  // ADD THESE LOGS
  console.log("Brevo Status:", response.status);
  console.log("Brevo Response:", data);

  if (!response.ok) {
    throw new Error(
      data.message || "Email send failed"
    );
  }

  return data;
};

export const sendPasswordResetEmail = async (
  email,
  resetToken
) => {
  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "UPC Placement Cell",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email,
          },
        ],
        subject: "Reset Your Password",
        htmlContent: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset.</p>
          <p>Click the link below to set a new password:</p>
          <a href="${resetUrl}">
            Reset Password
          </a>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Brevo Error:", data);

    throw new Error(
      data.message || "Failed to send password reset email"
    );
  }

  return data;
};