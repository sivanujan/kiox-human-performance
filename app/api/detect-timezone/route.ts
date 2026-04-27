import { NextResponse } from 'next/server';
import { detectTimezoneFromIP } from '@/lib/detectTimezone';

export async function GET(req: Request) {
  // Get client IP from headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : (realIp || null);
  
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return NextResponse.json({ 
      timezone: null, 
      message: 'Localhost detected, use browser API instead' 
    });
  }

  const data = await detectTimezoneFromIP(ip);

  return NextResponse.json(data);
}
