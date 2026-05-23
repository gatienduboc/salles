export const PROVIDER_ACTIVITIES = [
  'dj',
  'traiteur',
  'wedding_planner',
  'photographe',
  'fleuriste',
  'animation',
  'sonorisation',
  'lieu',
  'autre',
];

export const ACTIVITY_LABELS = {
  dj: 'DJ',
  traiteur: 'Traiteur',
  wedding_planner: 'Wedding planner',
  photographe: 'Photographe',
  fleuriste: 'Fleuriste',
  animation: 'Animation',
  sonorisation: 'Sonorisation',
  lieu: 'Lieu / salle',
  autre: 'Autre',
};

export function getActivityLabel(activity) {
  return ACTIVITY_LABELS[activity] || ACTIVITY_LABELS.autre;
}

export function isValidActivity(activity) {
  return PROVIDER_ACTIVITIES.includes(activity);
}
