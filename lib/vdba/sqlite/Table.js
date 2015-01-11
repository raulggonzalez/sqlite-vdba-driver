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