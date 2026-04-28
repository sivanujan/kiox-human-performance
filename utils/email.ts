import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"KIO-X ELITE" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email Dispatch Error:", error);
    return { success: false, error };
  }
}

export function getInviteEmailTemplate(agentName: string, inviteLink: string, teamName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KIO-X Tactical Invitation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          background-color: #080808;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #ffffff;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #0a0a0a;
          border: 1px solid #22c55e33;
          border-radius: 24px;
          overflow: hidden;
          margin-top: 40px;
          margin-bottom: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        .header {
          padding: 60px 40px;
          background: linear-gradient(135deg, #22c55e11 0%, #000000 100%);
          border-bottom: 1px solid #22c55e11;
          text-align: center;
        }
        
        .logo {
          font-weight: 900;
          font-size: 32px;
          letter-spacing: 0.3em;
          color: #ffffff;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: #22c55e1a;
          border: 1px solid #22c55e;
          color: #22c55e;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: 100px;
          text-transform: uppercase;
        }
        
        .content {
          padding: 60px 40px;
          text-align: center;
        }
        
        h1 {
          font-size: 36px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          line-height: 1.1;
        }
        
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #888888;
          margin-bottom: 32px;
        }
        
        .unit-card {
          background-color: #111111;
          border: 1px solid #ffffff0d;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 40px;
          text-align: left;
        }
        
        .unit-label {
          font-size: 10px;
          font-weight: 700;
          color: #444444;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        
        .unit-name {
          font-size: 18px;
          font-weight: 700;
          color: #22c55e;
          text-transform: uppercase;
        }
        
        .btn {
          display: inline-block;
          padding: 20px 40px;
          background-color: #22c55e;
          color: #000000 !important;
          text-decoration: none;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 2px;
          border-radius: 16px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(34,197,94,0.3);
        }
        
        .footer {
          padding: 40px;
          background-color: #050505;
          text-align: center;
          border-top: 1px solid #ffffff08;
        }
        
        .footer-text {
          font-size: 12px;
          color: #333333;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIO-X</div>
          <div class="badge">Tactical Onboarding</div>
        </div>
        
        <div class="content">
          <h1>Identity Verification Required</h1>
          <p>Agent <strong>${agentName}</strong>, you have been provisioned for the KIO-X Elite Performance Matrix. Your tactical profile is ready for activation.</p>
          
          <div class="unit-card">
            <div class="unit-label">ASSIGNED OPERATIONAL UNIT</div>
            <div class="unit-name">${teamName}</div>
          </div>
          
          <a href="${inviteLink}" class="btn">Activate Tactical Access</a>
          
          <p style="margin-top: 40px; font-size: 12px; color: #444444;">Link expires in 24 hours. If you did not expect this dispatch, ignore this protocol.</p>
        </div>
        
        <div class="footer">
          <div class="footer-text">KIO-X HUMAN PERFORMANCE // ELITE DIVISION</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getBookingRequestTemplate(athleteName: string, date: string, time: string, sessionTitle: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KIO-X Booking Request</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          background-color: #080808;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #ffffff;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #0a0a0a;
          border: 1px solid #22c55e33;
          border-radius: 24px;
          overflow: hidden;
          margin-top: 40px;
          margin-bottom: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        .header {
          padding: 60px 40px;
          background: linear-gradient(135deg, #22c55e11 0%, #000000 100%);
          border-bottom: 1px solid #22c55e11;
          text-align: center;
        }
        
        .logo {
          font-weight: 900;
          font-size: 32px;
          letter-spacing: 0.3em;
          color: #ffffff;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: #22c55e1a;
          border: 1px solid #22c55e;
          color: #22c55e;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: 100px;
          text-transform: uppercase;
        }
        
        .content {
          padding: 60px 40px;
          text-align: center;
        }
        
        h1 {
          font-size: 36px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          line-height: 1.1;
        }
        
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #888888;
          margin-bottom: 32px;
        }
        
        .session-card {
          background-color: #111111;
          border: 1px solid #ffffff0d;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 40px;
          text-align: left;
        }
        
        .label {
          font-size: 10px;
          font-weight: 700;
          color: #444444;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        
        .value {
          font-size: 18px;
          font-weight: 700;
          color: #22c55e;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        
        .btn {
          display: inline-block;
          padding: 20px 40px;
          background-color: #22c55e;
          color: #000000 !important;
          text-decoration: none;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 2px;
          border-radius: 16px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(34,197,94,0.3);
        }
        
        .footer {
          padding: 40px;
          background-color: #050505;
          text-align: center;
          border-top: 1px solid #ffffff08;
        }
        
        .footer-text {
          font-size: 12px;
          color: #333333;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIO-X</div>
          <div class="badge">Session Request</div>
        </div>
        
        <div class="content">
          <h1>New Booking Request</h1>
          <p>Athlete <strong>${athleteName}</strong> has requested a tactical session deployment.</p>
          
          <div class="session-card">
            <div class="label">SESSION TYPE</div>
            <div class="value">${sessionTitle}</div>
            
            <div class="label">OPERATIONAL DATE</div>
            <div class="value">${date}</div>
            
            <div class="label">COMMENCEMENT TIME</div>
            <div class="value">${time}</div>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/admin/bookings" class="btn">Review Request</a>
        </div>
        
        <div class="footer">
          <div class="footer-text">KIO-X HUMAN PERFORMANCE // COACHING DIVISION</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getBookingConfirmationTemplate(name: string, date: string, time: string, sessionTitle: string, isCoach: boolean = false) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KIO-X Session Confirmed</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          background-color: #080808;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #ffffff;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #0a0a0a;
          border: 1px solid #22c55e33;
          border-radius: 24px;
          overflow: hidden;
          margin-top: 40px;
          margin-bottom: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        .header {
          padding: 60px 40px;
          background: linear-gradient(135deg, #22c55e11 0%, #000000 100%);
          border-bottom: 1px solid #22c55e11;
          text-align: center;
        }
        
        .logo {
          font-weight: 900;
          font-size: 32px;
          letter-spacing: 0.3em;
          color: #ffffff;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: #22c55e1a;
          border: 1px solid #22c55e;
          color: #22c55e;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: 100px;
          text-transform: uppercase;
        }
        
        .content {
          padding: 60px 40px;
          text-align: center;
        }
        
        h1 {
          font-size: 36px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          line-height: 1.1;
        }
        
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #888888;
          margin-bottom: 32px;
        }
        
        .session-card {
          background-color: #111111;
          border: 1px solid #ffffff0d;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 40px;
          text-align: left;
        }
        
        .label {
          font-size: 10px;
          font-weight: 700;
          color: #444444;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        
        .value {
          font-size: 18px;
          font-weight: 700;
          color: #22c55e;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        
        .btn {
          display: inline-block;
          padding: 20px 40px;
          background-color: #22c55e;
          color: #000000 !important;
          text-decoration: none;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 2px;
          border-radius: 16px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(34,197,94,0.3);
        }
        
        .footer {
          padding: 40px;
          background-color: #050505;
          text-align: center;
          border-top: 1px solid #ffffff08;
        }
        
        .footer-text {
          font-size: 12px;
          color: #333333;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIO-X</div>
          <div class="badge">Deployment Confirmed</div>
        </div>
        
        <div class="content">
          <h1>Session Confirmed</h1>
          <p>Agent <strong>${name}</strong>, your tactical session has been officially confirmed and scheduled.</p>
          
          <div class="session-card">
            <div class="label">SESSION TYPE</div>
            <div class="value">${sessionTitle}</div>
            
            <div class="label">OPERATIONAL DATE</div>
            <div class="value">${date}</div>
            
            <div class="label">COMMENCEMENT TIME</div>
            <div class="value">${time}</div>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/${isCoach ? 'admin' : 'schedule'}" class="btn">View Schedule</a>
        </div>
        
        <div class="footer">
          <div class="footer-text">KIO-X HUMAN PERFORMANCE // ELITE DIVISION</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getProgramApprovalTemplate(athleteName: string, programTitle: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KIO-X Protocol Initialized</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          background-color: #080808;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #ffffff;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #0a0a0a;
          border: 1px solid #22c55e33;
          border-radius: 24px;
          overflow: hidden;
          margin-top: 40px;
          margin-bottom: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        .header {
          padding: 60px 40px;
          background: linear-gradient(135deg, #22c55e11 0%, #000000 100%);
          border-bottom: 1px solid #22c55e11;
          text-align: center;
        }
        
        .logo {
          font-weight: 900;
          font-size: 32px;
          letter-spacing: 0.3em;
          color: #ffffff;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: #22c55e1a;
          border: 1px solid #22c55e;
          color: #22c55e;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: 100px;
          text-transform: uppercase;
        }
        
        .content {
          padding: 60px 40px;
          text-align: center;
        }
        
        h1 {
          font-size: 36px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          line-height: 1.1;
        }
        
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #888888;
          margin-bottom: 32px;
        }
        
        .program-card {
          background-color: #111111;
          border: 1px solid #22c55e22;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
          text-align: center;
        }
        
        .label {
          font-size: 10px;
          font-weight: 700;
          color: #444444;
          text-transform: uppercase;
          letter-spacing: 4px;
          margin-bottom: 12px;
        }
        
        .value {
          font-size: 24px;
          font-weight: 900;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .btn {
          display: inline-block;
          padding: 20px 40px;
          background-color: #22c55e;
          color: #000000 !important;
          text-decoration: none;
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 2px;
          border-radius: 16px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(34,197,94,0.3);
        }
        
        .footer {
          padding: 40px;
          background-color: #050505;
          text-align: center;
          border-top: 1px solid #ffffff08;
        }
        
        .footer-text {
          font-size: 12px;
          color: #333333;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIO-X</div>
          <div class="badge">Matrix Access Granted</div>
        </div>
        
        <div class="content">
          <h1>Protocol Initialized</h1>
          <p>Agent <strong>${athleteName}</strong>, your request for tactical matrix deployment has been verified. You now have full access to the operational architecture.</p>
          
          <div class="program-card">
            <div class="label">ACTIVE PROTOCOL</div>
            <div class="value">${programTitle}</div>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/program" class="btn">Access Protocol</a>
          
          <p style="margin-top: 40px; font-size: 14px; color: #666666;">Check your "Tactical Schedule" in the dashboard to see your assigned training blocks.</p>
        </div>
        
        <div class="footer">
          <div class="footer-text">KIO-X HUMAN PERFORMANCE // ELITE DIVISION</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
