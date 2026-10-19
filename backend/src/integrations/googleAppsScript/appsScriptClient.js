import axios from "axios";
import { config } from "../../config/appConfig.js";
import AppError from "../../utils/AppError.js";

export async function sendViaAppsScript({ to, subject, htmlBody, textBody }) {
  if (!config.appsScriptUrl || !config.appsScriptSecret) {
    throw new AppError("Email delivery is not configured. Contact the administrator.", 503, "EMAIL_NOT_CONFIGURED");
  }

  try {
    const response = await axios.post(config.appsScriptUrl, {
      secret: config.appsScriptSecret,
      to,
      subject,
      htmlBody,
      textBody
    }, {
      timeout: 15000,
      maxRedirects: 5,
      headers: { "Content-Type": "application/json" }
    });

    if (response.data?.success !== true) {
      throw new Error(response.data?.message || "Apps Script rejected the email request.");
    }
    return response.data;
  } catch (error) {
    console.error("Google Apps Script email error:", error.response?.data || error.message);
    throw new AppError("Unable to send email right now. Please try again later.", 502, "EMAIL_DELIVERY_FAILED");
  }
}
