import {
  PROVIDER_ACTIVITIES,
  getActivityLabel,
  isValidActivity,
} from '../constants/providerActivities.js';

export { PROVIDER_ACTIVITIES, getActivityLabel, isValidActivity };

const PROFILE_FIELDS = [
  'pseudo',
  'activity',
  'city',
  'postal_code',
  'company_name',
  'siret',
  'phone',
  'website_url',
  'bio',
  'intervention_radius_km',
  'has_rc_pro',
  'city_latitude',
  'city_longitude',
  'city_geocoded_at',
];

/** Luhn (depuis la droite) — SIREN 9 chiffres ou SIRET 14 chiffres. */
export function luhnValid(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = parseInt(digits[digits.length - 1 - i], 10);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function normalizeSiretOrSiren(value) {
  if (value == null || value === '') return null;
  return String(value).replace(/\s/g, '');
}

export function validateSiret(siret) {
  if (siret == null || siret === '') return null;
  const digits = normalizeSiretOrSiren(siret);
  if (/^\d{9}$/.test(digits)) {
    if (!luhnValid(digits)) {
      return 'SIREN invalide (vérifiez les 9 chiffres)';
    }
    return null;
  }
  if (/^\d{14}$/.test(digits)) {
    if (!luhnValid(digits)) {
      return 'SIRET invalide (vérifiez les 14 chiffres)';
    }
    return null;
  }
  return 'SIREN (9 chiffres) ou SIRET (14 chiffres, SIREN + NIC)';
}

export function pickProfileBody(body) {
  const data = {};
  for (const key of PROFILE_FIELDS) {
    if (body[key] === undefined) continue;
    if (key === 'has_rc_pro') {
      if (body[key] === null || body[key] === '') data.has_rc_pro = null;
      else data.has_rc_pro = Boolean(body[key]);
      continue;
    }
    if (key === 'intervention_radius_km') {
      if (body[key] === null || body[key] === '') data.intervention_radius_km = null;
      else {
        const n = parseInt(body[key], 10);
        if (!Number.isNaN(n) && n >= 0) data.intervention_radius_km = n;
      }
      continue;
    }
    if (key === 'siret') {
      data.siret = normalizeSiretOrSiren(body[key]);
      continue;
    }
    if (key === 'website_url') {
      const url = body[key] ? String(body[key]).trim() : null;
      data.website_url = url || null;
      continue;
    }
    if (typeof body[key] === 'string') {
      const v = body[key].trim();
      data[key] = v === '' ? null : v;
    } else {
      data[key] = body[key];
    }
  }
  return data;
}

export function profileCompletionPercent(user) {
  if (!user) return 0;
  const checks = [
    user.pseudo?.length >= 2,
    isValidActivity(user.activity),
    user.city?.length >= 2,
    user.city_geocoded_at,
    user.postal_code,
    user.company_name,
    user.siret,
    user.phone,
    user.website_url,
    user.bio,
    user.intervention_radius_km != null,
    user.has_rc_pro != null,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function formatSessionUser(user) {
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    role: user.role,
    activity: user.activity,
    activity_label: getActivityLabel(user.activity),
    city: user.city,
  };
}

export function formatPublicAuthor(row) {
  if (!row?.auteur_id) return null;
  return {
    id: row.auteur_id,
    pseudo: row.auteur_pseudo || null,
    activity: row.auteur_activity || null,
    activity_label: getActivityLabel(row.auteur_activity),
    city: row.auteur_city || null,
  };
}

export function formatMe(user, lieuxCounts) {
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    role: user.role,
    activity: user.activity,
    activity_label: getActivityLabel(user.activity),
    city: user.city,
    postal_code: user.postal_code,
    city_geocoded_at: user.city_geocoded_at,
    city_latitude: user.city_latitude != null ? Number(user.city_latitude) : null,
    city_longitude: user.city_longitude != null ? Number(user.city_longitude) : null,
    company_name: user.company_name,
    siret: user.siret,
    phone: user.phone,
    website_url: user.website_url,
    bio: user.bio,
    intervention_radius_km: user.intervention_radius_km,
    has_rc_pro: user.has_rc_pro,
    created_at: user.created_at,
    profile_updated_at: user.profile_updated_at,
    profile_completion: profileCompletionPercent(user),
    lieux_count: lieuxCounts.total,
    lieux_counts: { blacklist: lieuxCounts.blacklist, favori: lieuxCounts.favori },
  };
}

export function maskSiret(siret) {
  if (!siret || siret.length < 5) return siret || '—';
  return `*****${siret.slice(-5)}`;
}

export function needsCityGeocode(patch, existing) {
  if (patch.city === undefined && patch.postal_code === undefined) return false;
  const city = patch.city !== undefined ? patch.city : existing.city;
  const cp = patch.postal_code !== undefined ? patch.postal_code : existing.postal_code;
  if (!city || String(city).trim().length < 2) return false;
  if (
    existing.city_geocoded_at &&
    city === existing.city &&
    (cp || null) === (existing.postal_code || null)
  ) {
    return false;
  }
  return true;
}
