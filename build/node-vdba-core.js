/*! vdba-core - 0.13.0 (2015-01-14) */

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

Object.defineProperty(vdba, "AggOperation", {value: AggOperation, enumerable: false});
Object.defineProperty(vdba, "Aggregator", {value: Aggregator, enumerable: true});
Object.defineProperty(vdba, "Column", {value: Column, enumerable: true});
Object.defineProperty(vdba, "Combinator", {value: Combinator, enumerable: true});
Object.defineProperty(vdba, "Connection", {value: Connection, enumerable: true});
Object.defineProperty(vdba, "Database", {value: Database, enumerable: true});
Object.defineProperty(vdba, "DefinitionCache", {value: DefinitionCache, enumerable: false});
Object.defineProperty(vdba, "Driver", {value: Driver, enumerable: true});
Object.defineProperty(vdba, "Filter", {value: Filter, enumerable: true});
Object.defineProperty(vdba, "GroupBy", {value: GroupBy, enumerable: true});
Object.defineProperty(vdba, "Index", {value: Index, enumerable: true});
Object.defineProperty(vdba, "Join", {value: Join, enumerable: true});
Object.defineProperty(vdba, "Mapper", {value: Mapper, enumerable: true});
Object.defineProperty(vdba, "Query", {value: Query, enumerable: true});
Object.defineProperty(vdba, "Result", {value: Result, enumerable: true});
Object.defineProperty(vdba, "Schema", {value: Schema, enumerable: true});
Object.defineProperty(vdba, "Server", {value: Server, enumerable: true});
Object.defineProperty(vdba, "Table", {value: Table, enumerable: true});



/**
 * @classdesc An aggregation operation.
 * @class vdba.AggOperation
 * @private
 *
 * @param {String} op     The operation.
 * @param {String} column The column.
 * @param {String} alias  The alias.
 * @param {Object} filter The filter.
 */
function AggOperation(op, column, alias, filter) {
  /**
   * The operation: sum, count, min, max...
   *
   * @name operation
   * @type {String}
   * @memberof vdba.AggOperation#
   */
  Object.defineProperty(this, "name", {value: op, enumerable: true});

  /**
   * The column name.
   *
   * @name column
   * @type {String}
   * @memberof vdba.AggOperation#
   */
  Object.defineProperty(this, "column", {value: column, enumerable: true});

  /**
   * The alias.
   *
   * @name alias
   * @type {String}
   * @memberof vdba.AggOperation#
   */
  Object.defineProperty(this, "alias", {value: alias, enumerable: true});

  /**
   * The filter for the operation result.
   *
   * @name filter
   * @type {Object}
   * @memberof vdba.AggOperation#
   */
  Object.defineProperty(this, "filter", {value: filter, enumerable: true});
}

/**
 * Checks whether the operation has filter.
 *
 * @name hasFilter
 * @function
 * @memberof vdba.AggOperation#
 *
 * @returns {Boolean}
 */
AggOperation.prototype.hasFilter = function hasFilter() {
  return !!this.filter;
};

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
 * Indicates if the column is required, that is, it doesn't accept a null value.
 *
 * @name required
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("required", function() {
  return (this.id ? true : !!this.options.required);
});

/**
 * Alias of !required.
 *
 * @name nullable
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("nullable", function() {
  return !this.required;
});

/**
 * Alias of !required.
 *
 * @name optional
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("optional", function() {
  return !this.required;
});

/**
 * Indicates if the column is the primary key.
 *
 * @name id
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("id", function() {
  return !!this.options.id;
});

/**
 * Alias of id.
 *
 * @name primaryKey
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("primaryKey", function() {
  return this.id;
});

/**
 * Alias of id.
 *
 * @name pk
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("pk", function() {
  return this.id;
});

/**
 * Indicates if the column is unique.
 *
 * @name unique
 * @type {Boolean}
 * @memberof vdba.Column#
 */
Column.prototype.__defineGetter__("unique", function() {
  return (this.id ? true : !!this.options.unique);
});

/**
 * Checks whether the columns complies the specified definition.
 *
 * @name checkDefinition
 * @function
 * @memberof vdba.Column#
 *
 * @param {String|Object} def The definition. If string, this indicates the type.
 *
 * @returns {Boolean}
 */
