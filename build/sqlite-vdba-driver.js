/*! sqlite-vdba-driver - 0.4.0 (2015-01-11) */
/*! vdba-core - 0.11.1 (2015-01-11) */

(function() {

//imports
var util = require("util");

//api
var vdba = module.exports;

/**
 * The vdba package.
 *
 * @namespace vdba
 */
Object.defineProperty(vdba, "util", {
  value: {
    inherits: util.inherits,
    _extend: util._extend
  }
});

Object.defineProperty(vdba, "Aggregator", {value: Aggregator, enumerable: true});
Object.defineProperty(vdba, "Column", {value: Column, enumerable: true});
Object.defineProperty(vdba, "Combinator", {value: Combinator, enumerable: true});
Object.defineProperty(vdba, "Connection", {value: Connection, enumerable: true});
Object.defineProperty(vdba, "Database", {value: Database, enumerable: true});
Object.defineProperty(vdba, "DefinitionCache", {value: DefinitionCache, enumerable: false});
Object.defineProperty(vdba, "Driver", {value: Driver, enumerable: true});
Object.defineProperty(vdba, "Filter", {value: Filter, enumerable: true});
Object.defineProperty(vdba, "Index", {value: Index, enumerable: true});
Object.defineProperty(vdba, "Join", {value: Join, enumerable: true});
Object.defineProperty(vdba, "Mapper", {value: Mapper, enumerable: true});
Object.defineProperty(vdba, "Query", {value: Query, enumerable: true});
Object.defineProperty(vdba, "Result", {value: Result, enumerable: true});
Object.defineProperty(vdba, "Schema", {value: Schema, enumerable: true});
Object.defineProperty(vdba, "Server", {value: Server, enumerable: true});
Object.defineProperty(vdba, "Table", {value: Table, enumerable: true});



/**
 * @classdesc An aggregator.
 * @class vdba.Aggregator
 * @private
 */
function Aggregator() {

}

Aggregator.aggregator = new Aggregator();

/**
 * Transforms a column set into a property.
 *
 * @name transform
 * @function
 * @memberof vdba.Aggregator#
 *
 * @param {Object|vdba.Result} object The object to transform.
 * @param {String[]|Object} columns   The column names to transform into a property.
 * @param {String} property           The property name.
 */
Aggregator.prototype.transform = function transform(object, columns, property) {
  //(1) pre: arguments
  if (!object) throw new Error("Object to transform expected.");
  if (!columns) throw new Error("Column names to transform expected.");
  if (!property) throw new Error("Property name expected.");

  //(2) transform
  if (object instanceof vdba.Result) this.transformResult(object, columns, property);
  else this.transformObject(object, columns, property);
};

/**
 * @private
 */
Aggregator.prototype.transformObject = function transformObject(object, columns, property) {
  var i, colNames, value = {};

  //(1) pre: arguments
  if (columns instanceof Array) {
    colNames = columns;
    columns = {};

    for (i = 0; i < colNames.length; ++i) {
      columns[colNames[i]] = true;
    }
  } else {
    colNames = Object.keys(columns);
  }

  //(2) transform
  for (i = 0; i < colNames.length; ++i) {
    var name = colNames[i];
    var toDel = columns[name];

    if (object.hasOwnProperty(name)) value[name] = object[name];
    if (toDel) delete object[name];
  }

  //(3) create the new property
  if (Object.keys(value).length === 0) value = undefined;
  object[property] = value;
};

/**
 * @private
 */
Aggregator.prototype.transformResult = function transformResult(result, columns, property) {
  for (var i = 0; i < result.length; ++i) this.transformObject(result.rows[i], columns, property);
};

/**
 * @classdesc A table column.
 * @class vdba.Column
 * @abstract
 * @protected
 *
 * @param {String} name       The column name.
 * @param {String} type       The column type.
 * @param {Object} [options]  The column options.
 */
function Column(name, type, options) {
  //(1) pre: arguments
  if (!name) throw new Error("Column name expected.");
  if (!type) throw new Error("Column type expected.");
  if (!options) options = {};

  //(2) initialize
  /**
   * The column name.
   *
   * @name name
   * @type {String}
   * @memberof vdba.Column#
   */
  Object.defineProperty(this, "name", {value: name, enumerable: true});

  /**
   * The column type.
   *
   * @name type
   * @type {String}
   * @memberof vdba.Column#
   */
  Object.defineProperty(this, "type", {value: type, enumerable: true});

  /**
   * The column options.
   *
   * @name options
   * @type {Object}
   * @memberof vdba.Column#
   */
  Object.defineProperty(this, "options", {value: options, enumerable: true});
}

/**
 * Indicates if the column is nullable.
 *
 * @name nullable
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("nullable", function() {
  return !!this.options.nullable;
});

/**
 * Indicates if the column is primary key.
 *
 * @name primaryKey
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("primaryKey", function() {
  return !!this.options.primaryKey;
});

/**
 * Alias of primaryKey.
 *
 * @name pk
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("pk", function() {
  return this.primaryKey;
});

/**
 * Checks whether the column stores a set.
 *
 * @name isSet
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isSet = function isSet() {
  return /^set<.+>$/.test(this.type);
};

/**
 * Checks whether the column stores a set of integers.
 *
 * @name isSetOfIntegers
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isSetOfIntegers = function isSetOfIntegers() {
  return (this.type == "set<integer>");
};

/**
 * Checks whether the column stores a set of texts.
 *
 * @name isSetOfTexts
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isSetOfTexts = function isSetOfTexts() {
  return (this.type == "set<text>");
};

/**
 * Checks whether the column stores a BLOB.
 *
 * @name isBlob
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isBlob = function isBlob() {
  return this.type == "blob";
};

/**
 * Checks whether the column stores a boolean.
 *
 * @name isBoolean
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isBoolean = function isBoolean() {
  return this.type == "boolean";
};

/**
 * Checks wheteher the column stores a date.
 *
 * @name isDate
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isDate = function isDate() {
  return this.type == "date";
};

/**
 * Checks whether the column stores a time.
 *
 * @name isTime
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isTime = function isTime() {
  return this.type == "time";
};

/**
 * Checks whether the column stores a date-time.
 *
 * @name isDateTime
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isDateTime = function isDateTime() {
  return this.type == "datetime";
};

/**
 * @classdesc A combinator.
 * @class vdba.Combinator
 * @private
 */
function Combinator() {

}

/**
 * Joins two row sets.
 *
 * @memberof vdba.Combinator#
 *
 * @param {Object[]} source   The source-side rows.
 * @param {Object[]} target   The target-side rows.
 * @param {String} sourceCol  The source-side column name.
 * @param {String} targetCol  The target-side column name.
 * @param {Object} opts       The join opts: arrayAgg (String), the target rows
 *                            into an source array.
 *
 * @param {Object[]}
 */
Combinator.prototype.join = function join(source, target, sourceCol, targetCol, opts) {
  var res = [], arrayAgg, util = vdba.util;

  //(1) pre: arguments
  arrayAgg = opts.arrayAgg;

  //(2) join
  for (var i = 0; i < source.length; ++i) {
    var srcRow = util._extend({}, source[i]);
    var arrAgg = srcRow[arrayAgg] = [];

    for (var j = 0; j < target.length; ++j) {
      var tgtRow = util._extend(target[j]);

      if (srcRow[sourceCol] == tgtRow[targetCol]) arrAgg.push(tgtRow);
    }

    res.push(srcRow);
  }

  //(3) return
  return res;
};

/**
 * @classdesc A connection.
 * @class vdba.Connection
 * @abstract
 * @protected
 *
 * @param {vdba.Driver} driver  The driver that creates it.
 * @param {Object} config       The configuration.
 */
function Connection(driver, config) {
  /**
   * The driver that creates the connection.
   *
   * @name driver
   * @type {vdba.Driver}
   * @memberof vdba.Connection#
   * @protected
   */
  Object.defineProperty(this, "driver", {value: driver});

  /**
   * The configuration object.
   *
   * @name config
   * @type {Object}
   * @memberof vdba.Connection#
   * @protected
   */
  Object.defineProperty(this, "config", {value: config});
}

/**
 * The open mode: readonly or readwrite.
 *
 * @name mode
 * @type {String}
 * @memberof vdba.Connection#
 */
Connection.prototype.__defineGetter__("mode", function() {
  return this.config.mode;
});

/**
 * Returns a connection metadata ready to open.
 *
 * @name clone
 * @function
 * @memberof vdba.Connection#
 * @abstract
 */
Connection.prototype.clone = function clone() {
  throw new Error("Abstract method.");
};

/**
 * Is it connected?
 *
 * @name connected
 * @type {Boolean}
 * @memberof vdba.Connection#
 * @abstract
 */
Connection.prototype.__defineGetter__("connected", function() {
  throw new Error("Abstract property.");
});

/**
 * The server object as connected.
 *
 * @name server
 * @type {vdba.Server}
 * @memberof vdba.Connection#
 * @abstract
 */
Connection.prototype.__defineGetter__("server", function() {
  throw new Error("Abstract property.");
});

/**
 * The current database.
 *
 * @name database
 * @type {vdba.Database}
 * @memberof vdba.Connection#
 * @abstract
 */
Connection.prototype.__defineGetter__("database", function() {
  throw new Error("Abstract property.");
});

/**
 * Opens the connection.
 *
 * @name open
 * @function
 * @memberof vdba.Connection#
 * @abstract
 *
 * @param {Function} [callback] The function to call: fn(error, db).
 *
 * @example
 * cx.open(function(error, db) { ... });
 */
Connection.prototype.open = function open() {
  throw new Error("Abstract method.");
};

/**
 * Closes the connection.
 *
 * @name close
 * @function
 * @memberof vdba.Connection#
 * @abstract
 *
 * @param {Function} [callback] The function to call: fn(error).
 *
 * @example
 * cx.close();
 * cx.close(function(error) { ... });
 */
Connection.prototype.close = function close() {
  throw new Error("Abstract method.");
};

/**
 * Runs a function into a transaction.
 *
 * @name runTransaction
 * @function
 * @memberof vdba.Connection#
 * @abstract
 *
 * @param {String} mode         The transaction mode: readonly or readwrite.
 * @param {Function} op         The operation to run into a transaction.
 * @param {Function} [callback] The function to call: fn(error).
 *
 * @example
 * cx.runTransaction("readonly", function(db) { ... });
 * cx.runTransaction("readonly", function(db) { ... }, function(error) { ... });
 */
Connection.prototype.runTransaction = function runTransaction() {
  throw new Error("Abstract method.");
};

/**
 * @classdesc A database.
 * @class vdba.Database
 * @abstract
 * @protected
 *
 * @param {Connection} cx The connection to the creates it.
 * @param {String} name   The database name.
 */
function Database(cx, name) {
  //(1) pre: arguments
  if (!name)  throw new Error("Database name expected.");

  //(2) initialize
  /**
   * The connection to use.
   *
   * @name connection
   * @type {vdba.sqlite.SQLiteConnection}
   * @memberof vdba.sqlite.SQLiteDatabase#
   */
  Object.defineProperty(this, "connection", {value: cx});

  /**
   * The database name.
   *
   * @name name
   * @type {String}
   * @memberof vdba.Database#
   */
  Object.defineProperty(this, "name", {value: name.toLowerCase(), enumerable: true});

  /**
   * The table definition cache.
   *
   * @name definitionCache
   * @type {vdba.DefinitionCache}
   * @memberof vdba.Database#
   * @protected
   */
  Object.defineProperty(this, "definitionCache", {value: new vdba.DefinitionCache()});
}

/**
 * Checks whether a schema exists.
 *
 * @name hasSchema
 * @function
 * @memberof vdba.Database#
 *
 * @param {String} name       The schema name.
 * @param {Function} callback The function to call: fn(error, exists).
 */
Database.prototype.hasSchema = function hasSchema(name, callback) {
  //(1) pre: arguments
  if (!name) throw new Error("Schema name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) check
  this.findSchema(name, function(error, sch) {
    if (error) callback(error);
    else callback(undefined, !!sch);
  });
};

/**
 * Finds a schema.
 *
 * @name findSchema
 * @function
 * @memberof vdba.Database#
 *
 * @param {String} name       The schema name.
 * @param {Function} callback The function to call: fn(error, schema).
 */
Database.prototype.findSchema = function findSchema(name, callback) {
  var self = this, sch;

  //(1) pre: arguments
  if (!name) throw new Error("Schema name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find
  sch = this.definitionCache.getSchema(name);

  if (sch) {
    callback(undefined, sch);
  } else {
    this.readSchema(name, function(error, sch) {
      if (error) {
        callback(error);
      } else {
        if (sch) self.definitionCache.addSchema(sch);
        callback(undefined, sch);
      }
    });
  }
};

/**
 * Reads a schema.
 * This method is called by the driver internally for getting the schema info.
 *
 * @name readSchema
 * @function
 * @memberof vdba.Database#
 * @protected
 * @abstract
 *
 * @param {String} name       The schema name.
 * @param {Function} callback The function to call: fn(error, schema).
 */
Database.prototype.readSchema = function readSchema() {
  throw new Error("Abstract method.");
};

if (SPEC_TYPE > 1) {
  /**
   * Creates a schema.
   *
   * @name createSchema
   * @function
   * @memberof vdba.Database#
   * @abstract
   *
   * @param {String} name         The schema name.
   * @param {Object} [options]    The create options.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Database.prototype.createSchema = function createSchema() {
    throw new Error("Abstract method.");
  };

  /**
   * Drops a schema.
   *
   * @name dropSchema
   * @function
   * @memberof vdba.Database#
   * @abstract
   *
   * @param {String} name         The schema names.
   * @param {Object} [options]    The drop options.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Database.prototype.dropSchema = function dropSchema() {
    throw new Error("Abstract method.");
  };
}

/**
 * Checks whether a table exists.
 *
 * @name hasTable
 * @function
 * @memberof vdba.Database#
 *
 * @param {String} schema     The schema name.
 * @param {String} table      The table name.
 * @param {Object} [columns]  The table schema (columns).
 * @param {Function} callback The function to call: fn(exists).
 */
Database.prototype.hasTable = function hasTable(schema, table, columns, callback) {
  //(1) pre: arguments
  if (arguments.length == 3 && arguments[2] instanceof Function) {
    callback = arguments[2];
    columns = undefined;
  }

  if (!schema) throw new Error("Schema name expected.");
  if (!table) throw new Error("Table name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find
  this.findTable(schema, table, function(error, tbl) {
    if (error) {
      callback(error);
    } else {
      if (tbl) callback(undefined, (columns ? tbl.checkSchema(columns) : true));
      else callback(undefined, false);
    }
  });
};

/**
 * Checks whether severall tables exist.
 *
 * @name hasTables
 * @function
 * @memberof vdba.Database#
 *
 * @param {String} schema     The schema name.
 * @param {String[]} tables   The table names.
 * @param {Function} callback The function to call: fn(error, exist).
 */
Database.prototype.hasTables = function hasTables(schema, tables, callback) {
  var self = this, i;

  //(1) pre: arguments
  if (!schema) throw new Error("Schema name expected.");
  if (!tables || (tables instanceof Array && tables.length === 0)) throw new Error("Table names expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) check
  i = 0;
  check();

  //helper functions
  function check() {
    if (i < tables.length) {
      self.hasTable(schema, tables[i], function(error, exists) {
        if (error) {
          callback(error);
        } else {
          if (exists) {
            ++i;
            check();
          } else {
            callback(undefined, false);
          }
        }
      });
    } else {
      callback(undefined, true);
    }
  }
};

/**
 * Returns a table.
 *
 * @name findTable
 * @function
 * @memberof vdba.Database#
 *
 * @param {String} schema     The schema name.
 * @param {String} table      The table name.
 * @param {Function} callback The function to call: fn(error, table).
 */
Database.prototype.findTable = function findTable(schema, table, callback) {
  var self = this, tbl;

  //(1) pre: arguments
  if (!schema) throw new Error("Schema name expected.");
  if (!table) throw new Error("Table name expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find
  tbl = this.definitionCache.getTable(schema, table);

  if (tbl) {
    callback(undefined, tbl);
  } else {
    this.readTable(schema, table, function(error, tbl) {
      if (error) {
        callback(error);
      } else {
        if (tbl) self.definitionCache.addTable(tbl);
        callback(undefined, tbl);
      }
    });
  }
};

/**
 * Reads the table info.
 * The user must use the findTable() method; the readTable() method is used
 * by the driver internally.
 *
 * @name readTable
 * @function
 * @memberof vdba.Database#
 * @abstract
 * @protected
 *
 * @param {String} schema     The schema name.
 * @param {String} table      The table name.
 * @param {Function} callback The function to call: fn(error, table).
 */
Database.prototype.readTable = function readTable() {
  throw new Error("Abstract method.");
};

if (SPEC_TYPE > 1) {
  /**
   * Creates a new table.
   *
   * @name createTable
   * @function
   * @memberof vdba.Database#
   * @abstract
   *
   * @param {String} schema       The schema name.
   * @param {String} table        The table name.
   * @param {Object} [columns]    The columns.
   * @param {Object} [options]    The creation options.
   * @param {Function} [callback] The function to call: fn(error, table).
   */
  Database.prototype.createTable = function createTable() {
    throw new Error("Abstract method.");
  };

  /**
   * Drops a table.
   *
   * @name dropTable
   * @function
   * @memberof vdba.Database#
   * @abstract
   *
   * @param {String} schema       The schema name.
   * @param {String} table        The table name.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Database.prototype.dropTable = function dropTable() {
    throw new Error("Abstract method.");
  };

  /**
   * Finds an index.
   *
   * @name findIndex
   * @function
   * @memberof vdba.Database#
   * @abstract
   *
   * @param {String} schema     The schema name.
   * @param {String} index      The index name.
   * @param {Function} callback The function to call: fn(error, index).
   */
  Database.prototype.findIndex = function findIndex() {
    throw new Error("Abstract method.");
  };

  /**
   * Checks whether an index exists.
   *
   * @name hasIndex
   * @function
   * @memberof vdba.Database#
   *
   * @param {String} schema     The schema name.
   * @param {String} index      The index name.
   * @param {Function} callback The function to call: fn(error, exists).
   */
  Database.prototype.hasIndex = function hasIndex(schema, index, callback) {
    //(1) pre: arguments
    if (!schema) throw new Error("Schema expected.");
    if (!index) throw new Error("Index name expected.");
    if (!callback) throw new Error("Callback expected.");

    //(2) find index
    this.findIndex(schema, index, function(error, ix) {
      if (error) callback(error);
      else callback(undefined, !!ix);
    });
  };

  /**
   * Creates an index on a table.
   *
   * @name createIndex
   * @function
   * @memberof vdba.Database#
   * @abstract
   *
   * @param {String} schema         The schema name.
   * @param {String} table          The table name.
   * @param {String} index          The index name.
   * @param {String|String[]} cols  The indexing columns.
   * @param {Object} [options]      The index options.
   * @param {Function} [callback]   The function to call: fn(error).
   */
  Database.prototype.createIndex = function createIndex() {
    throw new Error("Abstract method.");
  };

  /**
   * Drops an index.
   *
   * @name dropIndex
   * @function
   * @memberof vdba.Database#
   * @abstract
   *
   * @param {String} schema       The schema name.
   * @param {String} index        The index name.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Database.prototype.dropIndex = function dropIndex() {
    throw new Error("Abstract method.");
  };
}

/**
 * @classdesc A table cache.
 * @class vdba.DefinitionCache
 * @protected
 */
function DefinitionCache() {
  /**
   * The schemas.
   * Each schema is indexed by its name.
   *
   * @name schemas
   * @type {Object}
   * @memberof vdba.DefinitionCache#
   * @private
   */
  Object.defineProperty(this, "schemas", {value: {}, configurable: true});
}

DefinitionCache.SchemaItem = function SchemaItem(schema) {
  Object.defineProperty(this, "schema", {value: schema});
  Object.defineProperty(this, "tables", {value: {}});
};

/**
 * Checks whether a schema is cached.
 *
 * @name hasSchema
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {String} schema The schema name.
 * @returns {Boolean}
 */
DefinitionCache.prototype.hasSchema = function hasSchema(schema) {
  return !!this.schemas[schema];
};

/**
 * Returns a schema.
 *
 * @name getSchema
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {String} schema The schema name.
 *
 * @returns {vdba.Schema} The schema or undefined if the schema is not cached.
 */
DefinitionCache.prototype.getSchema = function getSchema(schema) {
  var item;

  //(1) get
  item = this.schemas[schema];
  if (item) item = item.schema;

  //(2) return
  return item;
};

/**
 * Adds a schema to the cache.
 *
 * @name addSchema
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {vdba.Schema} schema  The schema.
 * @returns {DefinitionCache.SchemaItem}
 */
DefinitionCache.prototype.addSchema = function addSchema(schema) {
  this.removeSchema(schema.name);
  return (this.schemas[schema.name] = new DefinitionCache.SchemaItem(schema));
};

/**
 * Removes a schema from the cache.
 *
 * @name removeSchema
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {String} schema The schema name.
 */
DefinitionCache.prototype.removeSchema = function removeSchema(schema) {
  delete this.schemas[schema];
};

/**
 * Checks whether a table is cached.
 *
 * @name hasTable
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {String} schema The schema name.
 * @param {String} table  The table name.
 *
 * @returns {Boolean}
 */
DefinitionCache.prototype.hasTable = function hasTable(schema, table) {
  var item;

  //(1) get schema
  item = this.schemas[schema];

  //(2) check
  return (item ? !!item.tables[table] : false);
};

/**
 * Returns a table.
 *
 * @name getTable
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {String} schema The schema name.
 * @param {String} table  The table name.
 *
 * @returns {vdba.Table} The table or undefined if the table is not cached.
 */
DefinitionCache.prototype.getTable = function getTable(schema, table) {
  var item;

  //(1) get table
  item = this.schemas[schema];
  if (item) item = item.tables[table];

  //(2) return
  return item;
};

/**
 * Adds a table to the cache.
 *
 * @name addTable
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {vdba.Table} table  The table.
 */
DefinitionCache.prototype.addTable = function addTable(table) {
  var schema;

  //(1) get schema
  schema = this.schemas[table.schema.name];
  if (!schema) schema = this.addSchema(table.schema);

  //(2) add
  schema.tables[table.name] = table;
};

/**
 * Removes a table of the cache.
 *
 * @name remove
 * @function
 * @memberof vdba.DefinitionCache#
 *
 * @param {String} schema The schema name.
 * @param {String} table  The table name.
 */
DefinitionCache.prototype.removeTable = function removeTable(schema, table) {
  var item;

  //(1) get schema
  item = this.schemas[schema];

  //(2) delete
  if (item) delete item.tables[table];
};

/**
 * @classdesc A VDBA driver.
 * @class vdba.Driver
 * @abstract
 * @protected
 *
 * @param {String} name               The driver name.
 * @param {String|String[]} [aliases] The driver aliases.
 */
function Driver(name, aliases) {
  //(1) pre: arguments
  if (typeof(aliases) == "string") aliases = [aliases];
  else if (!aliases) aliases = [];

  //(2) initialize instance
  /**
   * The driver name.
   *
   * @name name
   * @type {String}
   * @memberof vdba.Driver#
   */
  Object.defineProperty(this, "name", {value: name, enumerable: true});

  /**
   * The driver aliases.
   *
   * @name aliases
   * @type {String[]}
   * @memberof vdba.Driver#
   */
  Object.defineProperty(this, "aliases", {value: aliases, enumerable: true});
}

/**
 * The driver cache.
 *
 * @name cache
 * @type {Object}
 * @memberof vdba.Driver
 * @private
 */
Object.defineProperty(Driver, "cache", {value: {}});

/**
 * Returns a specified driver.
 *
 * @memberof vdba.Driver
 *
 * @param {String} name       The driver name: IndexedDB, C*, Cassandra, PostgreSQL, Redis, etc.
 * @param {Object} [options]  The driver options.
 *
 * @returns A driver or undefined if the name is invalid.
 */
Driver.getDriver = function getDriver(name, options) {
  var cache = vdba.Driver.cache;

  //(1) pre: arguments
  if (!name) throw new Error("Driver name expected.");

  //(2) return driver
  return cache[name.toLowerCase()];
};

/**
 * Registers a driver.
 * This method is used by the drivers to register in the VDBA API.
 *
 * @name register
 * @function
 * @memberof vdba.Driver
 *
 * @param {vdba.Driver} driver  The driver.
 */
Driver.register = function register(driver) {
  var cache = vdba.Driver.cache;

  //(1) pre: arguments
  if (!driver) throw new Error("Driver expected.");

  //(2) register
  cache[driver.name.toLowerCase()] = driver;

  for (var i = 0, aliases = driver.aliases; i < aliases.length; ++i) {
    cache[aliases[i].toLowerCase()] = driver;
  }
};

/**
 * Creates a connection object
 *
 * @name createConnection
 * @function
 * @memberof vdba.Driver#
 * @abstract
 *
 * @param {Object} config The connection configuration.
 * @returns {vdba.Connection}
 */
Driver.prototype.createConnection = function createConnection() {
  throw new Error("Abstract method.");
};

/**
 * Creates and opens a connection.
 *
 * @name openConnection
 * @function
 * @memberof vdba.Driver#
 *
 * @param {Object} config     The configuration object.
 * @param {Function} callback The function to call: fn(error, cx).
 */
Driver.prototype.openConnection = function openConnection(config, callback) {
  var cx;

  //(1) arguments
  if (!config) throw new Error("Configuration expected.");
  if (!callback) throw new Error("Callback expected.");

  //(1) create connection
  cx = this.createConnection(config);

  //(2) open connection
  cx.open(function(error) {
    if (error) callback(error);
    else callback(undefined, cx);
  });
};

/**
 * @classdesc A result filter.
 * @class vdba.Filter
 * @protected
 */
function Filter() {

}

Filter.filter = new Filter();

/**
 * Filters rows of a result.
 *
 * @name filter
 * @function
 * @memberof vdba.Filter#
 *
 * @param {Object[]} rows The result set.
 * @param {Object} filtr  The filter.
 *
 * @returns {Object[]} The same array for chainning if needed.
 */
Filter.prototype.filter = function filter(rows, filtr) {
  //(1) arguments
  if (!filtr) filtr = {};

  //(2) filter
  for (var i = 0; i < rows.length; ++i) {
    if (!this.check(rows[i], filtr)) {
      rows.pop(i);
      --i;
    }
  }

  //(3) retun result
  return rows;
};

/**
 * Checks whether a row satifies the filter.
 *
 * @name check
 * @function
 * @memberof vdba.Filter#
 *
 * @param {Object} row    The row to check.
 * @param {Object} filter The filter.
 *
 * @returns {Boolean}
 */
Filter.prototype.check = function check(row, filter) {
  var res = false, keys = Object.keys(filter);

  //(1) check
  if (keys.length === 0) {             //{}
    res = true;
  } else if (keys.length == 1) {      //{prop: ...}
    res = this.checkProp(row, keys[0], filter);
  } else {                            //{prop1: ..., prop2: ...}
    res = true;

    for (var i = 0, props = keys; i < props.length; ++i) {
      var prop = props[i];

      if (!this.checkProp(row, prop, filter)) {
        res = false;
        break;
      }
    }
  }

  //(2) return result
  return res;
};

/**
 * Checks whether a property satisfies its filter.
 *
 * @name checkProp
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} filter The filter.
 *
 * @returns {Boolean}
 */
Filter.prototype.checkProp = function checkProp(row, prop, filter) {
  var res;

  //(1) get property filter
  filter = filter[prop];

  //(2) check
  if (typeof(filter) != "object") {     //{prop: value}
    res = this.$eq(row, prop, filter);
  } else {                              //{prop: {...}}
    var ops = Object.keys(filter);

    if (ops.length === 0) {              //{prop: {}}
      res = true;
    } else if (ops.length == 1) {       //{prop: {op: value}
      res = this.checkOp(row, prop, ops[0], filter);
    } else {                           //{prop: {op1: value, opt2: value}}
      res = true;

      for (var i = 0; i < ops.length; ++i) {
        if (!this.checkOp(row, prop, ops[i], filter)) {
          res = false;
          break;
        }
      }
    }
  }

  //(3) return result
  return res;
};

/**
 * Checks a property with an operator.
 *
 * @name checkOp
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {String} op     The operator.
 * @param {Object} filter The filter.
 *
 * @returns {Boolean}
 */
Filter.prototype.checkOp = function checkOp(row, prop, op, filter) {
  var res;

  //(1) check
  if (op == "$eq") res = this.$eq(row, prop, filter.$eq);
  else if (op == "$ne") res = this.$ne(row, prop, filter.$ne);
  else if (op == "$lt") res = this.$lt(row, prop, filter.$lt);
  else if (op == "$le") res = this.$le(row, prop, filter.$le);
  else if (op == "$gt") res = this.$gt(row, prop, filter.$gt);
  else if (op == "$ge") res = this.$ge(row, prop, filter.$ge);
  else if (op == "$like") res = this.$like(row, prop, filter.$like);
  else if (op == "$notLike") res = this.$notLike(row, prop, filter.$notLike);
  else if (op == "$nlike") res = this.$notLike(row, prop, filter.$nlike);
  else if (op == "$in") res = this.$in(row, prop, filter.$in);
  else if (op == "$notIn") res = this.$notIn(row, prop, filter.$notIn);
  else if (op == "$nin") res = this.$notIn(row, prop, filter.$nin);
  else if (op == "$contains") res = this.$contains(row, prop, filter.$contains);
  else if (op == "$notContains") res = this.$notContains(row, prop, filter.$notContains);
  else if (op == "$ncontains") res = this.$notContains(row, prop, filter.$ncontains);
  else throw new Error("Unknown operator: '" + op + "'.");

  //(2) return check
  return res;
};

/**
 * Checks the operator $eq.
 *
 * @name $eq
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property name to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$eq = function $eq(row, prop, value) {
  if (value === undefined) return (row[prop] === undefined);
  else if (value === null) return (row[prop] === null);
  else return (row[prop] == value);
};

/**
 * Checks the operator $ne.
 *
 * @name $ne
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$ne = function $ne(row, prop, value) {
  if (value === undefined) return (row[prop] !== undefined);
  else if (value === null) return (row[prop] !== null);
  else return (row[prop] != value);
};

/**
 * Checks the operator $lt.
 *
 * @name $lt
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$lt = function $lt(row, prop, value) {
  if (value === undefined || value === null) return false;
  else return (row[prop] < value);
};

/***
 * Checks the operator $le.
 *
 * @name $le
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$le = function $le(row, prop, value) {
  if (value === undefined || value === null) return false;
  else return (row[prop] <= value);
};

/**
 * Checks the operator $gt.
 *
 * @name $gt
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$gt = function $gt(row, prop, value) {
  if (value === undefined || value === null) return false;
  else return (row[prop] > value);
};

/**
 * Checks the operator $ge.
 *
 * @name $ge
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$ge = function $ge(row, prop, value) {
  if (value === undefined || value === null) return false;
  else return (row[prop] >= value);
};

/**
 * Checks the operator $like.
 *
 * @name $like
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The pattern to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$like = function $like(row, prop, value) {
  if (value === undefined || value === null) return this.$eq(row, prop, value);
  else return new RegExp(value).test(row[prop]);
};

/**
 * Checks the operator $notLike.
 *
 * @name $notLike
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The pattern to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$notLike = function $notLike(row, prop, value) {
  if (value === undefined || value === null) return this.$ne(row, prop, value);
  else return !this.$like(row, prop, value);
};

/**
 * Checks the operator $in.
 *
 * @name $in
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The values to check.
 *
 * @retuns {Boolean}
 */
Filter.prototype.$in = function $in(row, prop, value) {
  if (value === undefined || value === null) return false;
  else return (value.indexOf(row[prop]) >= 0);
};

/**
 * Checks the operator $notIn.
 *
 * @name $notIn
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$notIn = function $notIn(row, prop, value) {
  return !this.$in(row, prop, value);
};

/**
 * Checks the operator $contains.
 *
 * @name $contains
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$contains = function $contains(row, prop, value) {
  var res, arr;

  //(1) check
  arr = row[prop];

  if (arr instanceof Array) res = (arr.indexOf(value) > 0);
  else if (typeof(arr) == "string") res = (arr.indexOf(value) > 0);
  else res = false;

  //(2) return
  return res;
};

/**
 * Checks the operator $notContains.
 *
 * @name $notContains
 * @function
 * @memberof vdba.Filter#
 * @private
 *
 * @param {Object} row    The row to check.
 * @param {String} prop   The property to check.
 * @param {Object} value  The value to check.
 *
 * @returns {Boolean}
 */
Filter.prototype.$notContains = function $notContains(row, prop, value) {
  return !this.$contains(row, prop, value);
};

/**
 * @classdesc An index.
 * @class vdba.Index
 * @abstract
 * @protected
 *
 * @param
 */
function Index(table, name) {
  /**
   * The table.
   *
   * @name table
   * @type {vdba.Table}
   * @memberof vdba.Index#
   */
  Object.defineProperty(this, "table", {value: table, enumerable: true});

  /**
   * The index name.
   *
   * @name name
   * @type {String}
   * @memberof vdba.Index#
   */
   Object.defineProperty(this, "name", {value: name, enumerable: true});
}

/**
 * The database.
 *
 * @name table
 * @type {vdba.Database}
 * @memberof vdba.Index#
 */
Index.prototype.__defineGetter__("database", function() {
  return this.table.database;
});

/**
 * Is it unique?
 *
 * @name unique
 * @type {Boolean}
 * @memberof vdba.indexeddb.IndexedDBIndex#
 * @abstract
 */
Index.prototype.__defineGetter__("unique", function() {
  throw new Error("Abstract property.");
});

/**
 * @classdesc A join.
 * @class vdba.Join
 * @protected
 *
 * @param {String} type       The join type: inner or left.
 * @param {String} mode       The join mode: 1-1 or 1-*.
 * @param {vdba.Table} target The target table.
 * @param {String} col1       The source column.
 * @param {String} col2       The target column.
 */
function Join(type, mode, target, col1, col2) {
  //(1) pre: arguments
  if (!type) throw new Error("Join type expected.");
  if (!mode) throw new Error("Join mode expected.");
  if (!target)  throw new Error("Target table expected.");
  if (!col1) throw new Error("Source column name expected.");
  if (!col2) throw new Error("Target column name expected.");

  //(2) initialize
  /**
   * The join type: inner or left.
   *
   * @name type
   * @type {String}
   * @memberof vdba.Join#
   */
  Object.defineProperty(this, "type", {value: type.toLowerCase(), enumerable: true});

  /**
   * The join mode: none, 1-1 or 1-*.
   *
   * @name mode
   * @type {String}
   * @memberof vdba.Join#
   */
  Object.defineProperty(this, "mode", {value: mode, enumerable: true});

  /**
   * The target target.
   *
   * @name target
   * @type {String|vdba.Table}
   * @memberof vdba.Join#
   */
  Object.defineProperty(this, "target", {value: target, enumerable: true, writable: true});

  /**
   * The source column.
   *
   * @name sourceColumn
   * @type {String}
   * @memberof vdba.Join#
   */
  Object.defineProperty(this, "sourceColumn", {value: col1, enumerable: true});

  /**
   * The target column.
   *
   * @name targetColumn
   * @type {String}
   * @memberof vdba.Join#
   */
  Object.defineProperty(this, "targetColumn", {value: col2, enumerable: true});
}

/**
 * @classdesc A mapper.
 * @class vdba.Mapper
 * @protected
 */
function Mapper() {

}

Mapper.mapper = new Mapper();

/**
 * Maps the rows as indicated.
 *
 * @name map
 * @function
 * @memberof vdba.Mapper#
 *
 * @param {Object|String[]|Function} map  How to map.
 * @param {Object[]} rows                 The rows or the result to cast.
 *
 * @returns {Object[]} The same array with the rows mapped.
 */
Mapper.prototype.map = function(map, rows) {
  //(1) map
  for (var i = 0; i < rows.length; ++i) {
    rows[i] = this.mapRow(map, rows[i]);
  }

  //(2) return
  return rows;
};

/**
 * Maps a row.
 *
 * @name mapRow
 * @function
 * @memberof vdba.Mapper#
 *
 * @param {Object|String[]|Function} map  How to map.
 * @param {Object} row                    The row to cast.
 *
 * @returns {Object}
 */
Mapper.prototype.mapRow = function(map, row) {
  var instance;

  //(1) cast as needed
  if (map instanceof Function) {
    instance = this.customMap(map, row);
  } else if (map instanceof Array) {
    instance = this.defaultMap({map: map}, row);
  } else if (map instanceof Object) {
    instance = this.defaultMap(map, row);
  } else {
    instance = row;
  }

  //(2) return instance
  return instance;
};

/**
 * @private
 */
Mapper.prototype.defaultMap = function(map, row) {
  var instance, Class, mapping;

  //(1) prepare
  Class = (map.clss || Object);
  mapping = (map.map || {});

  if (typeof(mapping) == "string") {
    mapping = [mapping];
  }

  if (mapping instanceof Array) {
    var aux = {};

    for (var i = 0; i < mapping.length; ++i) {
      var field = mapping[i];
      aux[field.toLowerCase()] = field;
    }

    mapping = aux;
  }

  //(2) create instance
  instance = Object.create(Class.prototype);

  //(3) initialize instance
  for (var key in row) {
    instance[mapping[key] || key] = row[key];
  }

  //(4) return instance
  return instance;
};

/**
 * @private
 */
Mapper.prototype.customMap = function(map, row) {
  return map(row);
};

/**
 * @classdesc A query.
 * @class vdba.Query
 * @abstract
 */
function Query() {
  /**
   * The limit info: count and start.
   *
   * @name limitTo
   * @type {Object}
   * @memberof vdba.Query#
   * @protected
   */
  Object.defineProperty(this, "limitTo", {value: {count: undefined, start: 0}});

  /**
   * The filter, that is, the where clause.
   *
   * @name filterBy
   * @type {Object}
   * @memberof vdba.Query#
   * @protected
   */
  Object.defineProperty(this, "filterBy", {value: {}, writable: true});

  /**
   * The order by. Each field indicates the order: ASC or DESC.
   *
   * @name orderBy
   * @type {Object}
   * @memberof vdba.Query#
   * @protected
   */
  Object.defineProperty(this, "orderBy", {value: {}, writable: true});

  /**
   * The JOINs.
   *
   * @name joins
   * @type {vdba.Join[]}
   * @memberof vdba.Query#
   * @protected
   */
  Object.defineProperty(this, "joins", {value: []});
}

/**
 * Filters the rows that comply the specified filter.
 *
 * @name where
 * @function
 * @memberof vdba.Query#
 *
 * @param {Object} where       The filter.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query to chain if needed.
 */
Query.prototype.filter = function filter(where, callback) {
  //(1) pre: arguments
  if (!where) throw new Error("Filter expected.");

  //(2) configure
  this.filterBy = where;

  //(3) run if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Limits the result to a maximum number of rows.
 *
 * @name limit
 * @function
 * @memberof vdba.Query#
 *
 * @param {Integer} count       The maximum number to return.
 * @param {Integer} [start]     The position where to start to return. Default: 0.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query to chain if needed.
 */
Query.prototype.limit = function limit(count, start, callback) {
  //(1) pre: arguments
  if (arguments.length == 2 && arguments[1] instanceof Function) {
    callback = arguments[1];
    start = undefined;
  }

  if (!count) throw new Error("Count expected.");
  if (start === undefined || start === null) start = 0;

  //(2) configure query
  this.limitTo.count = count;
  this.limitTo.start = start;

  //(3) run if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Checks whether a limit has been set.
 *
 * @name hasLimit
 * @function
 * @memberof vdba.Query#
 *
 * @returns {Boolean}
 */
Query.prototype.hasLimit = function hasLimit() {
  return (this.limitTo.count > 0 || this.limitTo.start > 0);
};

/**
 * Sorts by the specified columns. The order mode are: ASC and DESC,
 * being ASC the default.
 *
 * @name sort
 * @function
 * @memberof vdba.Query#
 *
 * @param {String|String[]|Object} columns  The ordering column(s).
 * @param {Function} [callback]             The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query to chain if needed.
 */
Query.prototype.sort = function sort(columns, callback) {
  var cols = {};

  //(1) pre: arguments
  if (!columns) {
    throw new Error("Ordering column(s) expected.");
  } else if (typeof(columns) == "string") {
    cols[columns] = "ASC";
  } else if (columns instanceof Array) {
    if (columns.length === 0) throw new Error("Ordering column(s) expected.");
    else for (var i = 0; i < columns.length; ++i) cols[columns[i]] = "ASC";
  } else if (typeof(columns) == "object") {
    if (Object.keys(columns).length === 0) throw new Error("Ordering column(s) expected.");
    else cols = columns;
  } else {
    throw new Error("Ordering column(s) expected.");
  }

  //(2) configure query
  this.orderBy = cols;

  //(3) run if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Checks whether an order by has been set.
 *
 * @name hasOrderBy
 * @function
 * @memberof vdba.Query#
 *
 * @returns {Boolean}
 */
Query.prototype.hasOrderBy = function hasOrderBy() {
  return (this.orderBy && Object.keys(this.orderBy).length > 0);
};

/**
 * Runs the query.
 *
 * @name find
 * @function
 * @memberof vdba.Query#
 * @abstract
 *
 * @param {Object} [filter]   The filter object.
 * @param {Function} callback The function to call: fn(error, result).
 */
Query.prototype.find = function find() {
  throw new Error("Abstract method.");
};

/**
 * find() with casting.
 *
 * @name map
 * @function
 * @memberof vdba.Query#
 *
 * @param {Object|Function|String[]} map  The mapping.
 * @param {Object} [filter]               The condition.
 * @param {Function} callback             The function to call: fn(error, result).
 */
Query.prototype.map = function(map, filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      filter = undefined;
    }
  }

  if (!map) throw new Error("Map expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find and map
  this.find(filter, function(error, result) {
    if (error) {
      callback(error);
    } else {
      vdba.Mapper.mapper.map(map, result.rows);
      callback(undefined, result);
    }
  });
};

/**
 * Returns all records.
 *
 * @name findAll
 * @function
 * @memberof vdba.Query#
 *
 * @param {Function} callback The function to call: fn(error, result).
 */
Query.prototype.findAll = function findAll(callback) {
  //(1) pre: arguments
  if (!callback) throw new Error("Callback expected.");

  //(2) configure query
  this.filterBy = {};

  //(3) find
  this.find(callback);
};

/**
 * findAll() with casting.
 *
 * @name mapAll
 * @function
 * @memberof vdba.Query#
 *
 * @param {Object|Function|String[]} map  The mapping.
 * @param {Function} callback             The function to call: fn(error, result).
 */
Query.prototype.mapAll = function mapAll(map, callback) {
  //(1) pre: arguments
  if (!map) throw new Error("Map expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find and map
  this.findAll(function(error, result) {
    if (error) {
      callback(error);
    } else {
      vdba.Mapper.mapper.map(map, result.rows);
      callback(undefined, result);
    }
  });
};

/**
 * Runs the query.
 *
 * @name findOne
 * @function
 * @memberof vdba.Query#
 *
 * @param {Object} [filter]   The filter object.
 * @param {Function} callback The function to call: fn(error, record).
 */
Query.prototype.findOne = function findOne(filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 1 && arguments[0] instanceof Function) {
    callback = arguments[0];
    filter = undefined;
  }

  if (!callback) throw new Error("Callback expected.");

  //(2) configure query
  if (filter) this.filterBy = filter;
  this.limitTo.count = 1;

  //(3) find
  this.find(function(error, result) {
    if (error) {
      callback(error);
    } else {
      if (result.length === 0) callback();
      else callback(undefined, result.rows[0]);
    }
  });
};

/**
 * findOne() with casting.
 *
 * @name mapOne
 * @function
 * @memberof vdba.Query#
 *
 * @param {Object|Function|String[]} map  The mapping.
 * @param {Object} [filter]               The filter object.
 * @param {Function} callback             The function to call: fn(error, record).
 */
Query.prototype.mapOne = function mapOne(map, filter, callback){
  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      filter = undefined;
    }
  }

  if (!map) throw new Error("Map expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find and map
  this.findOne(filter, function(error, row) {
    if (error) {
      callback(error);
    } else {
      if (!row) callback();
      else callback(undefined, vdba.Mapper.mapper.mapRow(map, row));
    }
  });
};

/**
 * Performs an inner join.
 *
 * @name join
 * @function
 * @memberof vdba.Query#
 *
 * @param {String|vdba.Table} target  The target table.
 * @param {String} col1               The source column.
 * @param {String} [col2]             The target column.
 * @param {Function} [callback]       The function to call: function(error, result).
 *
 * @returns {vdba.Query} The query to chain if needed.
 */
Query.prototype.join = function join(target, col1, col2, callback) {
  //(1) pre: arguments
  if (arguments.length == 3) {
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
      col2 = undefined;
    }
  }

  if (!target) throw new Error("Target table expected.");
  if (!col1) throw new Error("Source column name expected.");
  if (!col2) col2 = col1;

  //(2) configure query
  this.joins.push(new vdba.Join("inner", "none", target, col1, col2));

  //(3) find if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Performs an one-to-one inner join.
 *
 * @name joinoo
 * @function
 * @memberof vdba.Query#
 *
 * @param {String|vdba.Table} target  The target table.
 * @param {String} col1               The source column.
 * @param {String} [col2]             The target column.
 * @param {Function} [callback]       The function to call: function(error, result).
 *
 * @returns {vdba.Query} The query to chain if needed.
 */
Query.prototype.joinoo = function joinoo(target, col1, col2, callback) {
  //(1) pre: arguments
  if (arguments.length == 3) {
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
      col2 = undefined;
    }
  }

  if (!target) throw new Error("Target table expected.");
  if (!col1) throw new Error("Source column name expected.");
  if (!col2) col2 = col1;

  //(2) configure query
  this.joins.push(new vdba.Join("inner", "1-1", target, col1, col2));

  //(3) find if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};


/**
 * Performs an one-to-many inner join.
 *
 * @name joinom
 * @function
 * @memberof vdba.Query#
 *
 * @param {String|vdba.Table} target  The target table.
 * @param {String} col1               The source column.
 * @param {String} [col2]             The target column.
 * @param {Function} [callback]       The function to call: function(error, result).
 *
 * @returns {vdba.Query} The query to chain if needed.
 */
Query.prototype.joinom = function joinoo(target, col1, col2, callback) {
  //(1) pre: arguments
  if (arguments.length == 3) {
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
      col2 = undefined;
    }
  }

  if (!target) throw new Error("Target table expected.");
  if (!col1) throw new Error("Source column name expected.");
  if (!col2) col2 = col1;

  //(2) configure query
  this.joins.push(new vdba.Join("inner", "1-*", target, col1, col2));

  //(3) find if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Checks whether the query is multi table.
 *
 * @name isMultiTable
 * @function
 * @memberof vdba.Query#
 *
 * @returns {Boolean}
 */
Query.prototype.isMultiTable = function isMultiTable() {
  return (this.joins.length > 0);
};

/**
 * Checks whether the query is simple, that is, only one table.
 *
 * @name isSimple
 * @function
 * @memberof vdba.Query#
 *
 * @returns {Boolean}
 */
Query.prototype.isSimple = function isSimple() {
  return !this.isMultiTable();
};

/**
 * @classdesc A query result.
 * @class vdba.Result
 *
 * @param {Array} rows        The rows.
 * @param {Object} [options]  The options.
 */
function Result(rows, options) {
  /**
   * The rows.
   *
   * @name rows
   * @type {Object[]}
   * @memberof vdba.Result#
   */
  Object.defineProperty(this, "rows", {value: rows});

  /**
   * The result options.
   *
   * @name options
   * @type {Object}
   * @memberof vdba.Result#
   */
  Object.defineProperty(this, "options", {value: options || {}});
}

/**
 * The number of records.
 *
 * @name length
 * @type {Number}
 * @memberof vdba.Result#
 */
Result.prototype.__defineGetter__("length", function() {
  return this.rows.length;
});

/**
 * Returns the rows satisfying the restriction.
 *
 * @name find
 * @function
 * @memberof vdba.Result#
 *
 * @param {Object} [where]  The restriction condition.
 *
 * @returns {vdba.Result}
 */
Result.prototype.find = function find(where) {
  vdba.Filter.filter.filter(this.rows, where);
  return this;
};

/**
 * Returns the rows satisfying the restriction casted as
 * indicated.
 *
 * @name map
 * @function
 * @memberof vdba.Result#
 *
 * @param {Object} map      The mapping.
 * @param {Object} [where]  The restriction condition.
 *
 * @returns {vdba.Result}
 */
Result.prototype.map = function(map, where) {
  vdba.Mapper.mapper.map(map, this.find(where));
  return this;
};

/**
 * Limits the number of rows.
 *
 * @name limit
 * @function
 * @memberof vdba.Result#
 *
 * @param {Integer} count   The maximum number of rows to return.
 * @param {Integer} [start] The row where to start to return. Default: 0.
 *
 * @returns {vdba.Result} The same result to chain if needed.
 */
Result.prototype.limit = function limit(count, start) {
  //(1) pre: arguments
  if (count === undefined || count === null) throw new Error("Count expected.");
  if (start === undefined || start === null) start = 0;

  //(2) limit
  this.rows.slice(start, count);
};

/**
 * Transforms the specified columns into a property.
 *
 * @name transform
 * @function
 * @memberof vdba.Result#
 *
 * @param {String[]|Object} columns The columns to transform into a property.
 * @param {String} property         The new property name.
 *
 * @returns {vdba.Result} The same result for chainning if needed.
 */
//Result.prototype.transform = function transform(columns, property) {
//  var agg = vdba.Aggregator.aggregator;

  //(1) transform
//  agg.transform.apply(agg, [this.rows].concat(Array.prototype.slice.call(arguments)));

  //(2) return
//  return this;
//};

/**
 * @classdesc A database schema.
 * @class vdba.Schema
 * @abstract
 * @protected
 *
 * @param {vdba.Database} db  The database.
 * @param {String} name       The name.
 */
function Schema(db, name) {
  //(1) pre: arguments
  if (!db) throw new Error("Database expected.");
  if (!name) throw new Error("Schema name expected.");

  //(2) initialize
  /**
   * The database.
   *
   * @name database
   * @type {vdba.Database}
   * @memberof vdba.Schema#
   */
  Object.defineProperty(this, "database", {value: db, enumerable: true});

  /**
   * The schema name.
   *
   * @name name
   * @type {vdba.String}
   * @memberof vdba.Schema#
   */
  Object.defineProperty(this, "name", {value: name.toLowerCase(), enumerable: true});
}

/**
 * Returns if this schema is default. This schema is used when the DBMS doesn't
 * support the schema concept.
 *
 * @name isDefault
 * @function
 * @memberof vdba.Schema#
 * @abstract
 *
 * @returns {Boolean}
 */
Schema.prototype.isDefault = function isDefault() {
  throw new Error("Abstract method.");
};

/**
 * Finds a table object into the schema.
 *
 * @name findTable
 * @function
 * @memberof vdba.Schema#
 *
 * @param {String} name       The table name.
 * @param {Function} callback The function to call: fn(error, table).
 */
Schema.prototype.findTable = function findTable(name, callback) {
  this.database.findTable.apply(this.database, [this.name].concat(Array.prototype.slice.call(arguments)));
};

/**
 * Checks whether a table exists.
 *
 * @name hasTable
 * @function
 * @memberof vdba.Schema#
 *
 * @param {String} name       The table name.
 * @param {Function} callback The function to call: fn(error, exists.)
 */
Schema.prototype.hasTable = function hasTable() {
  this.database.hasTable.apply(this.database, [this.name].concat(Array.prototype.slice.call(arguments)));
};

/**
 * Checks whether several tables exist.
 *
 * @name hasTables
 * @function
 * @memberof vdba.Schema#
 *
 * @param {String[]} names    The table names.
 * @param {Function} callback The function to call: fn(error, exist).
 */
Schema.prototype.hasTables = function hasTables() {
  this.database.hasTables.apply(this.database, [this.name].concat(Array.prototype.slice.call(arguments)));
};

if (SPEC_TYPE > 1) {
  /**
   * Creates a new table.
   *
   * @name createTable
   * @function
   * @memberof vdba.Schema#
   *
   * @param {String} name         The table name.
   * @param {Object} columns      The columns.
   * @param {Object} [options]    The create options: ifNotExists (Boolean).
   * @param {Function} [callback] The function to call: fn(error).
   */
  Schema.prototype.createTable = function createTable()  {
    this.database.createTable.apply(this.database, [this.name].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Drops a table.
   *
   * @name dropTable
   * @function
   * @memberof vdba.Schema#
   *
   * @param {String|vdba.Table} table       The table to drop.
   * @param {Object} [options] options      The drop options.
   * @param {Function} [callback] callback  The function to call: fn(error).
   */
  Schema.prototype.dropTable = function dropTable() {
    this.database.dropTable.apply(this.database, [this.name].concat(Array.prototype.slice.call(arguments)));
  };
}

/**
 * @classdesc A database engine.
 * @class vdba.Server
 * @abstract
 * @protected
 */
function Server() {

}

/**
 * The hostname.
 *
 * @name host
 * @memberof vdba.Server#
 * @abstract
 */
Server.prototype.__defineGetter__("host", function() {
  throw new Error("Abstract method.");
});

/**
 * The port.
 *
 * @name port
 * @memberof vdba.Server#
 * @abstract
 */
Server.prototype.__defineGetter__("port", function() {
  throw new Error("Abstract method.");
});

/**
 * Checks whether a database exists.
 *
 * @name hasDatabase
 * @function
 * @memberof vdba.Server#
 * @abstract
 *
 * @param {String} name       The database name.
 * @param {Function} callback The function to call: fn(error, exists).
 */
Server.prototype.hasDatabase = function hasDatabase() {
  throw new Error("Abstract method.");
};

/**
 * The server version.
 *
 * @name version
 * @memberof vdba.Server#
 * @abstract
 */
Server.prototype.__defineGetter__("version", function() {
  throw new Error("Abstract method.");
});

if (SPEC_TYPE > 1) {
  /**
   * Creates a new database.
   *
   * @name createDatabase
   * @function
   * @memberof vdba.Server#
   * @abstract
   *
   * @param {String} name         The database name.
   * @param {Object} [options]    The database options.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Server.prototype.createDatabase = function createDatabase() {
    throw new Error("Abstract method.");
  };

  /**
   * Drops a database.
   *
   * @name dropDatabase
   * @function
   * @memberof vdba.Server#
   * @abstract
   *
   * @param {String} name         The database name.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Server.prototype.dropDatabase = function dropDatabase() {
    throw new Error("Abstract method.");
  };
}

/**
 * @classdesc A table.
 * @class vdba.Table
 * @abstract
 * @protected
 *
 * @param {vdba.Schema} schema  The schema.
 * @param {String} name         The table name.
 * @param {Object} columns      The columns.
 */
function Table(schema, name, columns) {
  //(1) pre: arguments
  if (!schema) throw new Error("Schema expected.");
  if (!name) throw new Error("Table name expected.");
  if (!columns) columns = {};

  //(2) initialize
  /**
   * The schema object.
   *
   * @name schema
   * @type {vdba.Schema}
   * @memberof vdba.Table#
   */
  Object.defineProperty(this, "schema", {value: schema, enumerable: true});

  /**
   * The table name.
   *
   * @name name
   * @type {String}
   * @memberof vdba.Table#
   */
  Object.defineProperty(this, "name", {value: name.toLowerCase(), enumerable: true});

  /**
   * The table columns.
   *
   * @name columns
   * @type {Object}
   * @memberof vdba.Table#
   */
  Object.defineProperty(this, "columns", {value: columns, enumerable: true});
}


Table.prototype.__defineGetter__("columnNames", function() {
  return Object.keys(this.columns);
});

/**
 * The database.
 *
 * @name database
 * @type {vdba.Database}
 * @memberof vdba.Table#
 */
Table.prototype.__defineGetter__("database", function() {
  return this.schema.database;
});

/**
 * The qualified name.
 *
 * @name qualifiedName
 * @type {String}
 * @memberof vdba.Table#
 */
Table.prototype.__defineGetter__("qualifiedName", function() {
  return (this.schema.isDefault() ? "" : this.schema.name + ".") + this.name;
});

/**
 * Alias of qualifiedName.
 *
 * @name qn
 * @type {String}
 * @memberof vdba.Table#
 */
Table.prototype.__defineGetter__("qn", function() {
  return this.qualifiedName;
});

/**
 * The full qualified name.
 *
 * @name fullQualifiedName
 * @type {String}
 * @memberof vdba.Table#
 */
Table.prototype.__defineGetter__("fullQualifiedName", function() {
  return this.database.name + "." + this.qualifiedName;
});

/**
 * Alias of fullQualifiedName.
 *
 * @name fqn
 * @type {String}
 * @memberof vdba.Table#
 */
Table.prototype.__defineGetter__("fqn", function() {
  return this.fullQualifiedName;
});

/**
 * Checks whether the table has the specified columns.
 *
 * @name checkSchema
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object} columns  The columns to check.
 * @returns {Boolean}
 */
Table.prototype.checkSchema = function checkSchema(columns) {
  var res;

  //(1) pre: arguments
  if (!columns) columns = {};

  //(2) check
  res = true;

  for (var i = 0, colNames = Object.keys(columns); i < colNames.length; ++i) {
    var name = colNames[i];
    var chkCol = columns[name];
    var tblCol = this.columns[name];

    if (typeof(chkCol) != "object") chkCol = {type: chkCol};

    if (chkCol && tblCol) {
      if (chkCol.hasOwnProperty("type") && chkCol.type != tblCol.type) res = false;
      if (chkCol.hasOwnProperty("nullable") && chkCol.nullable != tblCol.nullable) res = false;
      if (chkCol.hasOwnProperty("primaryKey") && chkCol.primaryKey != tblCol.primaryKey) res = false;
      if (chkCol.hasOwnProperty("pk") && chkCol.pk != tblCol.primaryKey) res = false;
    } else {
      res = false;
    }

    if (!res) break;
  }

  //(3) return result
  return res;
};

if (SPEC_TYPE > 1) {
  /**
   * Checks whether an index exists.
   *
   * @name hasIndex
   * @function
   * @memberof vdba.Table#
   *
   * @param {String} name       The index name.
   * @param {Function} callback The function to call: fn(error, exists).
   */
  Table.prototype.hasIndex = function hasIndex(name, callback) {
    this.database.hasIndex.apply(this.database, [this.schema.name].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Returns an index.
   *
   * @name findIndex
   * @function
   * @memberof vdba.Table#
   *
   * @param {String} name       The index name.
   * @param {Function} callback The function to call: fn(error, exists).
   */
  Table.prototype.findIndex = function findIndex(name, callback) {
    this.database.findIndex.apply(this.database, [this.schema.name].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Creates an index on the table.
   *
   * @name createIndex
   * @function
   * @memberof vdba.Table#
   *
   * @param {String} name         The index name.
   * @param {String|String[]} col The column(s).
   * @param {Object} [options]    The index options.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Table.prototype.createIndex = function createIndex() {
    this.database.createIndex.apply(this.database, [this.schema.name, this.name].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Drops an index.
   *
   * @name dropIndex
   * @function
   * @memberof vdba.Table#
   *
   * @param {String} name         The index name.
   * @param {Function} [callback] The function to call: fn(error).
   */
  Table.prototype.dropIndex = function dropIndex(name, callback) {
    this.database.dropIndex(this.schema.name, name, callback);
  };
}

/**
 * Returns a query object.
 *
 * @name query
 * @function
 * @memberof vdba.Table#
 * @abstract
 *
 * @returns {vdba.Query}
 */
Table.prototype.query = function query() {
  throw new Error("Abstract method.");
};

/**
 * Similar to this.query().limit(count, start, callback).
 *
 * @name limit
 * @function
 * @memberof vdba.Table#
 *
 * @param {Integer} count       The maximum number of rows.
 * @param {Integer} [start]     The position of the first row to return.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.limit = function limit(count, start, callback) {
  var q = this.query();
  return q.limit.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().filter(where, callback).
 *
 * @name filter
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object} filter       The filter.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.filter = function filter(where, callback) {
  var q = this.query();
  return q.filter.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().find(filter, callback).
 *
 * @name find
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object} filter     The condition.
 * @param {Function} callback The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.find = function find() {
  var q = this.query();
  return q.find.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().map(map, filter, callback).
 *
 * @name map
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object|Function|String[]} map  The mapping.
 * @param {Object} [filter]               The condition.
 * @param {Function} callback             The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.map = function() {
  var q = this.query();
  return q.map.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().findAll(callback).
 *
 * @name findAll
 * @function
 * @memberof vdba.Table#
 *
 * @param {Function} callback The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.findAll = function findAll() {
  var q = this.query();
  return q.findAll.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().mapAll(map, callback).
 *
 * @name mapAll
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object|Function|String[]} map  The mapping.
 * @param {Function} callback             The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.mapAll = function mapAll() {
  var q = this.query();
  return q.mapAll.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().findOne(filter, callback).
 *
 * @name findOne
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object} [filter]   The condition.
 * @param {Function} callback The function to call: fn(error, row).
 *
 * @returns {vdba.Query}
 */
Table.prototype.findOne = function findOne() {
  var q = this.query();
  return q.findOne.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().mapOne(map, filter, callback).
 *
 * @name mapOne
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object|Function|String[]} map  The mapping.
 * @param {Object} [filter]               The condition.
 * @param {Function} callback             The function to call: fn(error, row).
 *
 * @returns {vdba.Query}
 */
Table.prototype.mapOne = function mapOne() {
  var q = this.query();
  return q.mapOne.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Gets the number of rows.
 *
 * @name count
 * @function
 * @memberof vdba.Table#
 * @abstract
 *
 * @param {Function} callback The function to call: fn(error, count).
 */
Table.prototype.count = function count() {
  throw new Error("Abstract method.");
};

/**
 * Similar to this.query().join(target, col1, col2, callback).
 *
 * @name join
 * @function
 * @memberof vdba.Table#
 *
 * @param {String|vdba.Table} target  The target table.
 * @param {String} col1               The source column.
 * @param {String} [col2]             The target column.
 * @param {Function} [callback]       The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.join = function join() {
  var q = this.query();
  return q.join.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().joinoo(target, col1, col2, callback).
 *
 * @name joinoo
 * @function
 * @memberof vdba.Table#
 *
 * @param {String|vdba.Table} target  The target table.
 * @param {String} col1               The source column.
 * @param {String} [col2]             The target column.
 * @param {Function} [callback]       The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.joinoo = function joinoo() {
  var q = this.query();
  return q.joinoo.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Similar to this.query().joinom(target, col1, col2, callback).
 *
 * @name joinom
 * @function
 * @memberof vdba.Table#
 *
 * @param {String|vdba.Table} target  The target table.
 * @param {String} col1               The source column.
 * @param {String} [col2]             The target column.
 * @param {Function} [callback]       The function to call: fn(error, result).
 *
 * @returns {vdba.Query}
 */
Table.prototype.joinom = function joinom() {
  var q = this.query();
  return q.joinom.apply(q, Array.prototype.slice.call(arguments));
};

/**
 * Inserts one or several rows into the table.
 *
 * @name insert
 * @function
 * @memberof vdba.Table#
 * @abstract
 *
 * @param {object|Object[]} rows  The row(s) to insert.
 * @param {Object} [options]      The insert options.
 * @param {Function} [callback]   The function to call: fn(error).
 */
Table.prototype.insert = function insert() {
  throw new Error("Abstract method.");
};

/**
 * Replaces the content of one or several rows.
 * The record must exist.
 *
 * @name save
 * @function
 * @memberof vdba.Table#
 * @abstract
 *
 * @param {Object|Object[]} rows  The row(s) to save.
 * @param {Function} [callback]   The function to call: fn(error).
 *
 * @example
 * user.save({userId: 1, username: "user01", password: "pwd01"});
 * user.save([{...}, {...}, {...}], function(error) { ... });
 */
Table.prototype.save = function save() {
  throw new Error("Abstract method.");
};

/**
 * Updates zero, one or several rows.
 *
 * @name update
 * @function
 * @memberof vdba.Table#
 * @abstract
 *
 * @param {Object} [filter]     The filter.
 * @param {Object} cols         The columns to update.
 * @param {Object} [options]    The update options.
 * @param {Function} [callback] The function to call: fn(error).
 */
Table.prototype.update = function update() {
  throw new Error("Abstract method.");
};

/**
 * Removes zero, one or several rows.
 *
 * @name remove
 * @function
 * @memberof vdba.Table#
 * @abstract
 *
 * @param {Object} filter       The filter.
 * @param {Object} [options]    The delete options.
 * @param {Function} [callback] The function to call: fn(error).
 */
Table.prototype.remove = function remove() {
  throw new Error("Abstract method.");
};

/**
 * Removes all rows from a table.
 *
 * @name truncate
 * @function
 * @memberof vdba.Table#
 * @abstract
 *
 * @param {Function} callback The function to call: fn(error).
 */
Table.prototype.truncate = function truncate() {
  throw new Error("Abstract method.");
};

})();

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
  else if (op == "$contain") res = this.$contain(col, val, params);
  else if (op == "$notContain") res = this.$notContain(col, val, params);
  else if (op == "$ncontain") res = this.$notContain(col, val, params);
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
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter;

  //(1) build sql
  sql = "SELECT * FROM " + query.source.sqlQN;
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
SelectEngine.prototype.runMultiTableQuery = function runMultiTableQuery(query, callback) {
  var self = this, join = query.joins[0], adapter = vdba.sqlite.Adapter.adapter;

  //if target has been specified, we have to find the table
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
    var sql, expr;

    //build sql
    sql = "SELECT * " +
          "FROM " + query.source.sqlQN + " as Src INNER JOIN " + join.target.sqlQN + " as Tgt " +
          "ON Src." + join.sourceColumn + " = Tgt." + join.targetColumn;
    expr = this.filterFormatter.format(query.filterBy);
    sql += " WHERE " + expr.expression;
    if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
    if (query.hasLimit()) sql += " " + this.buildLimit(query);

    //find
    this.findp(sql, expr.parameters, function(error, result) {
      if (error) {
        callback(error);
      } else {
        adapter.adapt(result, query);
        callback(undefined, result);
      }
    });
  }
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
  } else {
    sql = col.name + " = ?";
    params.push(val);
  }

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
  } else if (op == "$remove") {
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
  } else if (op == "$remove") {
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