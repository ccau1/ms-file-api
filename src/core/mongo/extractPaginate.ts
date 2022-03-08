export default (query: { [key: string]: any }) => {
  return {
    ...(query.select ? { select: query.select } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
    ...(query.offset ? { offset: query.offset } : {}),
    ...(query.page ? { page: query.page } : {}),
    ...(query.limit ? { limit: query.limit } : {}),
  };
};