Column.prototype.checkDefinition = function checkDefinition(def) {
  var res;

  //(1) pre: arguments
  if (!def) throw new Error("Column definition to check expected.");
  if (typeof(def) != "object") def = {type: def};

  //(1) check
  res = true;

  for (var i = 0, props = Object.keys(def); i < props.length && res; ++i) {
    var prop = props[i];

    if (["id", "required", "type", "unique"].indexOf(prop) < 0) res = false;
    else res = (this[prop] == def[prop]);
  }

  //(2) return
  return res;
};

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
 * Checks whether the column stores a number.
 *
 * @name isNumber
 * @function
 * @memberof vdba.Colummn#
 *
 * @returns {Boolean}
 */
Column.prototype.isNumber = function isNumber() {
  return this.type == "integer" || this.type == "real";
};

/**
 * Checks whether the column stores a number.
 *
 * @name isInteger
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isInteger = function isInteger() {
  return this.type == "integer";
};

/**
 * Checks whether the column stores a real.
 *
 * @name isReal
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isReal = function isReal() {
  return this.type == "real";
};

/**
 * Checks whether the column stores a text.
 *
 * @name isText
 * @function
 * @memberof vdba.Column#
 *
 * @returns {Boolean}
 */
Column.prototype.isText = function isText() {
  return this.type == "text";
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
      if (tbl) callback(undefined, (columns ? tbl.checkDefinition(columns) : true));
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
 * @classdesc A group-by clause.
 * @class vdba.GroupBy
 *
 * @param {String|String[]} column  The grouping column(s).
 */
function GroupBy(columns) {
  //(1) pre: arguments
  if (typeof(columns) == "string") columns = [columns];

  //(2) initialize
  /**
   * The grouping column(s).
   *
   * @name columns
   * @type {String[]}
   * @memberof vdba.GroupBy#
   */
  Object.defineProperty(this, "columns", {value: columns, enumerable: true});

  /**
   * The agg operations.
   *
   * @name aggregations
   * @type {vdba.AggOperation[]}
   * @memberof vdba.GroupBy#
   */
  Object.defineProperty(this, "aggregations", {value: [], enumerable: true});
}

/**
 * Adds an aggregation.
 *
 * @name add
 * @function
 * @memberof vdba.GroupBy#
 *
 * @param {vdba.AggOperation} op  The operation.
 */
GroupBy.prototype.add = function add(agg) {
  this.aggregations.push(agg);
};

/**
 * Checks whether some aggregation has defined some filter.
 *
 * @name hasFilter
 * @function
 * @memberof vdba.GroupBy#
 *
 * @returns {Boolean}
 */
GroupBy.prototype.hasFilter = function hasFilter() {
  var res;

  //(1) check
  res = false;
  for (var i = 0; i < this.aggregations.length; ++i) {
    if (this.aggregations[i].hasFilter()) {
      res = true;
      break;
    }
  }

  //(2) return
  return res;
};

/**
 * Returns the filter.
 *
 * @name filter
 * @type {Object}
 * @memberof vdba.GroupBy#
 */
GroupBy.prototype.__defineGetter__("filter", function() {
  var res = {};

  //(1) build
  for (var i = 0; i < this.aggregations.length; ++i) {
    var agg = this.aggregations[i];
    if (agg.hasFilter()) res[agg.alias] = agg.filter.value;
  }

  //(2) return
  return res;
});

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
   * The group by clause.
   *
   * @name groupBy
   * @type {vdba.GroupBy}
   * @memberof vdba.GroupBy#
   * @protected
   */
  Object.defineProperty(this, "groupBy", {value: undefined, writable: true});

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
 * Returns the table of a specified column.
 * Used internally for getting the table of a query column.
 *
 * @name getTableOf
 * @function
 * @memberof vdba.Query#
 * @private
 *
 * @param {String} column The column name.
 *
 * @returns {vdba.Table}
 */
Query.prototype.getTableOf = function getTableOf(column) {
  var res;

  //(1) find
  if (this.source.hasColumn(column)) {
    res = this.source;
  } else {
    for (var i = 0; i < this.joins.length; ++i) {
      var tgt = this.joins[i].target;

      if (tgt.hasColumn(column)) {
        res = tgt;
        break;
      }
    }
  }

  //(2) return
  return res;
};

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
 * @returns {vdba.Query}  The same query for chaining if needed.
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
 * Groups by the specified column(s).
 *
 * @name group
 * @function
 * @memberof vdba.Query#
 *
 * @param {String|String[]} columns The grouping column(s).
 * @param {Function} [callback]     The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query for chaining if needed.
 */
Query.prototype.group = function group(columns, callback) {
  //(1) pre: arguments
  if (!columns) throw new Error("Grouping column name(s) expected.");

  //(2) configure query
  this.groupBy = new GroupBy(columns);

  //(3) run if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Checks whether the query has group-by.
 *
 * @name gasGroupBy
 * @function
 * @memberof vdba.Query#
 *
 * @returns {Boolean}
 */
Query.prototype.hasGroupBy = function hasGroupBy() {
  return !!this.groupBy;
};

/**
 * Sums the specified column.
 *
 * @name sum
 * @function
 * @memberof vdba.Query#
 *
 * @param {String} column       The column.
 * @param {String} [alias]      The result alias.
 * @param {Object} [filter]     The filter. Example: {value: {$gt: 5}}.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query for chaining if needed.
 */
Query.prototype.sum = function sum(column, alias, filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      alias = filter = undefined;
    } else if (typeof(arguments[1]) == "object") {
      filter = arguments[1];
      alias = callback = undefined;
    }
  } else if (arguments.length == 3) {
    if (typeof(arguments[1]) == "string") {
      if (arguments[2] instanceof Function) {
        callback = arguments[2];
        filter = undefined;
      }
    } else if (typeof(arguments[1]) == "object") {
      callback = arguments[2];
      filter = arguments[1];
      alias = undefined;
    }
  }

  if (!this.hasGroupBy()) throw new Error("No grouping column specified.");
  if (!column) throw new Error("Column name expected.");
  if (!alias) alias = "sum";

  //(2) configure query
  this.groupBy.add(new AggOperation("sum", column, alias, filter));

  //(3) run query if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Counts the grouped rows.
 *
 * @name count
 * @function
 * @memberof vdba.Query#
 *
 * @param {String} [column]     The column.
 * @param {String} [alias]      The alias.
 * @param {Object} [filter]     The filter.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query for chaining if needed.
 */
Query.prototype.count = function count(column, alias, filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 1) {
    if (arguments[0] instanceof Function) {
      callback = arguments[0];
      column = alias = filter = undefined;
    } else if (typeof(arguments[0]) == "object") {
      filter = arguments[0];
      column = alias = callback = undefined;
    }
  } else if (arguments.length == 2) {
    if (typeof(arguments[0]) == "object") {
      filter = arguments[0];
      callback = arguments[1];
      column =  alias = undefined;
    } else {
      if (arguments[1] instanceof Function) {
        callback = arguments[1];
        alias = filter = undefined;
      } else if (typeof(arguments[1]) == "object") {
        filter = arguments[1];
        alias = callback = undefined;
      }
    }
  } else if (arguments.length == 3) {
    if (typeof(arguments[1]) == "string") {
      if (arguments[2] instanceof Function) {
        callback = arguments[2];
        filter = undefined;
      }
    } else if (typeof(arguments[1]) == "object") {
      callback = arguments[2];
      filter = arguments[1];
      alias = undefined;
    }
  }

  if (!this.hasGroupBy()) throw new Error("No grouping column specified.");
  if (!column) column = "*";
  if (!alias) alias = "count";

  //(2) configure query
  this.groupBy.add(new AggOperation("count", column, alias, filter));

  //(3) run query if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Selects the maximum value of each group.
 *
 * @name max
 * @function
 * @memberof vdba.Query#
 *
 * @param {String} column       The column name.
 * @param {String} [alias]      The alias.
 * @param {Object} [filter]     The filter.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query for chaining if needed.
 */
Query.prototype.max = function max(column, alias, filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      alias = filter = undefined;
    } else if (typeof(arguments[1]) == "object") {
      filter = arguments[1];
      alias = callback = undefined;
    }
  } else if (arguments.length == 3) {
    if (typeof(arguments[1]) == "string") {
      if (arguments[2] instanceof Function) {
        callback = arguments[2];
        filter = undefined;
      }
    } else if (typeof(arguments[1]) == "object") {
      callback = arguments[2];
      filter = arguments[1];
      alias = undefined;
    }
  }

  if (!this.hasGroupBy()) throw new Error("No grouping column specified.");
  if (!column) throw new Error("Column name expected.");
  if (!alias) alias = "max";

  //(2) configure query
  this.groupBy.add(new AggOperation("max", column, alias, filter));

  //(3) run if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Selects the minimum value of each group.
 *
 * @name min
 * @function
 * @memberof vdba.Query#
 *
 * @param {String} column       The column name.
 * @param {String} [alias]      The alias.
 * @param {Object} [filter]     The filter.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query for chaining if needed.
 */
