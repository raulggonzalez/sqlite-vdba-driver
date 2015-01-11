/**
 * @classdesc A SQLite query.
 * @class vdba.sqlite.SQLiteQuery
 * @extends vdba.Query
 * @protected
 *
 * @param {vdba.sqlite.SQLiteTable} table The source table.
 */
function SQLiteQuery(table) {
  //(1) pre: arguments
  if (!table) throw new Error("Table expected.");

  //(2) initialize
  SQLiteQuery.super_.call(this);

  /**
   * The source table.
   *
   * @name source
   * @type {vdba.sqlite.SQLiteTable}
   * @memberof vdba.sqlite.SQLiteQuery#
   */
  Object.defineProperty(this, "source", {value: table});
}

util.inherits(SQLiteQuery, vdba.Query);

/**
   * The SQL engine to use.
   *
   * @name engine
   * @type {vdba.sqlite.SQLEngine}
   * @memberof vdba.sqlite.SQLiteQuery#
   */
SQLiteQuery.prototype.__defineGetter__("selector", function() {
  return this.source.selector;
});

/**
 * Runs the query.
 *
 * @name find
 * @function
 * @memberof vdba.sqlite.SQLiteQuery#
 *
 * @param {Object} [filter]   The filter object.
 * @param {Function} callback The function to call: fn(error, result).
 */
SQLiteQuery.prototype.find = function find(filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 1 && arguments[0] instanceof Function) {
    callback = arguments[0];
    filter = undefined;
  }

  //(2) configure filter if needed
  if (filter) this.filterBy = filter;

  //(3) find
  this.selector.runQuery(this, callback);
};