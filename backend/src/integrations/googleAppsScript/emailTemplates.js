const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

export function verificationTemplate({ name, link }) {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);
  return {
    subject: "Verify your Lead Management CRM email",
    htmlBody: `<p>Hello ${safeName},</p><p>Please verify your email address to continue your CRM registration.</p><p><a href="${safeLink}">Verify email address</a></p><p>This link expires shortly and can only be used once. If you did not register, ignore this email.</p>`,
    textBody: `Hello ${name},\nVerify your email: ${link}\nThis link expires shortly and can only be used once.`
  };
}

export function resetTemplate({ name, link }) {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);
  return {
    subject: "Reset your Lead Management CRM password",
    htmlBody: `<p>Hello ${safeName},</p><p>A password reset was requested for your account.</p><p><a href="${safeLink}">Reset password</a></p><p>This link expires shortly and can only be used once. If you did not request this, ignore this email.</p>`,
    textBody: `Hello ${name},\nReset your password: ${link}\nThis link expires shortly and can only be used once.`
  };
}

export function approvedTemplate({ name }) {
  return {
    subject: "Your CRM account has been approved",
    htmlBody: `<p>Hello ${escapeHtml(name)},</p><p>Your CRM account has been approved. You can now log in with your credentials.</p>`,
    textBody: `Hello ${name}, your CRM account has been approved. You can now log in.`
  };
}

export function rejectedTemplate({ name }) {
  return {
    subject: "Update on your CRM registration",
    htmlBody: `<p>Hello ${escapeHtml(name)},</p><p>Your CRM registration was not approved. Please contact your administrator if you need more information.</p>`,
    textBody: `Hello ${name}, your CRM registration was not approved.`
  };
}
