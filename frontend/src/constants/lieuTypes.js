export const LIEU_TYPES = {
  favori: {
    value: 'favori',
    label: 'Recommandé',
    color: '#22c55e',
    badgeClass: 'badge-favori',
  },
  blacklist: {
    value: 'blacklist',
    label: 'À éviter',
    color: '#ef4444',
    badgeClass: 'badge-blacklist',
  },
};

export function getLieuType(type) {
  return LIEU_TYPES[type] || LIEU_TYPES.blacklist;
}
