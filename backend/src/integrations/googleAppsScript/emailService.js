import { sendViaAppsScript } from "./appsScriptClient.js";
import { verificationTemplate, resetTemplate, approvedTemplate, rejectedTemplate } from "./emailTemplates.js";

export async function sendVerificationEmail(user, link) {
  return sendViaAppsScript({ to: user.email, ...verificationTemplate({ name: user.fullName, link }) });
}
export async function sendPasswordResetEmail(user, link) {
  return sendViaAppsScript({ to: user.email, ...resetTemplate({ name: user.fullName, link }) });
}
export async function sendAccountApprovedEmail(user) {
  return sendViaAppsScript({ to: user.email, ...approvedTemplate({ name: user.fullName }) });
}
export async function sendAccountRejectedEmail(user) {
  return sendViaAppsScript({ to: user.email, ...rejectedTemplate({ name: user.fullName }) });
}
