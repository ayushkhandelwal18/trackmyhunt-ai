// Template rendering tests for the Resend migration. Run with the built-in
// runner, no extra dependencies:  npm test
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { renderTemplate } = require("../services/mail.services");

// Header comments document variable names, so strip them before checking
// that every template slot was actually filled.
function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

describe("renderTemplate", () => {
    it("substitutes double-brace variables in the OTP template", () => {
        const html = renderTemplate("otp-email.html", {
            otp: "123456",
            type: "Account Verification",
            expiry_minutes: 10,
        });
        assert.match(html, /123456/);
        assert.match(html, /Account Verification/);
        assert.match(html, /10 minutes/);
        assert.doesNotMatch(withoutComments(html), /\{\{[a-z_]+\}\}/);
    });

    it("substitutes the user name in the welcome template", () => {
        const html = renderTemplate("welcome-email.html", { user_name: "Asha" });
        assert.match(html, /Hi Asha,/);
        assert.doesNotMatch(withoutComments(html), /\{\{[a-z_]+\}\}/);
    });

    it("renders triple-brace HTML blocks unescaped in the follow-up template", () => {
        const block = "<div><strong>Google</strong></div>";
        const html = renderTemplate("followup-email.html", {
            user_name: "Asha",
            heading: "Follow up",
            message_html: block,
            cta_url: "https://example.com/applications",
        });
        assert.match(html, /<strong>Google<\/strong>/);
        assert.match(html, /href="https:\/\/example.com\/applications"/);
        assert.doesNotMatch(withoutComments(html), /\{\{\{?[a-z_]+\}?\}\}/);
    });

    it("renders triple-brace HTML blocks unescaped in the interview template", () => {
        const block = "<div>Tomorrow · 11:00 AM</div>";
        const html = renderTemplate("interview-email.html", {
            user_name: "Asha",
            heading: "Interviews",
            message_html: block,
            cta_url: "https://example.com/applications",
        });
        assert.match(html, /Tomorrow · 11:00 AM/);
        assert.doesNotMatch(withoutComments(html), /\{\{\{?[a-z_]+\}?\}\}/);
    });

    it("leaves unprovided variables untouched without throwing", () => {
        const html = renderTemplate("welcome-email.html", {});
        assert.match(html, /Welcome to TrackMyHunt/);
        assert.match(html, /\{\{user_name\}\}/);
    });
});
