/**
 * @classdesc An engine to perform DELETE's and TRUNCATE's.
 * @class vdba.sqlite.RemoveEngine
 * @private
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 */
function RemoveEngine(cx) {
  RemoveEngine.super_.call(this, cx);
}

util.inherits(RemoveEngine, SQLEngine);

/**
 * Removes zero, one or several rows.
 *
 * @name remove
 * @function
 * @memberof vdba.sqlite.RemoveEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Object} filter                 The filter.
 * @param {Object} [options]              The delete options: If specified, always {}.
 * @param {Function} [callback]           The function to call: fn(error).
 */
RemoveEngine.prototype.remove = function remove(table, filter, options, callback) {
  var sql, expr;

  //(1) pre: arguments
  if (arguments.length == 2 && arguments[1] instanceof Function) {
    callback = arguments[1];
    filter = options = undefined;
  } else if (arguments.length == 3  && arguments[2] instanceof Function) {
    callback = arguments[2];
    options = undefined;
  }

  if (!table) throw new Error("Table expected.");
  if (!filter) filter = {};
  if (!options) options = {};

  //(2) build sql
  expr = this.filterFormatter.format(filter);
  sql = "DELETE FROM " + table.sqlQN + " WHERE " + expr.expression;

  //(3) delete
  this.runp(sql, expr.parameters, callback);
};

/**
 * Deletes all rows from the table.
 *
 * @name truncate
 * @function
 * @memberof vdba.sqlite.RemoveEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Function} [callback]           The function to call: fn(error).
 */
RemoveEngine.prototype.truncate = function truncate(table, callback) {
  //(1) pre: arguments
  if (!table) throw new Error("Table expected.");

  //(2) truncate
  this.run("DELETE FROM " + table.sqlQN, callback);
};