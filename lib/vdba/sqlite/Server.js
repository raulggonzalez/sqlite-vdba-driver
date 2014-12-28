//imports
var util = require("util");
var vdba = require("../../index");

//API
exports.SQLiteServer = SQLiteServer;

/**
 * A SQLite engine.
 *
 * @class vdba.sqlite.SQLiteServer
 * @extends vdba.Server
 * @protected
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 * @param {String} version                  The SQLite version.
 */
function SQLiteServer(cx, version) {
  SQLiteServer.super_.call(this);

  /**
   * The connection to use.
   *
   * @name connection
   * @type {vdba.sqlite.SQLiteConnection}
   * @memberof vdba.sqlite.SQLiteServer#
   * @private
   */
  Object.defineProperty(this, "connection", {value: cx});

  /**
   * The SQLite version.
   *
   * @name version
   * @type {String}
   * @memberof vdba.sqlite.SQLiteServer#
   */
  Object.defineProperty(this, "version", {value: version, enumerable: true});
}

util.inherits(SQLiteServer, vdba.Server);

/**
 * The hostname.
 *
 * @name host
 * @type {String}
 * @memberof vdba.sqlite.SQLiteServer#
 */
SQLiteServer.prototype.__defineGetter__("host", function() {
  return "localhost";
});

/**
 * The port. This returns undefined.
 *
 * @name port
 * @type {Number}
 * @memberof vdba.sqlite.SQLiteServer#
 */
SQLiteServer.prototype.__defineGetter__("port", function() {
  return undefined;
});