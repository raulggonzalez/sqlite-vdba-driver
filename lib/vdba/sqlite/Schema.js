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