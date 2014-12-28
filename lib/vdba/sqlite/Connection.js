//imports
var util = require("util");
var sqlite = require("sqlite3");
var vdba = require("../../index");
var SQLiteServer = require("./Server").SQLiteServer;
var SQLiteDatabase = require("./Database").SQLiteDatabase;

//api
exports.SQLiteConnection = SQLiteConnection;

/**
 * A SQLite connection.
 *
 * @class vdba.sqlite.SQLiteConnection
 * @extends vdba.Connection
 * @protected
 *
 * @param {Object} config       The connection configuration object.
 */
function SQLiteConnection(config) {
  SQLiteConnection.super_.call(this, config);
}

util.inherits(SQLiteConnection, vdba.Connection);

/**
 * Returns a new connection instance.
 *
 * @name getConnection
 * @function
 * @memberof vdba.sqlite.SQLiteConnection
 * @protected
 *
 * @param {Object} config The connection configuration object.
 *
 * @returns {vdba.sqlite.SQLiteConnection}
 */
SQLiteConnection.getConnection = function getConnection(config) {
  //(1) pre: arguments
  if (!config) throw new Error("Configuration expected.");
  if (!config.file) throw new Error("Database file expected.");

  //(2) pre: parse config
  config = util._extend({}, config);

  if (!config.mode) {
    config.mode = sqlite.OPEN_READWRITE;
  } else {
    if (config.mode == "readonly") config.mode = sqlite.OPEN_READONLY;
    else if (config.mode == "readwrite") config.mode = sqlite.OPEN_READWRITE;
    else throw new Error("Unknown open mode: " + config.mode + ".");
  }

  if (!config.hasOwnProperty("create") || config.create) {
    config.mode |= sqlite.OPEN_CREATE;
  }

  //(3) get connection
  return new SQLiteConnection(config);
};

/**
 * Opens the connection.
 *
 * @name open
 * @function
 * @memberof vdba.sqlite.SQLiteConnection#
 *
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLiteConnection.prototype.open = function open(callback) {
  var self = this;

  if (this.connected) {
    if (callback) callback();
  } else {
    var db = new sqlite.Database(this.config.file, this.config.mode, function(error) {
      if (error) {
        if (callback) callback(error);
      } else {
        //create native database object
        Object.defineProperty(self, "native", {value: db, configurable: true});

        //create current database object
        Object.defineProperty(self, "currentDatabase", {value: new SQLiteDatabase(self, "main")});

        //create server object
        self.findOne("SELECT sqlite_version() as version", function(error, row) {
          if (error) {
            if (callback) callback(error);
          } else {
            Object.defineProperty(self, "sqliteServer", {value: new SQLiteServer(self, row.version), configurable: true});
            if (callback) callback();
          }
        });
      }
    });
  }
};

/**
 * Closes the connection.
 *
 * @name close
 * @function
 * @memberof vdba.sqlite.SQLiteConnection#
 *
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLiteConnection.prototype.close = function close(callback) {
  if (this.connected) {
    var self = this;

    this.native.close(function() {
      delete self.native;
      delete self.sqliteServer;
      if (callback) callback();
    });
  } else {
    if (callback) callback();
  }
};

/**
 * Is this connected?
 *
 * @name connected
 * @type {Boolean}
 * @memberof vdba.sqlite.SQLiteConnection#
 */
SQLiteConnection.prototype.__defineGetter__("connected", function() {
  return (this.hasOwnProperty("native") ? this.native.open : false);
});

/**
 * The SQLite server connected to.
 *
 * @name server
 * @type {vdba.sqlite.SQLiteServer}
 * @memberof vdba.sqlite.SQLiteServer#
 */
SQLiteConnection.prototype.__defineGetter__("server", function() {
  return this.sqliteServer;
});

/**
 * The current database.
 *
 * @name database
 * @type {vdba.sqlite.SQLiteDatabase}
 * @memberof vdba.sqlite.SQLiteDatabase#
 */
SQLiteConnection.prototype.__defineGetter__("database", function() {
  return this.currentDatabase;
});

/**
 * Runs a SELECT command and returns the 1st row.
 *
 * @param {String} sql        The SELECT command to execute.
 * @param {Function} callback The function to call: fn(error, row).
 */
SQLiteConnection.prototype.findOne = function findOne(sql, callback) {
  //(1) connected?
  if (!this.connected) return callback(new Error("Not connected."));

  //(2) run
  this.native.get(sql, function(error, row) {
    if (error) callback(error);
    else callback(undefined, row);
  });
};