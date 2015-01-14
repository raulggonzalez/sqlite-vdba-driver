(function() {

//imports
var util = require("util");
var sqlite = require("sqlite3");

//api
var vdba = module.exports;

/**
 * The vdba.sqlite namespace.
 *
 * @namespace vdba.sqlite
 */
Object.defineProperty(vdba, "sqlite", {value: {}, enumerable: true});
Object.defineProperty(vdba.sqlite, "Adapter", {value: Adapter, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteColumn", {value: SQLiteColumn, enumerable: true});
Object.defineProperty(vdba.sqlite, "SQLiteConnection", {value: SQLiteConnection, enumerable: true});
Object.defineProperty(vdba.sqlite, "Converter", {value: Converter, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteDatabase", {value: SQLiteDatabase, enumerable: true});
Object.defineProperty(vdba.sqlite, "DataDefinitionEngine", {value: DataDefinitionEngine, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteDriver", {value: SQLiteDriver, enumerable: true});
Object.defineProperty(vdba.sqlite, "Filter", {value: Filter, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteIndex", {value: SQLiteIndex, enumerable: true});
Object.defineProperty(vdba.sqlite, "InsertEngine", {value: InsertEngine, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteQuery", {value: SQLiteQuery, enumerable: true});
Object.defineProperty(vdba.sqlite, "RemoveEngine", {value: RemoveEngine, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteResult", {value: SQLiteResult, enumerable: true});
Object.defineProperty(vdba.sqlite, "SQLiteSchema", {value: SQLiteSchema, enumerable: true});
Object.defineProperty(vdba.sqlite, "SelectEngine", {value: SelectEngine, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteServer", {value: SQLiteServer, enumerable: true});
Object.defineProperty(vdba.sqlite, "SQLEngine", {value: SQLEngine, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLFilterFormatter", {value: SQLFilterFormatter, enumerable: false});
Object.defineProperty(vdba.sqlite, "SQLiteTable", {value: SQLiteTable, enumerable: true});
Object.defineProperty(vdba.sqlite, "UpdateEngine", {value: UpdateEngine, enumerable: false});



/**
 * @classdesc A result adapter to VDBA.
 * @class vdba.sqlite.Adapter
 * @protected
 */
function Adapter() {

}

Adapter.adapter = new Adapter();

/**
 * Adapts the result to the query.
 *
 * @name adapt
 * @function
 * @memberof vdba.sqlite.Adapter#
 * @protected
 *
 * @param {Object|vdba.Result} object     The object to adapt.
 * @param {vdba.sqlite.SQLiteQuery} query The root query.
 *
 * @returns {Object} The same object for chainning if needed.
 */
Adapter.prototype.adapt = function adapt(object, query) {
  if (object instanceof vdba.Result) return this.adaptResult(object, query);
  else return this.adaptRow(object, query);
};

/**
 * @private
 */
Adapter.prototype.adaptRow = function adaptRow(row, query) {
  var converter = vdba.sqlite.Converter.converter;

  if (row) {
    var tbl = query.source;

    if (tbl.hasAdaptableColumns()) converter.cast(row, tbl.adaptableColumns);
  }

  return row;
};

/**
 * @private
 */
Adapter.prototype.adaptResult = function adaptResult(result, query) {
  if (query.isSimple()) return this.adaptSimple(result, query);
  else return this.adaptMultiTable(result, query);
};

/**
 * @private
 */
Adapter.prototype.adaptSimple = function adaptSimple(result, query) {
  var tbl = query.source, converter = vdba.sqlite.Converter.converter;

  //(1) adapt
  if (tbl.hasAdaptableColumns()) converter.cast(result, tbl.adaptableColumns);

  //(2) return
  return result;
};

/**
 * @private
 */
Adapter.prototype.adaptMultiTable = function adaptMultiTable(result, query) {
  var src, join, tgt, cols, agg, converter = vdba.sqlite.Converter.converter;

  //(1) prepare
  src = query.source;
  join = query.joins[0];
  tgt = join.target;
  cols = {};
  agg = vdba.Aggregator.aggregator;

  //(2) adapt simple columns
  if (src.hasAdaptableColumns()) cols = util._extend(cols, src.adaptableColumns);
  if (tgt.hasAdaptableColumns()) cols = util._extend(cols, tgt.adaptableColumns);
  converter.cast(result, cols);

  //(3) adapt joins
  if (join.mode == "1-1") {
    //determine columns to transform
    if (join.sourceColumn == join.targetColumn) {
      cols = {};
      for (var i = 0, colNames = tgt.columnNames; i < colNames.length; ++i) cols[colNames[i]] = true;
      cols[join.sourceColumn] = false;
    } else {
      cols = tgt.columnNames;
    }

    //transform
    agg.transform(result, cols, tgt.name);
  }

  //(4) return
  return result;
};
/**
 * @classdesc A SQLite table column.
 * @class vdba.sqlite.SQLiteColumn
 * @extends vdba.Column
 * @protected
 *
 * @param {String} name     The column name.
 * @param {String} type     The column type.
 * @param {Object} options  The column options.
 */
function SQLiteColumn(name, type, options) {
  SQLiteColumn.super_.call(this, name, type, options);
}

util.inherits(SQLiteColumn, vdba.Column);
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
/**
 * @classdesc A converter.
 * @class vdba.sqlite.Converter
 */
function Converter() {

}

Converter.converter = new Converter();

/**
 * Casts the specified columns to their types.
 *
 * @name cast
 * @function
 * @memberof vdba.sqlite.Converter#
 *
 * @param {vdba.sqlite.SQLiteResult|Object} object  The object to cast.
 * @param {Object} columns                          The columns to cast.
 *
 * @returns {Object} The same object to cast.
 */
Converter.prototype.cast = function cast(object, columns) {
  //(1) pre: arguments
  if (!object) throw new Error("Object to cast expected.");
  if (!columns) throw new Error("Columns expected.");

  //(2) cast
  if (object instanceof vdba.Result) this.castResult(object, columns);
  else this.castRow(object, columns);

  //(3) return
  return object;
};

/**
 * @private
 */
Converter.prototype.castRow = function castRow(row, columns) {
  for (var i = 0, colNames = Object.keys(columns); i < colNames.length; ++i) {
    var col = columns[colNames[i]];

    if (row.hasOwnProperty(col.name)) {
      var curVal, newVal;

      curVal = row[col.name];

      if (col.type == "boolean") newVal = Boolean(curVal);
      else if (col.type == "date") newVal = new Date(curVal);
      else if (col.type == "datetime") newVal = new Date(curVal);
      else if (col.type == "integer") newVal = parseInt(curVal);
      else if (col.type == "real") newVal = parseFloat(curVal);
      else if (col.type == "set<integer>") newVal = parseIntegerSet(curVal);
      else if (col.type == "set<text>") newVal = parseTextSet(curVal);
      else if (col.type == "text") newVal = String(curVal);
      else if (col.type == "time") newVal = new Date(curVal);
      else newVal = curVal;

      row[col.name] = newVal;
    }
  }

  //helper functions
  function parseIntegerSet(value) {
    return (value === undefined ? undefined : JSON.parse(value));
  }

  function parseTextSet(value) {
    //(1) prepare to cast


    //(2) return
    return (value === undefined ? undefined : JSON.parse(value));
  }
};

/**
 * @private
 */
Converter.prototype.castResult = function castResult(result, columns) {
  for (var i = 0; i < result.length; ++i) {
    this.castRow(result.rows[i], columns);
  }
};
/**
 * @classdesc An engine to perform DDL commands.
 * @class vdba.sqlite.DataDefinitionEngine
 * @extends vdba.sqlite.SQLEngine
 * @private
 *
 * @param {vdba.Connection} cx  The connection to use.
 */
function DataDefinitionEngine(cx) {
  DataDefinitionEngine.super_.call(this, cx);
}

util.inherits(DataDefinitionEngine, SQLEngine);
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

      cols[col.name] = new SQLiteColumn(col.name, type, {required: col.notnull !== 0, id: col.pk !== 0});
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

      if (col.id) sql += " PRIMARY KEY" + (col.type == "sequence" ? " AUTOINCREMENT" : "");
      if (col.unique || col.uq) sql += " UNIQUE";
      if (col.required || col.id) sql += " NOT NULL";
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
/**
 * @classdesc A filter.
 * @class vdba.sqlite.Filter
 * @protected
 */
function Filter(filter) {
  /**
   * The filter object.
   *
   * @name filter
   * @type {Object}
   * @memberof vdba.sqlite.Filter#
   */
  Object.defineProperty(this, "filter", {value: filter});
}

/**
 * Parses and returns a filter.
 *
 * @name parse
 * @function
 * @memberof vdba.sqlite.Filter
 */
Filter.parse = function parse(filter) {
  return new Filter(filter);
};
/**
 * @classdesc A SQLite index.
 * @class vdba.sqlite.SQLiteIndex
 * @extends vdba.Index
 * @protected
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {String} name                   The index name.
 */
function SQLiteIndex(table, name) {
  SQLiteIndex.super_.call(this, table, name);
}

util.inherits(SQLiteIndex, vdba.Index);
/**
 * @classdesc An engine to perform INSERT's.
 * @class vdba.sqlite.InsertEngine
 * @private
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 */
function InsertEngine(cx) {
  InsertEngine.super_.call(this, cx);
}

util.inherits(InsertEngine, SQLEngine);

/**
 * Inserts one or several rows into the table.
 *
 * @name insert
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Object|Object[]} rows          The row(s) to insert.
 * @param {Object} [options]              The insert options: id (Boolean).
 * @param {Function} [callback]           The function to call: fn(error, id).
 */
InsertEngine.prototype.insert = function insert(table, rows, options, callback) {
  //(1) pre: arguments
  if (arguments.length == 3 && arguments[2] instanceof Function) {
    callback = arguments[2];
    options = undefined;
  }

  if (!table) throw new Error("Table expected.");
  if (!rows) throw new Error("Row(s) expected.");
  if (!options) options = {};
  if (options.id && !callback) throw new Error("Callback expected.");

  //(2) insert
  if (rows instanceof Array) this.insertRows(table, rows, options, callback);
  else this.insertRow(table, rows, options, callback);
};

/**
 * @private
 */
InsertEngine.prototype.insertRow = function insertRow(table, row, options, callback) {
  var self = this, sql, cols, vals, params;

  //(1) build sql
  cols = vals = "";
  params = [];

  for (var i = 0, names = Object.keys(row); i < names.length; ++i) {
    var col = table.columns[names[i]];
    var val = row[col.name];

    cols += (i === 0 ? "" : ", ") + col.name;
    vals += (i === 0 ? "" : ", ") + "?";

    if (col.isSet()) {
      if (val === undefined) val = null;
      else if (val) val = JSON.stringify(val);
    }

    params.push(val);
  }

  sql = "INSERT INTO " + table.sqlQN + "(" + cols + ") VALUES(" + vals + ")";

  //(2) insert
  if (!options.id) {
    this.runp(sql, params, callback);
  } else {
    this.runp(sql, params, function(error)  {
      if (error) return callback(error);

      self.findOne("SELECT last_insert_rowid() as id", function(error, row) {
        if (error) callback(error);
        else callback(undefined, row.id);
      });
    });
  }
};

/**
 * @private
 */
InsertEngine.prototype.insertRows = function insertRows(table, rows, options, callback) {
  var self = this, i;

  function insert() {
    if (i < rows.length) {
      self.insertRow(table, rows[i], {}, function(error) {
        if (error) {
          self.rollback(function() {
            if (callback) callback(error);
          });
        } else {
          ++i;
          insert();
        }
      });
    } else {
      self.commit(callback);
    }
  }

  if (rows.length > 0) {
    i = 0;
    this.begin(insert);
  } else {
    if (callback) callback();
  }
};
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
/**
 * @classdesc An engine to perform DELETE's and TRUNCATE's.
 * @class vdba.sqlite.RemoveEngine
 * @private
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 */
function RemoveEngine(cx) {
  RemoveEngine.super_.call(this, cx);
}

util.inherits(RemoveEngine, SQLEngine);

/**
 * Removes zero, one or several rows.
 *
 * @name remove
 * @function
 * @memberof vdba.sqlite.RemoveEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Object} filter                 The filter.
 * @param {Object} [options]              The delete options: If specified, always {}.
 * @param {Function} [callback]           The function to call: fn(error).
 */
RemoveEngine.prototype.remove = function remove(table, filter, options, callback) {
  var sql, expr;

  //(1) pre: arguments
  if (arguments.length == 2 && arguments[1] instanceof Function) {
    callback = arguments[1];
    filter = options = undefined;
  } else if (arguments.length == 3  && arguments[2] instanceof Function) {
    callback = arguments[2];
    options = undefined;
  }

  if (!table) throw new Error("Table expected.");
  if (!filter) filter = {};
  if (!options) options = {};

  //(2) build sql
  expr = this.filterFormatter.format(filter);
  sql = "DELETE FROM " + table.sqlQN + " WHERE " + expr.expression;

  //(3) delete
  this.runp(sql, expr.parameters, callback);
};

/**
 * Deletes all rows from the table.
 *
 * @name truncate
 * @function
 * @memberof vdba.sqlite.RemoveEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Function} [callback]           The function to call: fn(error).
 */
RemoveEngine.prototype.truncate = function truncate(table, callback) {
  //(1) pre: arguments
  if (!table) throw new Error("Table expected.");

  //(2) truncate
  this.run("DELETE FROM " + table.sqlQN, callback);
};
/**
 * @classdesc A SQLite result.
 * @class vdba.sqlite.SQLiteResult
 * @extends vdba.Result
 * @protected
 *
 * @param {Object[]} rows The rows.
 */
function SQLiteResult(rows) {
  SQLiteResult.super_.call(this, rows);
}

util.inherits(SQLiteResult, vdba.Result);
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
/**
 * @classdesc A SQL filter formatter.
 * @class vdba.sqlite.SQLFilterFormatter
 * @protected
 *
 * @param {String} [placeholder]  The placeholder. Default: ?.
 */
function SQLFilterFormatter(placeholder) {
  /**
   * The placeholder.
   *
   * @name placeholder
   * @type {String}
   * @memberof vdba.SQLFilterFormatter#
   */
  Object.defineProperty(this, "placeholder", {value: placeholder, enumerable: true});
}

/**
 * Formats a filter as an SQL expression.
 *
 * @name format
 * @function
 * @memberof vdba.sqlite.SQLFilterFormatter#
 *
 * @param {Object} filter   The filter to format.
 *
 * @returns {Object} An object with two properties: expression and parameters.
 */
SQLFilterFormatter.prototype.format = function format(filter) {
  var sql, params, keys;

  //(1) pre: arguments
  if (!filter) throw new Error("Filter expected.");

  //(2) format
  keys = Object.keys(filter);

  if (keys.length === 0) {
    sql = this.placeholder + " = " + this.placeholder;
    params = [true, true];
  } else {
    sql = "";
    params = [];

    for (var i = 0; i < keys.length; ++i) {
      var col = keys[i];
      sql += (i === 0 ? "" : " and ") + "(" + this.formatItem(col, filter[col], params) + ")";
    }
  }

  //(3) return
  return {expression: sql, parameters: params};
};

/**
 * @private
 */
SQLFilterFormatter.prototype.formatItem = function formatItem(col, val, params) {
  var item;

  //(1) format
  if (typeof(val) != "object") {        //col: value
    item = this.$eq(col, val, params);
  } else {                              //col: {$op: val, $op: val...}
    item = "";

    for (var i = 0, ops = Object.keys(val); i < ops.length; ++i) {
      item += (i === 0 ? "" : " and ") + this.formatOp(ops[i], col, val[ops[i]], params);
    }
  }

  //(2) return
  return item;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.formatOp = function formatOp(op, col, val, params) {
  var res;

  //(1) format
  if (op == "$eq") res = this.$eq(col, val, params);
  else if (op == "$ne") res = this.$ne(col, val, params);
  else if (op == "$lt") res = this.$lt(col, val, params);
  else if (op == "$le") res = this.$le(col, val, params);
  else if (op == "$gt") res = this.$gt(col, val, params);
  else if (op == "$ge") res = this.$ge(col, val, params);
  else if (op == "$like") res = this.$like(col, val, params);
  else if (op == "$notLike") res = this.$notLike(col, val, params);
  else if (op == "$nlike") res = this.$notLike(col, val, params);
  else if (op == "$in") res = this.$in(col, val, params);
  else if (op == "$notIn") res = this.$notIn(col, val, params);
  else if (op == "$nin") res = this.$notIn(col, val, params);
  else if (op == "$contains") res = this.$contains(col, val, params);
  else if (op == "$notContains") res = this.$notContains(col, val, params);
  else if (op == "$ncontains") res = this.$notContains(col, val, params);
  else throw new Error("Unknown operator: " + op + ".");

  //(2) return
  return res;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$eq = function $eq(col, val, params) {
  var res;

  if (val === null || val === undefined) {
    res = col + " is null";
  } else {
    params.push(val);
    res = col + " = " + this.placeholder;
  }

  return res;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$ne = function $ne(col, val, params) {
  var res;

  if (val === null || val === undefined) {
    res = col + " is not null";
  } else {
    params.push(val);
    res = col + " <> " + this.placeholder;
  }

  return res;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$lt = function $lt(col, val, params) {
  params.push(val);
  return col + " < " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$le = function $le(col, val, params) {
  params.push(val);
  return col + " <= " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$gt = function $gt(col, val, params) {
  params.push(val);
  return col + " > " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$ge = function $ge(col, val, params) {
  params.push(val);
  return col + " >= " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$like = function $like(col, val, params) {
  params.push(val);
  return col + " like " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$notLike = function $notLike(col, val, params) {
  params.push(val);
  return col + " not like " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$in = function $in(col, vals, params) {
  var expr;

  //(1) format
  expr = col + " in (";

  for (var i = 0; i < vals.length; ++i) {
    params.push(vals[i]);
    expr += (i === 0 ? "" : ", ") + this.placeholder;
  }

  expr += ")";

  //(2) return
  return expr;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$notIn = function $notIn(col, vals, params) {
  var expr;

  //(1) format
  expr = col + " not in (";

  for (var i = 0; i < vals.length; ++i) {
    params.push(vals[i]);
    expr += (i === 0 ? "" : ", ") + this.placeholder;
  }

  expr += ")";

  //(2) return
  return expr;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$contains = function $contains(col, val, params) {
  var expr;

  //(1) format
  if (typeof(val) == "string") {
    expr = util.format("instr(%s, '%s') > 0", col, JSON.stringify(val));
  } else {
    expr = util.format("instr(%s, '[%d]') > 0 or instr(%s, '[%d,') > 0 or instr(%s, ',%d,') > 0 or instr(%s, ',%d]') > 0", col, val, col, val, col, val, col, val);
  }

  //(2) return
  return expr;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$notContains = function $notContains(col, val, params) {
  var expr;

  //(1) format
  if (typeof(val) == "string") {
    expr = util.format("%s is null or instr(%s, '%s') = 0", col, col, JSON.stringify(val));
  } else {
    expr = util.format("%s is null or (instr(%s, '[%d]') = 0 and instr(%s, '[%d,') = 0 and instr(%s, ',%d,') = 0 and instr(%s, ',%d]') = 0)", col, col, val, col, val, col, val, col, val);
  }

  //(2) return
  return expr;
};
/**
 * @classdesc A SQLite schema.
 * @class vdba.sqlite.SQLiteSchema
 * @extends vdba.Schema
 *
 * @param {vdba.sqlite.SQLiteDatabase} db The database.
 * @param {String} name                   The schema name.
 */
function SQLiteSchema(db, name) {
  SQLiteSchema.super_.call(this, db, name);
}

util.inherits(SQLiteSchema, vdba.Schema);

/**
 * Checks whether the schema is default.
 *
 * @name isDefault
 * @function
 * @member vdba.sqlite.SQLiteSchema#
 *
 * @returns {Boolean}
 */
SQLiteSchema.prototype.isDefault = function isDefault() {
  return (this.name == "default");
};
/**
 * @classdesc An engine to perform SELECT's.
 * @class vdba.sqlite.SelectEngine
 * @private
 *
 * @param {vdba.Connection} cx  The connection to use.
 */
function SelectEngine(cx) {
  SelectEngine.super_.call(this, cx);
}

util.inherits(SelectEngine, SQLEngine);

/**
 * Returns the ORDER BY clause.
 *
 * @name buildOrderBy
 * @function
 * @memberof vdba.sqlite.SQLiteQuery#
 * @private
 *
 * @param {vdba.Query} query  The query.
 *
 * @returns {String}
 */
SelectEngine.prototype.buildOrderBy = function buildOrderBy(query) {
  var sql;

  //(1) build clause
  sql = "ORDER BY ";

  for (var i = 0, cols = Object.keys(query.orderBy); i < cols.length; ++i) {
    var name = cols[i];
    var mode = query.orderBy[name];

    sql += (i === 0 ? "" : ", ") + name + " " + mode;
  }

  //(2) return
  return sql;
};

/**
 * Returns the LIMIT clause.
 *
 * @name buildLimit
 * @function
 * @memberof vdba.sqlite.SQLiteQuery#
 * @private
 *
 * @param {vdba.Query} query  The query.
 *
 * @returns {String}
 */
SelectEngine.prototype.buildLimit = function buildLimit(query) {
  return "LIMIT " + query.limitTo.count + " OFFSET " + query.limitTo.start;
};

/**
 * Returns the number of rows that the table has.
 *
 * @name count
 * @function
 * @memberof vdba.sqlite.SelectEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table to count.
 * @param {Function} callback             The function to call: fn(error, count).
 */
SelectEngine.prototype.count = function count(table, callback) {
  var sql;

  //(1) pre: arguments
  if (!table) throw new Error("Table expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) build sql
  sql = "SELECT count(*) as count FROM " + table.sqlQN;

  //(2) count
  this.findOne(sql, function(error, row) {
    if (error) callback(error);
    else callback(undefined, row.count);
  });
};

/**
 * Runs the query.
 *
 * @name findQuery
 * @function
 * @memberof vdba.sqlite.SQLiteQuery#
 *
 * @param {vdba.Query} query  The query.
 * @param {Function} callback The function to call: fn(error, result).
 */
SelectEngine.prototype.runQuery = function findQuery(query, callback) {
  //(1) pre: arguments
  if (!query) throw new Error("Query expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find
  if (query.isMultiTable()) this.runMultiTableQuery(query, callback);
  else this.runSimpleQuery(query, callback);
};

/**
 * @private
 */
SelectEngine.prototype.runSimpleQuery = function runSimpleQuery(query, callback) {
  if (query.isAggregate()) this.runSimpleAggQuery(query, callback);
  else this.runSimpleNonAggQuery(query, callback);
};

/**
 * @private
 */
SelectEngine.prototype.runSimpleNonAggQuery = function runSimpleNonAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter;

  //(1) build sql
  sql = "SELECT * " + this.buildSimpleFrom(query);

  expr = this.filterFormatter.format(query.filterBy);
  sql += " WHERE " + expr.expression;

  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, expr.parameters, function(error, result) {
    if (error) callback(error);
    else callback(undefined, adapter.adapt(result, query));
  });
};

/**
 * @private
 */
SelectEngine.prototype.runSimpleAggQuery = function runSimpleAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter, params = [];

  //(1) build sql
  sql = this.buildAggSelect(query) + " " + this.buildSimpleFrom(query);

  expr = this.filterFormatter.format(query.filterBy);
  params = params.concat(expr.parameters);
  sql += " WHERE " + expr.expression;

  sql += " " + this.buildGroupBy(query);
  if (query.groupBy.hasFilter()) {
    expr = this.filterFormatter.format(query.groupBy.filter);
    sql += " HAVING " + expr.expression;
    params = params.concat(expr.parameters);
  }

  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, params, function(error, result) {
    if (error) callback(error);
    else callback(undefined, adapter.adapt(result, query));
  });
};

/**
 * @private
 */
SelectEngine.prototype.buildSimpleFrom = function buildSimpleFrom(query) {
  return "FROM " + query.source.sqlQN;
};

/**
 * @private
 */
SelectEngine.prototype.runMultiTableQuery = function runMultiTableQuery(query, callback) {
  var self = this, join;

  join = query.joins[0];

  if (typeof(join.target) == "string") {
    var schema, table, name = join.target, dot = name.indexOf(".");

    if (dot < 0) {
      schema = query.source.schema.name;
      table = name;
    } else {
      schema = name.substr(0, dot);
      table = name.substr(dot+1);
    }

    query.source.database.findTable(schema, table, function(error, tbl) {
      if (error) {
        callback(error);
      } else {
        if (!tbl) {
          callback(new Error("Target table doesn't exist: " + schema + "." + table  + "."));
        } else {
          join.target = tbl;
          self.runMultiTableQuery(query, callback);
        }
      }
    });
  } else {  //if target is a table object, then we can run the SQL command
    if (query.isAggregate()) this.runMultiTableAggQuery(query, callback);
    else this.runMultiTableNonAggQuery(query, callback);
  }
};

/**
 * @private
 */
SelectEngine.prototype.runMultiTableNonAggQuery = function runMultiTableNonAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter;

  //(1) build sql
  sql = "SELECT * " + this.buildMultiTableFrom(query);

  expr = this.filterFormatter.format(query.filterBy);
  sql += " WHERE " + expr.expression;

  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, expr.parameters, function(error, result) {
    if (error) {
      callback(error);
    } else {
      adapter.adapt(result, query);
      callback(undefined, result);
    }
  });
};

/**
 * @private
 */
SelectEngine.prototype.runMultiTableAggQuery = function runMultiTableAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter, params = [];

  //(1) build sql
  sql = this.buildAggSelect(query) + " " + this.buildMultiTableFrom(query);

  expr = this.filterFormatter.format(query.filterBy);
  params = params.concat(expr.parameters);
  sql += " WHERE " + expr.expression;

  sql += " " + this.buildGroupBy(query);
  if (query.groupBy.hasFilter()) {
    expr = this.filterFormatter.format(query.groupBy.filter);
    sql += " HAVING " + expr.expression;
    params = params.concat(expr.parameters);
  }

  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, params, function(error, result) {
    if (error) {
      callback(error);
    } else {
      adapter.adapt(result, query);
      callback(undefined, result);
    }
  });
};

/**
 * @private
 */
SelectEngine.prototype.buildMultiTableFrom = function buildMultiTableFrom(query) {
  var from, src, tgt, srcCol, tgtCol;

  //(1) prepare
  src = query.source;
  srcCol = query.joins[0].sourceColumn;
  tgt = query.joins[0].target;
  tgtCol = query.joins[0].targetColumn;

  //(2) build
  from = util.format(
    "FROM %s INNER JOIN %s ON %s.%s = %s.%s",
    src.sqlQN, tgt.sqlQN,
    src.sqlQN, srcCol,
    tgt.sqlQN, tgtCol
  );

  //(3) return
  return from;
};

/**
 * @private
 */
SelectEngine.prototype.buildAggSelect = function buildAggSelect(query) {
  var sql, i, cols, aggs, col;

  //(1) build
  sql = "SELECT";

  //grouping columns
  for (i = 0, cols = query.groupBy.columns; i < cols.length; ++i) {
    col = cols[i];
    var tbl = query.getTableOf(col);

    sql += (i === 0 ? " " :  ", ") + util.format("%s.%s", tbl.sqlQN, col);
  }

  //aggregation results
  for (i = 0, aggs = query.groupBy.aggregations; i < aggs.length; ++i) {
    var agg = aggs[i];
    col = agg.column;
    var alias = agg.alias;

    if (agg.name == "count") {
      sql += util.format(", count(%s) as %s", col, alias);
    } else if (agg.name == "sum") {
      sql += util.format(", sum(%s) as %s", col, alias);
    } else if (agg.name == "avg") {
      sql += util.format(", avg(%s) as %s", col, alias);
    } else if (agg.name == "min") {
      sql += util.format(", min(%s) as %s", col, alias);
    } else if (agg.name == "max") {
      sql += util.format(", max(%s) as %s", col, alias);
    }
  }

  //(2) return
  return sql;
};

/**
 * @private
 */
SelectEngine.prototype.buildGroupBy = function buildGroupBy(query) {
  var sql;

  //(1) build
  sql = "GROUP BY";

  for (var i = 0, cols = query.groupBy.columns; i < cols.length; ++i) {
    var col = cols[i];
    var tbl = query.getTableOf(col);

    sql += (i === 0 ? " " : ", ") + util.format("%s.%s", tbl.sqlQN, col);
  }

  //(2) return
  return sql;
};
/**
 * @classdesc A SQLite engine.
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
/**
 * @classdesc A SQLite table.
 * @class vdba.sqlite.SQLiteTable
 * @extends vdba.Table
 * @protected
 *
 * @param {vdba.sqlite.SQLiteSchema} schema The schema object.
 * @param {String} name                     The table name.
 * @param {Object} columns                  The columns.
 */
function SQLiteTable(schema, name, columns) {
  SQLiteTable.super_.call(this, schema, name, columns);

  /**
   * The set columns.
   *
   * @name setColumns
   * @type {Object}
   * @memberof vdba.sqlite.SQLiteTable#
   */
  Object.defineProperty(this, "setColumns", {value: {}, enumerable: true});

  /**
   * The columns to adapt: blob, boolean, date, datetime and time.
   * These columns aren't supported by SQLite internally and the SQL engine
   * must cast implicitly.
   *
   * @name adaptableColumns
   * @type {Object}
   * @memberof vdba.sqlite.SQLiteTable#
   * @protected
   */
  Object.defineProperty(this, "adaptableColumns", {value: {}});

  for (var i = 0, names = Object.keys(this.columns); i < names.length; ++i) {
    var col = this.columns[names[i]];

    if (col.isSet()) {
      this.setColumns[col.name] = col;
      this.adaptableColumns[col.name] = col;
    } else if (col.isBlob() || col.isBoolean() || col.isDate() || col.isDateTime() || col.isTime()) {
      this.adaptableColumns[col.name] = col;
    }
  }

  /**
   * SQL qualified name.
   *
   * @name sqlQN
   * @type {String}
   * @memberof vdba.sqlite.SQLiteTable#
   *
   * @protected
   */
  Object.defineProperty(this, "sqlQN", {value: sqlQN(schema.name, name)});
}

util.inherits(SQLiteTable, vdba.Table);

/**
 * The SELECT engine to use.
 *
 * @name selector
 * @type {vdba.sqlite.SelectEngine}
 * @memberof vdba.sqlite.SQLiteTable#
 * @private
 */
SQLiteTable.prototype.__defineGetter__("selector", function() {
  return this.database.connection.selector;
});

/**
 * The inserter to use.
 *
 * @name inserter
 * @type {vdba.sqlite.InsertEngine}
 * @memberof vdba.sqlite.SQLiteTable#
 * @private
 */
SQLiteTable.prototype.__defineGetter__("inserter", function() {
  return this.database.connection.inserter;
});

/**
 * The updater to use.
 *
 * @name updater
 * @type {vdba.sqlite.UpdateEngine}
 * @memberof vdba.sqlite.SQLiteTable#
 * @private
 */
SQLiteTable.prototype.__defineGetter__("updater", function() {
  return this.database.connection.updater;
});

/**
 * The remover to use.
 *
 * @name remover
 * @type {vdba.sqlite.RemoveEngine}
 * @memberof vdba.sqlite.SQLiteTable#
 * @private
 */
SQLiteTable.prototype.__defineGetter__("remover", function() {
  return this.database.connection.remover;
});

/**
 * The set column names.
 *
 * @name columnNames
 * @type {String[]}
 * @memberof vdba.sqlite.SQLiteTable#
 * @protected
 */
SQLiteTable.prototype.__defineGetter__("setColumnNames", function() {
  return Object.keys(this.setColumns);
});

/**
 * Returns if the table has some column with a collection type.
 *
 * @name hasCollectionColumns()
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 * @protected
 *
 * @returns {Boolean}
 */
SQLiteTable.prototype.hasSetColumns = function hasSetColumns() {
  return (this.setColumnNames.length > 0);
};

/**
 * The adaptable column names.
 *
 * @name adaptableColumnNames
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 * @protected
 */
SQLiteTable.prototype.__defineGetter__("adaptableColumnNames", function() {
  return Object.keys(this.adaptableColumns);
});

/**
 * Checks whether the table has some adaptable column.
 *
 * @name hasAdaptableColumns
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 * @protected
 *
 * @returns {Boolean}
 */
SQLiteTable.prototype.hasAdaptableColumns = function hasAdaptableColumns() {
  return (this.adaptableColumnNames.length > 0);
};

/**
 * Returns a query object.
 *
 * @name query
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 * @protected
 *
 * @returns {vdba.sqlite.SQLiteQuery}
 */
SQLiteTable.prototype.query = function query() {
  return new SQLiteQuery(this);
};

/**
 * Returns the number of rows that the table has.
 *
 * @name count
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 *
 * @param {Function} callback The function to call: fn(error, count).
 */
SQLiteTable.prototype.count = function count(callback) {
  this.selector.count.apply(this.selector, [this].concat(Array.prototype.slice.call(arguments)));
};

/**
 * Inserts one or several rows into the table.
 *
 * @name insert
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 *
 * @param {object|Object[]} rows  The row(s) to insert.
 * @param {Object} [options]      The insert options: id (Boolean).
 * @param {Function} [callback]   The function to call: fn(error, id).
 */
SQLiteTable.prototype.insert = function insert(rows, options, callback) {
  this.inserter.insert.apply(this.inserter, [this].concat(Array.prototype.slice.call(arguments)));
};

/**
 * Updates zero, one or several rows.
 *
 * @name update
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 *
 * @param {Object} [filter]     The filter.
 * @param {Object} columns      The columns to update.
 * @param {Object} [options]    The update options. If specified, always {}.
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLiteTable.prototype.update = function update(filter, columns, options, callback) {
  this.updater.update.apply(this.updater, [this].concat(Array.prototype.slice.call(arguments)));
};

/**
 * Removes zero, one or several rows.
 *
 * @name remove
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 *
 * @param {Object} filter       The filter.
 * @param {Object} [options]    The delete options: If specified, always {}.
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLiteTable.prototype.remove = function remove(filter, options, callback) {
  this.remover.remove.apply(this.remover, [this].concat(Array.prototype.slice.call(arguments)));
};

/**
 * Deletes all rows from the table.
 *
 * @name truncate
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 *
 * @param {Function} [callback] The function to call: fn(error).
 */
SQLiteTable.prototype.truncate = function truncate(callback) {
  this.remover.truncate.apply(this.remover, [this].concat(Array.prototype.slice.call(arguments)));
};
/**
 * @classdesc An engine to perform UPDATE's.
 * @class vdba.sqlite.UpdateEngine
 * @private
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 */
function UpdateEngine(cx) {
  UpdateEngine.super_.call(this, cx);
}

util.inherits(UpdateEngine, SQLEngine);

/**
 * Updates zero, one or several rows.
 *
 * @name update
 * @function
 * @memberof vdba.sqlite.UpdateEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Object} [filter]               The filter.
 * @param {Object} columns                The columns to update.
 * @param {Object} [options]              The update options.
 * @param {Function} [callback]           The function to call: fn(error).
 */
UpdateEngine.prototype.update = function update(table, filter, columns, options, callback) {
  var sql, expr, params;

  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      filter = columns = options = undefined;
    } else {
      columns = arguments[1];
      filter = options = callback = undefined;
    }
  } else if (arguments.length == 3 && arguments[2] instanceof Function) {
    callback = arguments[2];
    columns = arguments[1];
    filter = options = undefined;
  } else if (arguments.length == 4 && arguments[3] instanceof Function) {
    callback = arguments[3];
    options = undefined;
  }

  if (!table) throw new Error("Table expected.");
  if (!filter) filter = {};
  if (!columns) throw new Error("Column(s) to update expected.");
  if (!options) options = {};

  //(2) build sql
  sql = "UPDATE " + table.sqlQN + " SET ";
  params = [];

  for (var i = 0, names = Object.keys(columns); i < names.length; ++i) {
    var col = names[i];
    sql += (i === 0 ? "" : ", ") + buildColumnUpdate(table.columns[col], columns[col], params);
  }

  expr = this.filterFormatter.format(filter);
  sql += " WHERE " + expr.expression;

  //(3) update
  this.runp(sql, params.concat(expr.parameters), callback);
};

/**
 * @private
 */
function buildColumnUpdate(col, val, params) {
  var sql;

  if (col.isSetOfIntegers()) {
    sql = buildSetOfIntegersUpdate(col, val, params);
  } else if (col.isSetOfTexts()) {
    sql = buildSetOfTextsUpdate(col, val, params);
  } else if (col.isInteger()) {
    sql = buildIntegerUpdate(col, val, params);
  } else if (col.isReal()) {
    sql = buildRealUpdate(col, val, params);
  } else if (col.isText()) {
    sql = buildTextUpdate(col, val, params);
  } else {
    sql = col.name + " = ?";
    params.push(val);
  }

  return sql;
}

function buildIntegerUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (typeof(val) != "object") {
    op = "$set";
    val = parseInt(val);
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    sql = util.format("%s = ?", col.name);
    params.push(val);
  } else if (op == "$inc" || op == "$add") {
    sql = util.format("%s = %s + ?", col.name, col.name);
    params.push(val);
  } else if (op == "$dec") {
    sql = util.format("%s = %s - ?", col.name, col.name);
    params.push(val);
  } else if (op == "$mul") {
    sql = util.format("%s = cast(%s * ? as integer)", col.name, col.name);
    params.push(val);
  }

  //(3) return
  return sql;
}

function buildRealUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (typeof(val) != "object") {
    op = "$set";
    val = parseFloat(val);
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    sql = util.format("%s = ?", col.name);
    params.push(val);
  } else if (op == "$inc" || op == "$add") {
    sql = util.format("%s = %s + ?", col.name, col.name);
    params.push(val);
  } else if (op == "$dec") {
    sql = util.format("%s = %s - ?", col.name, col.name);
    params.push(val);
  } else if (op == "$mul") {
    sql = util.format("%s = cast(%s * ? as real)", col.name, col.name);
    params.push(val);
  }

  //(3) return
  return sql;
}

function buildTextUpdate(col, val, params) {
 var sql, op;

 //(1) determine op
 if (val === undefined || val === null) {
   op = "$set";
   val = null;
 } else if (typeof(val) != "object") {
   op = "$set";
   val = val.toString();
 } else {
   op = Object.keys(val)[0];
   val = val[op];
 }

 //(2) build sql
 if (op == "$set") {
   sql = util.format("%s = ?", col.name);
   params.push(val);
 } else if (op == "$add") {
   sql = util.format("%s = %s || ?", col.name, col.name);
   params.push(val);
 }

 //(3) return
 return sql;
}

function buildSetOfIntegersUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (val instanceof Array) {
    op = "$set";
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    if (val === undefined || val === null) val = null;
    else if (!(val instanceof Array)) val = [val];

    sql = col.name + " = ?";
    params.push(JSON.stringify(val));
  } else if (op == "$add") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null or %s = '[]' or %s = '[%d]' THEN '[%d]'" +
      " WHEN instr(%s, '[%d,') > 0 or instr(%s, ',%d,') > 0 or instr(%s, ',%d]') > 0 THEN %s" +
      " ELSE substr(%s, 0, length(%s)) || ',%d]' END)",
      col.name,
      col.name, col.name, col.name, val, val,
      col.name, val, col.name, val, col.name, val, col.name,
      col.name, col.name, val
    );
  } else if (op == "$del") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null THEN null" +
      " WHEN %s = '[]' THEN '[]'" +
      " WHEN %s = '[%d]' THEN '[]'" +
      " WHEN instr(%s, '[%d,') > 0 THEN replace(%s, '[%d,', '[')" +
      " WHEN instr(%s, ',%d,') > 0 THEN replace(%s, ',%d,', ',')" +
      " WHEN instr(%s, ',%d]') > 0 THEN replace(%s, ',%d]', ']')" +
      " ELSE %s END)",
      col.name,
      col.name,
      col.name,
      col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name
    );
  }

  //(3) return
  return sql;
}

function buildSetOfTextsUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (val instanceof Array) {
    op = "$set";
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    if (val === undefined || val === null) val = null;
    else if (!(val instanceof Array)) val = [val];

    sql = col.name + " = ?";
    params.push(JSON.stringify(val));
  } else if (op == "$add") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null or %s = '[]' or %s = '[\"%s\"]' THEN '[\"%s\"]'" +
      " WHEN instr(%s, '[\"%s\",') > 0 or instr(%s, ',\"%s\",') > 0 or instr(%s, ',\"%s\"]') > 0 THEN %s" +
      " ELSE substr(%s, 0, length(%s)) || ',\"%s\"]' END)",
      col.name,
      col.name, col.name, col.name, val, val,
      col.name, val, col.name, val, col.name, val, col.name,
      col.name, col.name, val
    );
  } else if (op == "$del") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null THEN null" +
      " WHEN %s = '[]' THEN '[]'" +
      " WHEN %s = '[\"%s\"]' THEN '[]'" +
      " WHEN instr(%s, '[\"%s\",') > 0 THEN replace(%s, '[\"%s\",', '[')" +
      " WHEN instr(%s, ',\"%s\",') > 0 THEN replace(%s, ',\"%s\",', ',')" +
      " WHEN instr(%s, ',\"%s\"]') > 0 THEN replace(%s, ',\"%s\"]', ']')" +
      " ELSE %s END)",
      col.name,
      col.name,
      col.name,
      col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name
    );
  }

  //(3) return
  return sql;
}
/**
 * Returns the SQL qualified name to a schema, table and column.
 *
 * @param {String} schema The schema name.
 * @param {String} table  The table name.
 * @param {String} column The column name.
 *
 * @returns {String}
 */
function sqlQN(schema, table, col) {
  var res;

  //(1) build
  if (schema == "default") {
    if (col) res = "\"" + table + "." + col + "\"";
    else res = table;
  } else {
    res = "\"" + schema + "." + table + (col ? "." + col : "") + "\"";
  }

  //(2) return
  return res.toLowerCase();
}

/**
 * Returns the qualified name to a schema and table.
 *
 * @param {String} schema The schema name.
 * @param {String} table  The table name.
 *
 * @returns {String}
 */
function qn(schema, table) {
  var res;

  //(1) build
  if (schema == "default") res = table;
  else res = schema + "." + table;

  //(2) return
  return res.toLowerCase();
}

})();