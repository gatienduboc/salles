export const DEFAULT_LIST_QUERY = {
  type: '',
  ville: '',
  search: '',
  auteur_id: '',
  sort: 'updated_at',
  order: 'desc',
  page: 1,
  limit: 20,
};

export const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Dernière mise à jour' },
  { value: 'created_at', label: 'Date de création' },
  { value: 'nom', label: 'Nom' },
  { value: 'ville', label: 'Ville' },
  { value: 'date_dernier_evenement', label: 'Dernier événement' },
];

export const LIMIT_OPTIONS = [10, 20, 50];

export function queryFromRoute(routeQuery) {
  const q = routeQuery;
  const limit = parseInt(q.limit, 10);
  return {
    type: typeof q.type === 'string' ? q.type : '',
    ville: typeof q.ville === 'string' ? q.ville : '',
    search: typeof q.search === 'string' ? q.search : '',
    auteur_id: (() => {
      const id = parseInt(q.auteur_id, 10);
      return id > 0 ? id : '';
    })(),
    sort: typeof q.sort === 'string' ? q.sort : DEFAULT_LIST_QUERY.sort,
    order: q.order === 'asc' ? 'asc' : 'desc',
    page: Math.max(1, parseInt(q.page, 10) || 1),
    limit: LIMIT_OPTIONS.includes(limit) ? limit : DEFAULT_LIST_QUERY.limit,
  };
}

export function queryToRouteParams(state) {
  const q = {};
  if (state.type) q.type = state.type;
  if (state.ville) q.ville = state.ville;
  if (state.search) q.search = state.search;
  if (state.auteur_id) q.auteur_id = String(state.auteur_id);
  if (state.sort !== DEFAULT_LIST_QUERY.sort) q.sort = state.sort;
  if (state.order !== DEFAULT_LIST_QUERY.order) q.order = state.order;
  if (state.page > 1) q.page = String(state.page);
  if (state.limit !== DEFAULT_LIST_QUERY.limit) q.limit = String(state.limit);
  return q;
}

export function buildApiParams(state, { forMap = false, omitAuteur = false } = {}) {
  const params = new URLSearchParams();
  if (state.type) params.set('type', state.type);
  if (state.ville) params.set('ville', state.ville);
  if (state.search) params.set('search', state.search);
  if (!omitAuteur && state.auteur_id) params.set('auteur_id', String(state.auteur_id));
  params.set('sort', state.sort);
  params.set('order', state.order);
  if (!forMap) {
    params.set('page', String(state.page));
    params.set('limit', String(state.limit));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
