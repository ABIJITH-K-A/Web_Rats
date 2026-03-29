import nodemailer from "nodemailer";
import env from "../config/env.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

const EMAIL_TEMPLATES = {
  orderConfirmation: (data) => ({
    subject: `Order Confirmed — ${data.orderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0d0f11;color:#e0e0e0;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#67F81D;margin:0;">TN WEB RATS</h1>
          <p style="color:#888;font-size:12px;margin:4px 0 0;">Order Confirmation</p>
        </div>
        <div style="background:#1a1f1a;padding:20px;border-radius:12px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#67F81D;font-size:13px;font-weight:700;">Hi ${data.customerName},</p>
          <p style="margin:0;font-size:14px;">Your order <strong>${data.orderId}</strong> for <strong>${data.service}</strong> has been confirmed.</p>
        </div>
        <table style="width:100%;font-size:13px;color:#ccc;">
          <tr><td style="padding:6px 0;color:#888;">Service</td><td style="padding:6px 0;text-align:right;">${data.service}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Plan</td><td style="padding:6px 0;text-align:right;">${data.plan || "Standard"}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Amount</td><td style="padding:6px 0;text-align:right;color:#67F81D;font-weight:700;">₹${data.amount}</td></tr>
        </table>
        <p style="font-size:11px;color:#555;margin-top:24px;text-align:center;">
          You can track your order status from your <a href="${env.frontendUrl || "https://tnwebrats.com"}/profile" style="color:#67F81D;">dashboard</a>.
        </p>
      </div>
    `,
  }),

  statusUpdate: (data) => ({
    subject: `Order ${data.orderId} — Status: ${data.status}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0d0f11;color:#e0e0e0;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#67F81D;margin:0;">TN WEB RATS</h1>
          <p style="color:#888;font-size:12px;">Order Update</p>
        </div>
        <div style="background:#1a1f1a;padding:20px;border-radius:12px;">
          <p style="margin:0 0 8px;">Hi ${data.customerName},</p>
          <p style="margin:0;">Your order <strong>${data.orderId}</strong> status has been updated to:</p>
          <div style="margin:16px 0;text-align:center;">
            <span style="display:inline-block;background:#67F81D20;color:#67F81D;padding:8px 24px;border-radius:999px;font-weight:700;font-size:14px;">
              ${data.status}
            </span>
          </div>
        </div>
      </div>
    `,
  }),

  paymentReminder: (data) => ({
    subject: `Payment Reminder — Order ${data.orderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0d0f11;color:#e0e0e0;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#67F81D;margin:0;">TN WEB RATS</h1>
          <p style="color:#888;font-size:12px;">Payment Reminder</p>
        </div>
        <div style="background:#1a1f1a;padding:20px;border-radius:12px;">
          <p>Hi ${data.customerName},</p>
          <p>A payment of <strong style="color:#67F81D;">₹${data.amount}</strong> is pending for order <strong>${data.orderId}</strong>.</p>
          <p style="font-size:13px;color:#888;">Please complete the payment at your earliest convenience to avoid delays.</p>
        </div>
      </div>
    `,
  }),

  orderCompleted: (data) => ({
    subject: `Your Order ${data.orderId} is Complete! 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0d0f11;color:#e0e0e0;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#67F81D;margin:0;">TN WEB RATS</h1>
          <p style="color:#888;font-size:12px;">Delivery Complete</p>
        </div>
        <div style="background:#1a1f1a;padding:20px;border-radius:12px;">
          <p>Hi ${data.customerName},</p>
          <p>Great news! Your order <strong>${data.orderId}</strong> (${data.service}) is now complete and ready for review.</p>
          <p>Log into your <a href="${env.frontendUrl || "https://tnwebrats.com"}/profile" style="color:#67F81D;">dashboard</a> to download your deliverables and leave a review.</p>
        </div>
      </div>
    `,
  }),
};

export const sendOrderEmail = async (to, templateName, data) => {
  const templateFn = EMAIL_TEMPLATES[templateName];
  if (!templateFn) {
    console.warn(`Email template "${templateName}" not found.`);
    return null;
  }

  if (!env.smtpUser || !env.smtpPass) {
    console.warn("SMTP credentials not configured — skipping email.");
    return null;
  }

  const { subject, html } = templateFn(data);

  try {
    const info = await transporter.sendMail({
      from: `"TN WEB RATS" <${env.smtpUser}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId} → ${to}`);
    return info;
  } catch (error) {
    console.error("Email send error:", error.message);
    return null;
  }
};

export default { sendOrderEmail };
