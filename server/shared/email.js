// ─────────────────────────────────────────────
// EMAIL SERVICE — Sends transactional emails via Resend
// ─────────────────────────────────────────────
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Beanhive <onboarding@resend.dev>';

const emailService = {
  async sendVerificationEmail(toEmail, firstName, verificationUrl) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [toEmail],
        subject: 'Verify your Beanhive account',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 28px; color: #1e3932; margin: 0;">Beanhive</h1>
            </div>
            <h2 style="font-size: 22px; color: #1e3932; margin-bottom: 8px;">Welcome, ${firstName}!</h2>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Thanks for joining Beanhive Rewards. Please verify your email address to get started.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #00754a; color: #fff; padding: 14px 36px; border-radius: 24px; text-decoration: none; font-size: 16px; font-weight: 600;">
                Verify Email
              </a>
            </div>
            <p style="font-size: 13px; color: #999; line-height: 1.5;">
              This link expires in 24 hours. If you didn't create a Beanhive account, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="font-size: 12px; color: #bbb; text-align: center;">
              &copy; 2026 Beanhive. All rights reserved.
            </p>
          </div>
        `
      });

      if (error) {
        console.error('[Email] Failed to send verification email:', error);
        return false;
      }

      console.log('[Email] Verification email sent to', toEmail, '— id:', data?.id);
      return true;
    } catch (err) {
      console.error('[Email] Error sending verification email:', err.message);
      return false;
    }
  }
};

module.exports = emailService;
