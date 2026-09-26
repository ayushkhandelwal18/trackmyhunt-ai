const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

/**
 * Renders a backend/templates/*.html file by substituting Resend-style
 * variables. {{{var}}} renders raw HTML (used for pre-built content blocks);
 * {{var}} renders the plain value. Unknown values become empty strings.
 */
function renderTemplate(templateFile, params) {
  const filePath = path.join(__dirname, "..", "templates", templateFile);
  let html = fs.readFileSync(filePath, "utf8");
  for (const [key, value] of Object.entries(params || {})) {
    const rendered = value == null ? "" : String(value);
    html = html.split(`{{{${key}}}}`).join(rendered);
    html = html.split(`{{${key}}}`).join(rendered);
  }
  return html;
}

/**
 * Sends a templated email using Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject line
 * @param {string} templateFile - File in backend/templates/ (e.g. "otp-email.html")
 * @param {Object} params - Template variables
 */
async function sendEmailResend(to, subject, templateFile, params) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const fromName = process.env.RESEND_FROM_NAME;

  if (!apiKey || !fromEmail) {
    console.error("[MAIL SERVICE ERROR] Missing Resend configuration in environment variables");
    console.error(`- API Key: ${apiKey ? "OK" : "MISSING"}`);
    console.error(`- From Email: ${fromEmail ? "OK" : "MISSING"}`);
    throw new Error("Email service is not configured correctly on the server.");
  }

  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  console.log(`[MAIL SERVICE] Sending request to Resend for ${to}...`);

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: renderTemplate(templateFile, params),
    });
    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }
    console.log(`[MAIL SERVICE] Email sent successfully to ${to}. ID: ${data && data.id}`);
    return data;
  } catch (error) {
    console.error(`[MAIL SERVICE ERROR] Resend request failed for ${to}:`, error.message);

    // Provide a more descriptive error message if available
    throw new Error(`Email service failed: ${error.message}`);
  }
}

exports.sendOTPEmail = async (to, otp, type = "verification") => {
  console.log(`[MAIL SERVICE] Preparing OTP for ${to} | Type: ${type}`);

  const isReset = type.trim().toLowerCase() === "reset";

  const subject = isReset ? "RESET PASSWORD - TrackMyHunt" : "VERIFY ACCOUNT - TrackMyHunt";
  const templateParams = {
    otp: otp,
    type: isReset ? "Password Reset" : "Account Verification",
    expiry_minutes: 10,
  };

  return await sendEmailResend(to, subject, "otp-email.html", templateParams);
};

exports.sendWelcomeEmail = async (to, name) => {
  console.log(`[MAIL SERVICE] Preparing Welcome for ${to}`);

  const subject = "Welcome to TrackMyHunt! 🚀";
  const templateParams = {
    user_name: name,
  };

  return await sendEmailResend(to, subject, "welcome-email.html", templateParams);
};

// Exported for reuse by the reminder scheduler and for unit tests.
exports.sendEmailResend = sendEmailResend;
exports.renderTemplate = renderTemplate;
