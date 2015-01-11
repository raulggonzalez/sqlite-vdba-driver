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