//imports
var vdba = require("./node-vdba-core");

//api
for (var i=0, keys = Object.keys(vdba); i < keys.length; ++i) {
  var key = keys[i];
  Object.defineProperty(exports, key, {value: vdba[key], enumerable: true});
}

/**
 * The SQLite VDBA namespace.
 *
 * @namespace vdba.sqlite
 */
Object.defineProperty(exports, "sqlite", {
  value: {},
  enumerable: true
});

//register driver
vdba.Driver.register(new (require("./vdba/sqlite/Driver").SQLiteDriver)());