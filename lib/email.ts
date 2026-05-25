import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify environment on startup (Internal Log Only)
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️ KIO-X Email Warning: SMTP environment variables are incomplete. Custom notifications will fail.');
}

const KIOX_GREEN = '#22c55e';
const KIOX_BLACK = '#080808';
const KIOX_CARD = '#111111';

// Welcome Email Template
export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <div style="background-color: ${KIOX_BLACK}; padding: 40px; font-family: 'Inter', sans-serif; color: white; max-width: 600px; margin: auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${KIOX_GREEN}; letter-spacing: 5px; font-size: 32px; margin: 0;">KIO-X</h1>
        <p style="text-transform: uppercase; font-size: 10px; opacity: 0.5; letter-spacing: 2px;">Human Performance</p>
      </div>
      <div style="background-color: ${KIOX_CARD}; padding: 30px; border-radius: 20px; border: 1px solid rgba(34,197,94,0.1);">
        <h2 style="font-size: 24px; margin-top: 0;">WELCOME, ${name.toUpperCase()}</h2>
        <p style="line-height: 1.6; color: rgba(255,255,255,0.7);">Your registration has been successfully received. Our elite coaching team is currently reviewing your profile to sync you with the optimal training architecture.</p>
        <div style="margin: 25px 0; padding: 15px; background: rgba(34,197,94,0.05); border-left: 3px solid ${KIOX_GREEN};">
          <p style="margin: 0; font-weight: bold; font-size: 12px; color: ${KIOX_GREEN};">STATUS: PENDING REVIEW</p>
        </div>
        <p style="font-size: 14px; opacity: 0.6;">You will receive another transmission once your profile has been approved and your program has been assigned.</p>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 10px; color: rgba(255,255,255,0.2);">&copy; 2026 KIO-X HUMAN PERFORMANCE. ALL RIGHTS RESERVED.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"KIO-X Performance" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Welcome to KIO-X - Registry Received`,
    html,
  });
}

// Approval Email Template
export async function sendApprovalEmail(to: string, name: string, programName?: string) {
  const html = `
    <div style="background-color: ${KIOX_BLACK}; padding: 40px; font-family: 'Inter', sans-serif; color: white; max-width: 600px; margin: auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${KIOX_GREEN}; letter-spacing: 5px; font-size: 32px; margin: 0;">KIO-X</h1>
      </div>
      <div style="background-color: ${KIOX_CARD}; padding: 30px; border-radius: 20px; border: 1px solid ${KIOX_GREEN};">
        <h2 style="font-size: 24px; margin-top: 0; color: ${KIOX_GREEN};">PROFILE APPROVED</h2>
        <p style="line-height: 1.6;">Congratulations, ${name.toUpperCase()}. Your athlete profile has been verified and cleared for performance training.</p>
        
        ${programName ? `
          <div style="margin: 25px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
            <p style="margin: 0 0 5px 0; font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Assigned Program</p>
            <p style="margin: 0; font-size: 20px; font-weight: 800; color: white;">${programName.toUpperCase()}</p>
          </div>
        ` : ''}

        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: block; background-color: ${KIOX_GREEN}; color: black; text-align: center; padding: 15px; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px; text-transform: uppercase; letter-spacing: 2px;">Go To Dashboard →</a>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 10px; color: rgba(255,255,255,0.2);">UNLOCH YOUR POTENTIAL. KIO-X PERFORMANCE.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"KIO-X Performance" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎉 Access Granted - KIO-X Registry Approved`,
    html,
  });
}

// Staff Notification Template
export async function sendStaffNotification(staffEmail: string, athleteName: string, athleteEmail: string) {
  const html = `
    <div style="background-color: ${KIOX_BLACK}; padding: 40px; font-family: 'Inter', sans-serif; color: white; max-width: 600px; margin: auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05);">
      <div style="background-color: ${KIOX_CARD}; padding: 30px; border-radius: 20px; border-left: 4px solid ${KIOX_GREEN};">
        <h2 style="font-size: 18px; margin-top: 0; color: white;">NEW ATHLETE ASSIGNMENT</h2>
        <p style="color: rgba(255,255,255,0.7);">A new athlete has been registered and assigned to your roster:</p>
        <div style="margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Name:</strong> ${athleteName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${athleteEmail}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/staff" style="color: ${KIOX_GREEN}; text-decoration: none; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Review Athlete Profile →</a>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"KIO-X System" <${process.env.EMAIL_USER}>`,
    to: staffEmail,
    subject: `👤 New Athlete Registry - Action Required`,
    html,
  });
}

// Parent Linking OTP Template
export async function sendParentLinkingOtpEmail(to: string, playerName: string, otp: string) {
  const html = `
    <div style="background-color: ${KIOX_BLACK}; padding: 40px; font-family: 'Inter', sans-serif; color: white; max-width: 600px; margin: auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${KIOX_GREEN}; letter-spacing: 5px; font-size: 32px; margin: 0;">KIO-X</h1>
        <p style="text-transform: uppercase; font-size: 10px; opacity: 0.5; letter-spacing: 2px;">Security Protocol</p>
      </div>
      <div style="background-color: ${KIOX_CARD}; padding: 30px; border-radius: 20px; border: 1px solid rgba(34,197,94,0.1);">
        <h2 style="font-size: 20px; margin-top: 0; color: white;">AUTHORIZE PARENT LINKING</h2>
        <p style="line-height: 1.6; color: rgba(255,255,255,0.7);">Hello ${playerName.toUpperCase()},</p>
        <p style="line-height: 1.6; color: rgba(255,255,255,0.7);">A user is attempting to register a **Parent Account** and link it to your athlete profile. To authorize this link, please provide them with the following one-time verification passcode:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <div style="display: inline-block; background-color: rgba(34,197,94,0.05); border: 1px solid ${KIOX_GREEN}; padding: 15px 40px; border-radius: 12px;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: ${KIOX_GREEN}; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">Expires in 10 minutes</p>
        </div>
        
        <div style="margin-top: 25px; padding: 15px; background: rgba(255,59,48,0.05); border-left: 3px solid #ff3b30; border-radius: 4px;">
          <p style="margin: 0; font-size: 11px; color: #ff3b30; font-weight: bold; text-transform: uppercase; tracking: 0.5px;">SECURITY NOTICE:</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">If you do not recognize this request or did not authorize a parent to link to your account, please ignore this transmission. Do NOT share this passcode with anyone.</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 10px; color: rgba(255,255,255,0.2);">&copy; 2026 KIO-X HUMAN PERFORMANCE. SECURE NETWORK.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"KIO-X System" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔒 [KIO-X] Authorize Parent Linking Code: ${otp}`,
    html,
  });
}
