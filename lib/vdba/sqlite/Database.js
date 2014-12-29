//imports
var util = require("util");
var vdba = require("../../index");
var SQLEngine = require("./SQLEngine").SQLEngine;
var SQLiteTable = require("./Table").SQLiteTable;

//api
exports.SQLiteDatabase = SQLiteDatabase;

/**
 * A SQLite database.
 *
 * @class vdba.sqlite.SQLiteDatabase
 * @extends vdba.Database
 * @protected
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 * @param {String} name                     The database name.
 */
function SQLiteDatabase(cx, name) {
  SQLiteDatabase.super_.call(this, name);

  /**
   * The connection to use.
   *
   * @name connection
   * @type {vdba.sqlite.SQLiteConnection}
   * @memberof vdba.sqlite.SQLiteDatabase#
   */
  Object.defineProperty(this, "connection", {value: cx});

  /**
   * The SQL engine to use.
   *
   * @name engine
   * @type {vdba.sqlite.SQLEngine}
   * @memberof vdba.sqlite.SQLiteDatabase#
   * @private
   */
  Object.defineProperty(this, "engine", {value: new SQLEngine(this.connection)});
}

util.inherits(SQLiteDatabase, vdba.Database);

/**
 * Creates a new table.
 *
 * @name createTable
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 *
 * @param {String} table        The table name.
 * @param {Object} columns      The columns. Each column: the property name is the column name and
 *                              its value must be a string, being its type or an object with the column
 *                              info: type (String: ext, serial, int, float, date, time, timestamp, boolean),
 *                              unique (Boolean), primaryKey (Boolean), check (String),
 *                              default (String), nullable (Boolean).
 * @param {Object} [options]    The table options: temporary (Boolean), ifNotExists (Boolean).
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLiteDatabase.prototype.createTable = function createTable(table, columns, options, callback) {
  var sql;

  //(1) pre: arguments
  if (arguments.length == 3) {
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
      options = undefined;
    }
  }

  if (!table) throw new Error("Table name expected.");
  if (!columns || Object.keys(columns).length < 1) throw new Error("Table columns expected.");
  if (!options) options = {};

  //(2) build SQL
  //header
  sql = (options.temporary ? "CREATE TEMPORARY TABLE " : "CREATE TABLE ");
  if (options.ifNotExists) sql  += "IF NOT EXISTS ";
  sql += table;

  //columns
  sql +="(";

  for (var i = 0, names = Object.keys(columns); i < names.length; ++i) {
    var name = names[i];
    var col = columns[name];

    sql += (i > 0 ? ", " : "") + name;

    if (typeof(col) == "string") col = {type: col};

    if (col.type == "serial" && (col.primaryKey || col.pk)) {
      sql += " integer PRIMARY KEY AUTOINCREMENT";
    } else {
      sql += " " + (col.type || "");
    }

    if (col.unique) sql += " UNIQUE";
    if (col.hasOwnProperty("nullable") && !col.nullable) sql += " NOT NULL";
    if (col["default"]) sql += " DEFAULT(" + col["default"] + ")";
    if (col.check) sql += " CHECK(" + col.check + ")";
  }

  sql += ")";

  //(3) run SQL
  this.engine.run(sql, callback);
};

/**
 * Drops a table.
 *
 * @name dropTable
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 *
 * @param {String} table        The table name.
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLiteDatabase.prototype.dropTable = function dropTable(table, callback) {
  var sql;

  //(1) pre: arguments
  if (!table) throw new Error("Table name expected.");

  //(2) build SQL
  sql = "DROP TABLE IF EXISTS " + table;

  //(3) run
  this.engine.run(sql, callback);
};

/**
 * Checks whether a table exists.
 *
 * @name hasTable
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 *
 * @param {String} table      The table name.
 * @param {Function} callback The function to call: fn(error, exists).
 */
SQLiteDatabase.prototype.hasTable = function hasTable(table, callback) {
  var sql;

  //(1) pre: arguments
  if (!table) throw new Error("Table name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) build SQL
  sql = "SELECT count(*) as count FROM sqlite_master WHERE type='table' and name='" + table + "'";

  //(3) check
  this.engine.findOne(sql, function(error, row) {
    if (error) callback(error);
    else callback(undefined, row.count > 0);
  });
};

/**
 * Checks whether several tables exist.
 *
 * @name hasTables
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 *
 * @param {String[]} tables   The table names.
 * @param {Function} callback The function to call: fn(error, exists).
 */
SQLiteDatabase.prototype.hasTables = function hasTables(tables, callback) {
  var sql;

  //(1) pre: arguments
  if (!tables || tables.length === 0) throw new Error("Table names expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) build SQL
  sql = "SELECT count(*) as count FROM sqlite_master WHERE type='table' and name in (";

  for (var i = 0; i < tables.length; ++i) {
    sql += (i === 0 ? "" : ", ") + "'" + tables[i] + "'";
  }

  sql += ")";

  //(3) check
  this.engine.findOne(sql, function(error, row) {
    if (error) callback(error);
    else callback(undefined, row.count == tables.length);
  });
};

/**
 * Returns a table object.
 *
 * @name findTable
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 *
 * @param {String} table      The table name.
 * @param {Function} callback The function to call: fn(error, table).
 */
SQLiteDatabase.prototype.findTable = function findTable(table, callback) {
  var self = this;

  //(1) pre: arguments
  if (!table) throw new Error("Table name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find
  this.hasTable(table, function(error, exists) {
    if (error) {
      callback(error);
    } else {
      if (exists) callback(undefined, new SQLiteTable(self, table));
      else callback();
    }
  });
};