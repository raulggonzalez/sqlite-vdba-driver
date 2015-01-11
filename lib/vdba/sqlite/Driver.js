/**
 * @classdesc The SQLite VDBA driver.
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
 * @param {Object} config The configuration object: database (String), mode (String)
 *                        and create (Boolean).
 *
 * @returns {vdba.sqlite.SQLiteConnection}
 */
SQLiteDriver.prototype.createConnection = function createConnection(config) {
  return SQLiteConnection.getConnection(this, config);
};

//static
vdba.Driver.register(new SQLiteDriver());