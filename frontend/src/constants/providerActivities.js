export const PROVIDER_ACTIVITIES = [
  { value: 'dj', label: 'DJ' },
  { value: 'traiteur', label: 'Traiteur' },
  { value: 'wedding_planner', label: 'Wedding planner' },
  { value: 'photographe', label: 'Photographe' },
  { value: 'fleuriste', label: 'Fleuriste' },
  { value: 'animation', label: 'Animation' },
  { value: 'sonorisation', label: 'Sonorisation' },
  { value: 'lieu', label: 'Lieu / salle' },
  { value: 'autre', label: 'Autre' },
];

export function getActivityLabel(activity) {
  return PROVIDER_ACTIVITIES.find((a) => a.value === activity)?.label || 'Autre';
}
