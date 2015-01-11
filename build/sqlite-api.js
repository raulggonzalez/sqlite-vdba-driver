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