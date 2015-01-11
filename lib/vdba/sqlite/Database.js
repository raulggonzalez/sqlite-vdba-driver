/**
 * @classdesc A SQLite database.
 * @class vdba.sqlite.SQLiteDatabase
 * @extends vdba.Database
 * @protected
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 * @param {String} name                     The database name.
 */
function SQLiteDatabase(cx, name) {
  SQLiteDatabase.super_.call(this, cx, name);
}

util.inherits(SQLiteDatabase, vdba.Database);

/**
 * The SELECT engine to use.
 *
 * @name selector
 * @type {vdba.sqlite.SelectEngine}
 * @memberof vdba.sqlite.SQLiteDatabase#
 * @private
 */
SQLiteDatabase.prototype.__defineGetter__("selector", function() {
  return this.connection.selector;
});

/**
 * The DDL engine to use.
 *
 * @name definer
 * @type {vdba.sqlite.DataDefinitionEngine}
 * @memberof vdba.sqlite.SQLiteDatabase#
 * @private
 */
SQLiteDatabase.prototype.__defineGetter__("definer", function() {
  return this.connection.definer;
});

/**
 * Reads a schema.
 *
 * @name readSchema
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 * @protected
 *
 * @param {String} name       The schema name.
 * @param {Function} callback The function to call: fn(error, schema).
 */
