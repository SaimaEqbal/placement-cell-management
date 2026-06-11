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

  if (!response.ok) {
    throw new Error(
      data.message || "Email send failed"
    );
  }

  return data;
};