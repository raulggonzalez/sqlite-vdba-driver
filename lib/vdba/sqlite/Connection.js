/**
 * @classdesc A SQLite connection.
 * @class vdba.sqlite.SQLiteConnection
 * @extends vdba.Connection
 * @protected
 *
 * @param {Object} config The connection configuration object.
 */
function SQLiteConnection(driver, config) {
  SQLiteConnection.super_.call(this, driver, config);

  /**
   * The DDL engine to use in this connection.
   *
   * @name definer
   * @type {vdba.sqlite.DataDefinitionEngine}
   * @memberof vdba.sqlite.SQLiteConnection#
   * @protected
   */
  Object.defineProperty(this, "definer", {value: new DataDefinitionEngine(this)});

  /**
   * The SELECT engine to use in the connection.
   *
   * @name selector
   * @type {vdba.sqlite.SelectEngine}
   * @memberof vdba.sqlite.SQLiteConnection#
   * @protected
   */
  Object.defineProperty(this, "selector", {value: new SelectEngine(this)});

  /**
   * The INSERT engine to use in this connection.
   *
   * @name inserter
   * @type {vdba.sqlite.InsertEngine}
   * @memberof vdba.sqlite.SQLiteConnection#
   * @protected
   */
  Object.defineProperty(this, "inserter", {value: new InsertEngine(this)});

  /**
   * The UPDATE engine to use in this connection.
   *
   * @name updater
   * @type {vdba.sqlite.UpdateEngine}
   * @memberof vdba.sqlite.SQLiteConnection#
   * @protected
   */
  Object.defineProperty(this, "updater", {value: new UpdateEngine(this)});

  /**
   * The DELETE and TRUNCATE engine to use in this connection.
   *
   * @name remover
   * @type {vdba.sqlite.RemoveEngine}
   * @memberof vdba.sqlite.SQLiteConnection#
   * @protected
   */
  Object.defineProperty(this, "remover", {value: new RemoveEngine(this)});

  /**
   * The SQL filter formatter to use.
   *
   * @name filterFormatter
   * @type {vdba.SQLFilterFormatter}
   * @memberof vdba.sqlite.SQLiteConnection#
   * @private
   */
  Object.defineProperty(this, "filterFormatter", {value: new SQLFilterFormatter("?")});
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
 * @param {vdba.sqlite.SQLiteDriver} driver The driver that creates it.
 * @param {Object} config The connection configuration object.
 *
 * @returns {vdba.sqlite.SQLiteConnection}
 */
SQLiteConnection.getConnection = function getConnection(driver, config) {
  //(1) pre: arguments
  if (!config) throw new Error("Configuration expected.");
  if (!config.database) throw new Error("Database expected.");

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
  return new SQLiteConnection(driver, config);
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
    var db = new sqlite.Database(this.config.database, this.config.mode, function(error) {
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