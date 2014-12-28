//imports
var util = require("util");
var vdba = require("../../index");
var SQLiteConnection = require("./Connection").SQLiteConnection;

//api
exports.SQLiteDriver = SQLiteDriver;

/**
 * The SQLite VDBA driver.
 *
 * @class vdba.sqlite.SQLiteDriver
 * @extends vdba.Driver
 * @protected
 */
function SQLiteDriver() {
  SQLiteDriver.super_.call(this, "SQLite");
}

util.inherits(SQLiteDriver, vdba.Driver);

/**
 * Creates a SQLite connection.
 *
 * @name createConnection
 * @function
 * @memberof vdba.sqlite.SQLiteDriver#
 *
 * @param {Object} config The configuration object: file (String), mode (String)
 *                        and create (Boolean).
 *
 * @returns {vdba.sqlite.SQLiteConnection}
 *
 * @example
 * cx = drv.createConnection({file: "mydb.db", mode: "readonly"});
 */
SQLiteDriver.prototype.createConnection = function createConnection(config) {
  return SQLiteConnection.getConnection(config);
};