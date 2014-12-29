//imports
var SQLiteResult = require("./Result").SQLiteResult;

//api
exports.SQLEngine = SQLEngine;

/**
 * The SQL engine.
 *
 * @class vdba.sqlite.SQLEngine
 * @private
 */
function SQLEngine(cx) {
  /**
   * The connection to use.
   *
   * @name connection
   * @type {vdba.sqlite.SQLiteConnection}
   * @memberof vdba.sqlite.SQLEngine#
   */
  Object.defineProperty(this, "connection", {value: cx});
}

/**
 * Begins a transaction.
 *
 * @name begin
 * @function
 * @memberof vbda.sqlite.SQLEngine#
 *
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLEngine.prototype.begin = function begin(callback) {
  this.connection.native.run("BEGIN", callback);
};

/**
 * Rolls back the active transaction.
 *
 * @name rollback
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLEngine.prototype.rollback = function rollback(callback) {
  this.connection.native.run("ROLLBACK", callback);
};

/**
 * Executes a SQL command.
 *
 * @name run
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {String} sql          The SQL command.
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLEngine.prototype.run = function run(sql, callback) {
  this.connection.native.run(sql, function(error) {
    if (callback) {
      if (error) callback(error);
      else callback();
    }
  });
};

/**
 * Executes a SQL command that returns a result.
 *
 * @name find
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {String} sql        The SQL command.
 * @param {Function} callback The function to call: fn(error, result).
 */
SQLEngine.prototype.find = function find(sql, callback) {
  this.connection.native.all(sql, function(error, result) {
    if (error) callback(error);
    else callback(undefined, new SQLiteResult(result));
  });
};

/**
 * Executes a SQL command and returns the first row.
 *
 * @name findOne
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {String} sql        The SQL command.
 * @param {Function} callback The function to call: fn(error, row).
 */
SQLEngine.prototype.findOne = function findOne(sql, callback) {
  this.connection.native.get(sql, function(error, row) {
    if (error) callback(error);
    else callback(undefined, row);
  });
};