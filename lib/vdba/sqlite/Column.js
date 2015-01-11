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