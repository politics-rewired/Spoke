const encode = value => Buffer.from(`${value}`).toString("base64");
const decode = value => Buffer.from(value, "base64").toString();

const defaultOptions = {
  primaryColumn: "id",
  nodeTransformer: node => node
};

/**
 * Take a basic query and return it as a Relay-style page
 *
 * @param {Knex} query The base query to paginate (only joins, wheres, etc.)
 * @param {Object} options Options for creating the page
 * @param {Cursor} [options.after] The cursor to begin the query at
 * @param {number} [options.first] How many results to return in the page
 * @param {number} [options.primaryColumn] The name of the primary ID column.
 * The needs to be passed if query is a join.
 * @param {Function} [options.nodeTransformer] Transformation to turn a record into a node.
 * This could be used for destructuring results of a join query.
 */
export const formatPage = async (query, options) => {
  const { after, first, primaryColumn, nodeTransformer } = Object.assign(
    {},
    defaultOptions,
    options
  );
  const countQuery = query.clone().clearSelect();

  if (after) {
    const afterId = decode(after);
    query.where(primaryColumn, ">", afterId);
  }

  if (first) {
    query.limit(first + 1);
  }

  query.orderBy(primaryColumn);

  const [{ count: totalCount }] = await countQuery.count();
  const results = await query;
  const edges = results.slice(0, first || undefined).map(record => ({
    cursor: encode(record[primaryColumn]),
    node: nodeTransformer(record)
  }));
  const pageInfo = {
    totalCount,
    hasNextPage: first && results.length > first,
    // Backward pagination not yet supported
    hasPreviousPage: false,
    startCursor: edges.length > 0 ? edges[0].cursor : null,
    endCursor: edges.length > 0 ? edges.slice(-1)[0].cursor : null
  };
  return {
    edges,
    pageInfo
  };
};
