/**
 * Timezone Detection Logic (Server-side)
 */

export async function detectTimezoneFromIP(ip: string) {
  try {
    // If local or unknown IP, use a default (Google Public DNS IP for testing)
    const targetIP = (ip === '::1' || ip === '127.0.0.1' || !ip) ? '8.8.8.8' : ip;

    const response = await fetch(`https://ipapi.co/${targetIP}/json/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      next: { revalidate: 3600 }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.timezone) {
        return {
          timezone: data.timezone || 'UTC',
          country: data.country_name || 'Universal',
          country_code: data.country_code || 'UN',
          city: data.city || 'Unknown',
          ip: data.ip || ip
        };
      }
    }

    // Try fallback service (ipwho.is) if ipapi rate-limits or fails
    const fallbackRes = await fetch(`https://ipwho.is/${targetIP}`, {
      next: { revalidate: 3600 }
    });
    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      if (fbData.success !== false) {
        return {
          timezone: fbData.timezone?.id || 'UTC',
          country: fbData.country || 'Universal',
          country_code: fbData.country_code || 'UN',
          city: fbData.city || 'Unknown',
          ip: fbData.ip || ip
        };
      }
    }

    throw new Error(`Timezone IP lookup services unavailable (ipapi status: ${response.status})`);
  } catch (error: any) {
    console.warn('Timezone detection warning (falling back to UTC):', error?.message || error);
    return {
      timezone: 'UTC',
      country: 'Universal',
      country_code: 'UN',
      city: 'Unknown',
      ip: ip
    };
  }
}
