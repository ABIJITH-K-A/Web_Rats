import twilio from "twilio";
import env from "../config/env.js";

let client = null;

const getClient = () => {
  if (!client && env.twilioAccountSid && env.twilioAuthToken) {
    client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  }
  return client;
};

const WHATSAPP_TEMPLATES = {
  orderConfirmation: (data) =>
    `🎉 *Order Confirmed!*\n\nHi ${data.customerName}, your order *${data.orderId}* for *${data.service}* has been placed successfully.\n\nAmount: ₹${data.amount}\nPlan: ${data.plan || "Standard"}\n\nTrack your order at: ${env.frontendUrl || "https://rynix.com"}/profile`,

  statusUpdate: (data) =>
    `📋 *Order Update*\n\nHi ${data.customerName}, your order *${data.orderId}* status has been updated to: *${data.status}*\n\nCheck your dashboard for details.`,

  deliveryReady: (data) =>
    `✅ *Order Complete!*\n\nHi ${data.customerName}, your order *${data.orderId}* (${data.service}) is now complete and ready for review!\n\nLogin to download your deliverables: ${env.frontendUrl || "https://rynix.com"}/profile`,

  paymentReminder: (data) =>
    `💰 *Payment Reminder*\n\nHi ${data.customerName}, a payment of *₹${data.amount}* is pending for order *${data.orderId}*.\n\nPlease complete the payment to avoid delivery delays.`,
};

export const sendWhatsAppMessage = async (phone, templateName, data) => {
  const templateFn = WHATSAPP_TEMPLATES[templateName];
  if (!templateFn) {
    console.warn(`WhatsApp template "${templateName}" not found.`);
    return null;
  }

  const twilioClient = getClient();
  if (!twilioClient) {
    console.warn("Twilio credentials not configured — skipping WhatsApp.");
    return null;
  }

  const normalizedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
  const body = templateFn(data);

  try {
    const message = await twilioClient.messages.create({
      body,
      from: `whatsapp:${env.twilioWhatsAppFrom || "+14155238886"}`,
      to: `whatsapp:${normalizedPhone}`,
    });
    console.log(`WhatsApp sent: ${message.sid} → ${normalizedPhone}`);
    return message;
  } catch (error) {
    console.error("WhatsApp send error:", error.message);
    return null;
  }
};

export default { sendWhatsAppMessage };
