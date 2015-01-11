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