/**
 * Timezone Detection Logic (Server-side)
 */

export async function detectTimezoneFromIP(ip: string) {
  try {
    // If local or unknown IP, use a default (Google Public DNS IP for testing)
    const targetIP = (ip === '::1' || ip === '127.0.0.1' || !ip) ? '8.8.8.8' : ip;

    const response = await fetch(`https://ipapi.co/${targetIP}/json/`);
    if (!response.ok) throw new Error('Failed to fetch from ipapi');
    
    const data = await response.json();

    return {
      timezone: data.timezone || 'UTC',
      country: data.country_name || 'Universal',
      country_code: data.country_code || 'UN',
      city: data.city || 'Unknown',
      ip: data.ip
    };
  } catch (error) {
    console.error('Timezone detection error:', error);
    return {
      timezone: 'UTC',
      country: 'Universal',
      country_code: 'UN',
      city: 'Unknown',
      ip: ip
    };
  }
}
