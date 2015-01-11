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