import React from 'react';

// Country name → ISO code for flag images
const countryCodes = {
    'India': 'in',
    'Australia': 'au',
    'New Zealand': 'nz',
    'South Africa': 'za',
    'England': 'gb-eng',
    'Afghanistan': 'af',
    'Bangladesh': 'bd',
    'Sri Lanka': 'lk',
    'West Indies': 'tt', // Trinidad flag as proxy
    'Ireland': 'ie',
    'Zimbabwe': 'zw',
    'Pakistan': 'pk',
    'Nepal': 'np',
    'USA': 'us',
    'Netherlands': 'nl',
    'Scotland': 'gb-sct',
    'Oman': 'om',
    'UAE': 'ae',
    'Namibia': 'na',
    'Kenya': 'ke',
    'Canada': 'ca',
};

// Get country flag image URL (flagcdn.com)
export function getCountryFlagUrl(country) {
    const code = countryCodes[country] || 'un';
    return `https://flagcdn.com/w40/${code}.png`;
}

// Country flag as a React img element
export function CountryFlag({ country, size = 20 }) {
    const code = countryCodes[country] || 'un';
    return (
        <img
            src={`https://flagcdn.com/w40/${code}.png`}
            alt={country}
            style={{ width: size, height: Math.round(size * 0.67), objectFit: 'cover', borderRadius: 2, display: 'inline-block', verticalAlign: 'middle' }}
            onError={e => { e.target.style.display = 'none'; }}
        />
    );
}

// Team logo component with proper fallback
export function TeamLogo({ team, size = 40 }) {
    return (
        <img
            src={team.logo}
            alt={team.shortName}
            style={{ width: size, height: size, objectFit: 'contain' }}
            onError={e => {
                e.target.onerror = null;
                e.target.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="8" fill="${team.primaryColor}22"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${team.primaryColor}" font-family="sans-serif" font-weight="bold" font-size="${size * 0.3}">${team.shortName}</text></svg>`)}`;
            }}
        />
    );
}

// Player image URL using ESPN cricinfo naming
export function getPlayerImageUrl(playerName) {
    const slug = playerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://img1.hscicdn.com/image/upload/f_auto,t_h_100/lsci/db/PICTURES/CMS/364600/${slug}.jpg`;
}

// Fallback to initials-based avatar SVG
export function getPlayerAvatarSvg(playerName, color = '#d4af37') {
    const parts = playerName.split(' ');
    const initials = parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].slice(0, 2);
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="${color}15"/><circle cx="60" cy="60" r="58" stroke="${color}40" stroke-width="2" fill="none"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${color}" font-family="sans-serif" font-weight="900" font-size="40">${initials.toUpperCase()}</text></svg>`)}`;
}
