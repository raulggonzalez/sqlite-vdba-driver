/**
 * @classdesc A SQL engine.
 * @class vdba.sqlite.SQLEngine
 * @abstract
 * @private
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 */
function SQLEngine(cx) {
  /**
   * The connection to use.
   *
   * @name connection
   * @type {vdba.sqlite.SQLiteConnection}
   * @memberof vdba.sqlite.SQLEngine#
   * @protected
   */
  Object.defineProperty(this, "connection", {value: cx});
}

/**
 * The SQL formatter to use.
 *
 * @name filterFormatter
 * @type {vdba.sqlite.SQLFilterFormatter}
 * @memberof vdba.sqlite.SQLEngine#
 * @protected
 */
SQLEngine.prototype.__defineGetter__("filterFormatter", function() {
  return this.connection.filterFormatter;
});

/**
 * Begins a transaction.
 *
 * @name begin
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLEngine.prototype.begin = function begin(callback) {
  this.connection.native.run("BEGIN", callback);
};

/**
 * Commits the active transaction.
 *
 * @name commit
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLEngine.prototype.commit = function commit(callback) {
  this.connection.native.run("COMMIT", function(error) {
    if (error) callback(error);
    else callback();
  });
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
  this.connection.native.run("ROLLBACK", function(error) {
    if (error) callback(error);
    else callback();
  });
};

/**
 * Executes a SQL command.
 *
 * @name run
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {String|String[]} sql          The SQL command.
 * @param {Object} [options]    The run options: transaction (Boolean). Default: false.
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLEngine.prototype.run = function run(sql, options, callback) {
  var self = this;

  //(1) pre: argments
  if (arguments.length == 2 && arguments[1] instanceof Function) {
    callback = arguments[1];
    options = undefined;
  }

  if (!options) options = {transaction: false};

  //(2) execute
  if (sql instanceof Array) batch();
  else command();

  //helper functions
  function command() {
    self.connection.native.run(sql, function(error) {
      if (callback) callback(error || undefined);
    });
  }

  function batch() {
    var i = 0;

    if (options.transaction) self.connection.native.run("BEGIN", next);
    else next();

    //helper functions
    function next(error) {
      if (error) {
        if (options.transaction) {
          self.connection.native.run("ROLLBACK", function() {
            if (callback) callback(error);
          });
        } else {
          ++i;
          next();
        }
      } else {
        if (i < sql.length) {
          self.connection.native.run(sql[i++], next);
        } else {
          if (options.transaction) {
            self.connection.native.run("COMMIT", function(error) {
              if (callback) callback(error || undefined);
            });
          } else {
            if (callback) callback();
          }
        }
      }
    }
  }
};

/**
 * Parameterized run().
 *
 * @name runp
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {String} sql          The SQL command.
 * @param {Object[]} params     The parameters.
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLEngine.prototype.runp = function runp(sql, params, callback) {
  this.connection.native.run(sql, params, function(error) {
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
 * Parameterized find().
 *
 * @name findp
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {String} sql        The SQL command.
 * @param {Object[]} params   The parameters.
 * @param {Function} callback The function to call: fn(error, result).
 */
SQLEngine.prototype.findp = function findp(sql, params, callback) {
  this.connection.native.all(sql, params, function(error, result) {
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

/**
 * Parameterized findOne().
 *
 * @name findOnep
 * @function
 * @memberof vdba.sqlite.SQLEngine#
 *
 * @param {String} sql        The SQL command.
 * @param {Object[]} params   The parameters.
 * @param {Function} callback The function to call: fn(error, row).
 */
SQLEngine.prototype.findOnep = function findOnep(sql, params, callback) {
  this.connection.native.get(sql, params, function(error, row) {
    if (error) callback(error);
    else callback(undefined, row);
  });
};