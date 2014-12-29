//imports
var util = require("util");
var vdba = require("../../index");

//api
exports.SQLiteTable = SQLiteTable;

/**
 * A SQLite table.
 *
 * @class vdba.sqlite.SQLiteTable
 * @extends vdba.Table
 * @protected
 *
 * @param {vdba.sqlite.SQLiteDatabase} db The database object.
 * @param {String} name                   The table name.
 */
function SQLiteTable(db, name) {
  SQLiteTable.super_.call(this, db, name);
}

util.inherits(SQLiteTable, vdba.Table);