Query.prototype.min = function min(column, alias, filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      alias = filter = undefined;
    } else if (typeof(arguments[1]) == "object") {
      filter = arguments[1];
      alias = callback = undefined;
    }
  } else if (arguments.length == 3) {
    if (typeof(arguments[1]) == "string") {
      if (arguments[2] instanceof Function) {
        callback = arguments[2];
        filter = undefined;
      }
    } else if (typeof(arguments[1]) == "object") {
      callback = arguments[2];
      filter = arguments[1];
      alias = undefined;
    }
  }

  if (!this.hasGroupBy()) throw new Error("No grouping column specified.");
  if (!column) throw new Error("Column name expected.");
  if (!alias) alias = "min";

  //(2) configure query
  this.groupBy.add(new AggOperation("min", column, alias, filter));

  //(3) run if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
};

/**
 * Performs the average of each group.
 *
 * @name avg
 * @function
 * @memberof vdba.Query#
 *
 * @param {String} column       The column name.
 * @param {String} [alias]      The alias.
 * @param {Object} [filter]     The filter.
 * @param {Function} [callback] The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The same query for chaining if needed.
 */
Query.prototype.avg = function avg(column, alias, filter, callback) {
  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      alias = filter = undefined;
    } else if (typeof(arguments[1]) == "object") {
      filter = arguments[1];
      alias = callback = undefined;
    }
  } else if (arguments.length == 3) {
    if (typeof(arguments[1]) == "string") {
      if (arguments[2] instanceof Function) {
        callback = arguments[2];
        filter = undefined;
      }
    } else if (typeof(arguments[1]) == "object") {
      callback = arguments[2];
      filter = arguments[1];
      alias = undefined;
    }
  }

  if (!this.hasGroupBy()) throw new Error("No grouping column specified.");
  if (!column) throw new Error("Column name expected.");
  if (!alias) alias = "avg";

  //(2) configure query
  this.groupBy.add(new AggOperation("avg", column, alias, filter));

  //(3) run if needed
  if (callback) this.find(callback);

  //(4) return
  return this;
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
 * Checks whether this is an aggregate query.
 *
 * @returns {Boolean}
 */
