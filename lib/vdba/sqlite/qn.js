/**
 * Returns the SQL qualified name to a schema, table and column.
 *
 * @param {String} schema The schema name.
 * @param {String} table  The table name.
 * @param {String} column The column name.
 *
 * @returns {String}
 */
function sqlQN(schema, table, col) {
  var res;

  //(1) build
  if (schema == "default") {
    if (col) res = "\"" + table + "." + col + "\"";
    else res = table;
  } else {
    res = "\"" + schema + "." + table + (col ? "." + col : "") + "\"";
  }

  //(2) return
  return res.toLowerCase();
}

/**
 * Returns the qualified name to a schema and table.
 *
 * @param {String} schema The schema name.
 * @param {String} table  The table name.
 *
 * @returns {String}
 */
function qn(schema, table) {
  var res;

  //(1) build
  if (schema == "default") res = table;
  else res = schema + "." + table;

  //(2) return
  return res.toLowerCase();
}