SQLiteDatabase.prototype.readSchema = function readSchema(name, callback) {
  //(1) pre: arguments
  if (!name) throw new Error("Schema name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find
  callback(undefined, new SQLiteSchema(this, name));
};

/**
 * Returns a schema.
 *
 * @name getSchema
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 * @private
 *
 * @param {String} name The schema name.
 * @returns {vdba.sqlite.SQLiteSchema}
 */
SQLiteDatabase.prototype.getSchema = function getSchema(name) {
  return (this.definitionCache.getSchema(name) || new SQLiteSchema(this, name));
};

if (SPEC_TYPE > 1) {
  /**
   * Creates a schema.
   *
   * @name createSchema
   * @function
   * @memberof vdba.sqlite.SQLiteDatabase#
   *
   * @param {String} name         The schema name.
   * @param {Object} [options]    The create options.
   * @param {Function} [callback] The function to call: fn(error).
   */
  SQLiteDatabase.prototype.createSchema = function createSchema(name, options, callback) {
    //(1) pre: arguments
    if (arguments.length == 2 && arguments[1] instanceof Function) {
      callback = arguments[1];
      options = undefined;
    }

    if (!name) throw new Error("Schema name expected.");
    if (!options) options = {};

    //(2) create: nothing to do
    process.nextTick(function() {
      if (callback) callback();
    });
  };

  /**
   * Drops a schema.
   *
   * @name dropSchema
   * @function
   * @memberof vdba.sqlite.SQLiteDatabase#
   *
   * @param {String} name         The schema name.
   * @param {Object} [options]    The drop options.
   * @param {Function} [callback] The function to call: fn(error).
   */
  SQLiteDatabase.prototype.dropSchema = function dropSchema(name, options, callback) {
    //(1) pre: arguments
    if (arguments.length == 2 && arguments[1] instanceof Function) {
      callback = arguments[1];
      options = undefined;
    }

    if (!name) throw new Error("Schema name expected.");
    if (!options) options = {};

    //(2) drop
    //TODO: pending
    process.nextTick(function() {
      if (callback) callback();
    });
  };
}

/**
 * Reads the info of a table.
 *
 * @name radTable
 * @function
 * @memberof vdba.sqlite.SQLiteDatabase#
 * @protected
 *
 * @param {String} schema     The schema name.
 * @param {String} table      The table name.
 * @param {Function} callback The function to call: fn(error, table).
 */
SQLiteDatabase.prototype.readTable = function readTable(schema, table, callback) {
  var self = this, sql;

  //(1) pre: arguments
  if (!schema) throw new Error("Schema name expected.");
  if (!table) throw new Error("Table name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) build sql
  sql  = "PRAGMA table_info('" + qn(schema, table) + "')";

  //(3) find
  this.selector.find(sql, function(error, result) {
    if (error) {
      callback(error);
    } else {
      if (result.length === 0) callback();
      else callback(undefined, new SQLiteTable(self.getSchema(schema), table, getColumnsOf(result)));
    }
  });

  //helper functions
  function getColumnsOf(result) {
    var cols = {};

    for (var i = 0; i < result.length; ++i) {
      var col = result.rows[i];
      var type = col.type;

      if (type == "setofinteger") type = "set<integer>";
      else if (type == "setoftext") type = "set<text>";

      cols[col.name] = new SQLiteColumn(col.name, type, {nullable: !col.notnull, primaryKey: col.pk !== 0});
    }

    return cols;
  }
};

if (SPEC_TYPE > 1) {
  /**
   * Creates a new table.
   *
   * @name createTable
   * @function
   * @memberof vdba.sqlite.SQLiteDatabase#
   *
   * @param {String} schema       The schema name.
   * @param {String} table        The table name.
   * @param {Object} columns      The columns.
   * @param {Object} [options]    The table options: temporary (Boolean), ifNotExists (Boolean).
   * @param {Function} [callback] The function to call: fn(error).
   */
  SQLiteDatabase.prototype.createTable = function createTable(schema, table, columns, options, callback) {
    var self = this, sql;

    //(1) pre: arguments
    if (arguments.length == 4 && arguments[3] instanceof Function) {
      callback = arguments[3];
      options = undefined;
    }

    if (!schema) throw new Error("Schema name expected.");
    if (!table) throw new Error("Table name expected.");
    if (!columns || Object.keys(columns).length < 1) throw new Error("Table columns expected.");
    if (!options) options = {};

    //(2) build sql
    //header
    sql = "CREATE " + (options.temporary ? "TEMPORARY " : "") + "TABLE " +
          (options.ifNotExists ? "IF NOT EXISTS " : "") +
          sqlQN(schema, table);

    //columns
    sql +="(";

    for (var i = 0, names = Object.keys(columns); i < names.length; ++i) {
      var name = names[i];
      var col = columns[name];

      sql += (i > 0 ? ", " : "") + name + " ";

      if (typeof(col) == "string") col = {type: col};

      if (col.type == "sequence") sql += "integer";
      else if (col.type == "blob") sql += "blob";
      else if (col.type == "integer") sql += "integer";
      else if (col.type == "real") sql += "real";
      else if (col.type == "text") sql += "text";
      else if (col.type == "date") sql += "date";
      else if (col.type == "time") sql += "time";
      else if (col.type == "datetime") sql += "datetime";
      else if (col.type == "boolean") sql += "boolean";
      else if (col.type == "set<integer>") sql += "setofinteger";
      else if (col.type == "set<text>") sql += "setoftext";

      if (col.primaryKey || col.pk) sql += " PRIMARY KEY" + (col.type == "sequence" ? " AUTOINCREMENT" : "");
      if (col.unique || col.uq) sql += " UNIQUE";
      if (col.hasOwnProperty("nullable") && !col.nullable) sql += " NOT NULL";
      if (col.hasOwnProperty("default")) sql += " DEFAULT(" + col["default"] + ")";
      if (col.hasOwnProperty("check")) sql += " CHECK(" + col.check + ")";
      if (col.hasOwnProperty("ref")) sql += " " + buildReferences();
    }

    sql += ")";

    //(3) run SQL command
    self.definer.run(sql, callback);

    //helper functions
    function buildReferences() {
      var s, t, c, dot1, dot2, ref = col.ref;

      //(1) get dot locations
      dot1 = ref.indexOf(".");
      dot2 = ref.lastIndexOf(".");

      //(2) get schema, table and column
      if (dot1 == dot2) { //table.column
        s = schema;
        t = ref.substr(0, dot1);
        c = ref.substr(dot1+1);
      } else {            //schema.table.column
        s = ref.substr(0, dot1);
        t = ref.substr(dot1+1, dot2-dot1-1);
        c = ref.substr(dot2+1);
      }

      //(3) return
      return "REFERENCES " + sqlQN(s, t) + "(" + c + ") ON DELETE CASCADE ON UPDATE CASCADE";
    }
  };

  /**
   * Drops a table.
   *
   * @name dropTable
   * @function
   * @memberof vdba.sqlite.SQLiteDatabase#
   *
   * @param {String} schema       The schema name.
   * @param {String} table        The table name.
   * @param {Function} [callback] The function to call: fn(error).
   */
  SQLiteDatabase.prototype.dropTable = function dropTable(schema, table, callback) {
    var self = this, sql;

    //(1) pre: arguments
    if (!schema) throw new Error("Schema name expected.");
    if (!table) throw new Error("Table name expected.");

    //(2) build SQL
    sql = "DROP TABLE IF EXISTS " + sqlQN(schema, table);

    //(3) drop
    self.definer.run(sql, function(error) {
      self.definitionCache.removeTable(schema, table);
      if (callback) callback(error || undefined);
    });
  };

  /**
   * Creates an index on a table.
   *
   * @name createIndex
   * @function
   * @memberof vdba.sqlite.SQLiteDatabase#
   *
   * @param {String} schema           The schema name.
   * @param {String} table            The table name.
   * @param {String} index            The index name.
   * @param {String|String[]} columns The column name(s).
   * @param {Object} [options]        The index options: ifNotExists (Boolean), unique (Boolean).
   * @param {Function} [callback]     The function to call: fn(error).
   */
  SQLiteDatabase.prototype.createIndex = function createIndex(schema, table, index, columns, options, callback) {
    var sql;

    //(1) pre: arguments
    if (arguments.length == 5 && arguments[4] instanceof Function) {
      callback = arguments[4];
      options = undefined;
    }

    if (!schema) throw new Error("Schema expected.");
    if (!table) throw new Error("Table expected.");
    if (!index) throw new Error("Index name expected.");
    if (!columns) throw new Error("Indexing column(s) expected.");
    if (!(columns instanceof Array)) columns = [columns];
    if (columns.length < 1) throw new Error("Indexing column(s) expected.");
    if (!options) options = {};

    //(2) build sql
    sql = "CREATE " + (options.unique ? "UNIQUE " : "") + "INDEX " +
          (options.ifNotExists ? "IF NOT EXISTS " : "") + sqlQN(schema, index) +
          " ON " + sqlQN(schema, table) + "(";

    for (var i = 0; i < columns.length; ++i) {
      sql += (i === 0 ? "" :  ", ") + columns[i];
    }

    sql += ")";

    //(3) create
    this.definer.run(sql, callback);
  };

  /**
   * Drops an index on a table.
   *
   * @name dropIndex
   * @function
   * @memberof vdba.sqlite.SQLiteDatabase#
   *
   * @param {String} schema       The schema name.
   * @param {String} index        The index.
   * @param {Function} [callback] The function to call: fn(error).
   */
  SQLiteDatabase.prototype.dropIndex = function dropIndex(schema, index, callback) {
    //(1) pre: arguments
    if (!schema) throw new Error("Schema expected.");
    if (!index) throw new Error("Index expected.");

    //(2) drop
    this.definer.run("DROP INDEX IF EXISTS " + sqlQN(schema, index), callback);
  };

  /**
   * Finds an index object.
   *
   * @name findIndex
   * @function
   * @memberof vdba.sqlite.SQLiteDatabase#
   *
   * @param {String} schema     The schema.
   * @param {String} index      The index name.
   * @param {Function} callback The function to call: fn(error, index).
   */
  SQLiteDatabase.prototype.findIndex = function findIndex(schema, index, callback) {
    var self = this, sql;

    //(1) pre: arguments
    if (!schema) throw new Error("Schema expected.");
    if (!index) throw new Error("Index name expected.");
    if (!callback) throw new Error("Callback expected.");

    //(2) build sql
    sql = "SELECT tbl_name FROM sqlite_master WHERE type='index' and name=?";

    //(3) find
    this.selector.findOnep(sql, [qn(schema, index)], function(error, row) {
      if (error) {
        callback(error);
      } else {
        if (!row) {
          callback();
        } else {
          self.findTable(schema, row.tbl_name, function(error, tbl) {
            if (error) callback(error);
            else callback(undefined, new SQLiteIndex(tbl, index));
          });
        }
      }
    });
  };
} //if (SPEC_TYPE > 1)