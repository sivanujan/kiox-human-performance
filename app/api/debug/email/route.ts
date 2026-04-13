import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json({ error: 'Missing test email address' }, { status: 400 });
    }

    // 1. Check Environment Variables
    const config = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ? '********' : 'MISSING',
      },
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    };

    console.log('--- SMTP DIAGNOSTIC START ---');
    console.log('Target:', testEmail);
    console.log('Config:', config);

    // 2. Create local transporter for deep debugging
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      debug: true, // Enable nodemailer debug output
      logger: true, // Log to console
    });

    // 3. Verify Connection
    try {
      await transporter.verify();
      console.log('SMTP Connection: VERIFIED');
    } catch (verifyError: any) {
      console.error('SMTP Connection: FAILED', verifyError);
      return NextResponse.json({ 
        success: false, 
        stage: 'CONNECTION_VERIFICATION',
        error: verifyError.message,
        code: verifyError.code,
        config: config
      }, { status: 500 });
    }

    // 4. Send Test Mail
    const info = await transporter.sendMail({
      from: `"KIO-X Debug" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '🚨 KIO-X SMTP DIAGNOSTIC TEST',
      text: 'If you are reading this, your SMTP credentials in lib/email.ts are VALID.',
      html: `
        <div style="background: black; color: white; padding: 40px; border: 1px solid #22c55e;">
          <h1 style="color: #22c55e;">DIAGNOSTIC SUCCESS</h1>
          <p>Your SMTP environment variables are correctly configured for <b>nodemailer</b>.</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;"/>
          <p style="font-size: 10px; color: gray;">TIME: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log('Message Sent:', info.messageId);
    console.log('--- SMTP DIAGNOSTIC END ---');

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      config: config
    });

  } catch (error: any) {
    console.error('DIAGNOSTIC CRITICAL ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      stage: 'CRITICAL_FAILURE',
      error: error.message 
    }, { status: 500 });
  }
}
