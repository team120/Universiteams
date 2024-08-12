export function getRelationsFromRequest(findOptions) {
  if (!findOptions.relations) return [];
  return Array.isArray(findOptions.relations)
    ? findOptions.relations
    : [findOptions.relations];
}
