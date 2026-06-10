import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "IoT Archive <noreply@yourdomain.com>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string, orgName: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `[${orgName}] Verify your email - IoT Archive`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#E8E0D0;font-family:monospace;">
        <div style="max-width:560px;margin:40px auto;background:#EFE9DC;border:1px solid #DDD5C5;border-radius:8px;overflow:hidden;">
          <div style="background:#8B1A1A;padding:24px 32px;">
            <h1 style="color:#fff;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;margin:0;">IoT Archival Dashboard</h1>
          </div>
          <div style="padding:40px 32px;">
            <p style="font-size:11px;color:#8B7355;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Email Verification</p>
            <h2 style="font-size:24px;color:#2A2520;margin:0 0 24px;font-weight:bold;">Confirm Your Archive Access</h2>
            <p style="font-size:14px;color:#5A5045;line-height:1.7;margin:0 0 24px;">
              You've been registered to <strong>${orgName}</strong> on the IoT Archival Dashboard.
              Verify your email to activate your account.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:#8B1A1A;color:#fff;padding:14px 32px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;border-radius:4px;font-weight:bold;">
              Verify Email Address
            </a>
            <p style="font-size:12px;color:#8B7355;line-height:1.6;margin:32px 0 0;">
              If the button doesn't work, copy this link:<br>
              <a href="${verifyUrl}" style="color:#8B1A1A;word-break:break-all;">${verifyUrl}</a>
            </p>
            <p style="font-size:11px;color:#8B7355;margin:24px 0 0;opacity:0.6;">
              This link expires in 24 hours. If you didn't request this, ignore this email.
            </p>
          </div>
          <div style="padding:16px 32px;border-top:1px solid #DDD5C5;text-align:center;">
            <p style="font-size:9px;color:#8B7355;letter-spacing:0.2em;margin:0;">ARCHIVAL_SYSTEM_V2.0</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return { error };
}

export async function sendInviteEmail(email: string, token: string, orgName: string, invitedByUsername: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `[${orgName}] You've been invited to IoT Archive`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#E8E0D0;font-family:monospace;">
        <div style="max-width:560px;margin:40px auto;background:#EFE9DC;border:1px solid #DDD5C5;border-radius:8px;overflow:hidden;">
          <div style="background:#8B1A1A;padding:24px 32px;">
            <h1 style="color:#fff;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;margin:0;">IoT Archival Dashboard</h1>
          </div>
          <div style="padding:40px 32px;">
            <p style="font-size:11px;color:#8B7355;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Team Invitation</p>
            <h2 style="font-size:24px;color:#2A2520;margin:0 0 24px;font-weight:bold;">You've Been Invited</h2>
            <p style="font-size:14px;color:#5A5045;line-height:1.7;margin:0 0 24px;">
              <strong>${invitedByUsername}</strong> has invited you to join <strong>${orgName}</strong> on the IoT Archival Dashboard.
            </p>
            <p style="font-size:14px;color:#5A5045;line-height:1.7;margin:0 0 24px;">
              Click below to set your password and activate your account.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:#8B1A1A;color:#fff;padding:14px 32px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;border-radius:4px;font-weight:bold;">
              Set Password & Activate
            </a>
            <p style="font-size:12px;color:#8B7355;line-height:1.6;margin:32px 0 0;">
              If the button doesn't work, copy this link:<br>
              <a href="${verifyUrl}" style="color:#8B1A1A;word-break:break-all;">${verifyUrl}</a>
            </p>
            <p style="font-size:11px;color:#8B7355;margin:24px 0 0;opacity:0.6;">
              This link expires in 24 hours. If you didn't expect this invitation, ignore this email.
            </p>
          </div>
          <div style="padding:16px 32px;border-top:1px solid #DDD5C5;text-align:center;">
            <p style="font-size:9px;color:#8B7355;letter-spacing:0.2em;margin:0;">ARCHIVAL_SYSTEM_V2.0</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return { error };
}