Query.prototype.isAggregate = function isAggregate() {
  return !!this.groupBy;
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
 * Checks whether the table has the specified column.
 *
 * @name hasColumn
 * @function
 * @memberof vdba.Table#
 *
 * @param {String} name The column name.
 *
 * @returns {Boolean}
 */
Table.prototype.hasColumn = function hasColumn(name) {
  return this.columns.hasOwnProperty(name);
};

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
 * @name checkDefinition
 * @function
 * @memberof vdba.Table#
 *
 * @param {Object} columns  The columns to check.
 * @returns {Boolean}
 */
Table.prototype.checkDefinition = function checkDefinition(columns) {
  var res;

  //(1) pre: arguments
  if (!columns) throw new Error("Column(s) to check expected.");

  //(2) check
  res = true;

  for (var i = 0, colNames = Object.keys(columns); i < colNames.length && res; ++i) {
    var name = colNames[i];
    var col = this.columns[name];

    res = (col ? col.checkDefinition(columns[name]) : false);
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
 * Similar to this.query().group(columns, callback).
 *
 * @name group
 * @function
 * @memberof vdba.Table#
 *
 * @param {String|String[]} columns The grouping column(s).
 * @param {Function} [callback]     The function to call: fn(error, result).
 *
 * @returns {vdba.Query}  The query.
 */
Table.prototype.group = function group() {
  var q = this.query();
  return q.group.apply(q, Array.prototype.slice.call(arguments));
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
Table.prototype.limit = function limit() {
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
Table.prototype.filter = function filter() {
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