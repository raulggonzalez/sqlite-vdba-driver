/**
 * @classdesc An engine to perform INSERT's.
 * @class vdba.sqlite.InsertEngine
 * @private
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 */
function InsertEngine(cx) {
  InsertEngine.super_.call(this, cx);
}

util.inherits(InsertEngine, SQLEngine);

/**
 * Inserts one or several rows into the table.
 *
 * @name insert
 * @function
 * @memberof vdba.sqlite.SQLiteTable#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Object|Object[]} rows          The row(s) to insert.
 * @param {Object} [options]              The insert options: id (Boolean).
 * @param {Function} [callback]           The function to call: fn(error, id).
 */
InsertEngine.prototype.insert = function insert(table, rows, options, callback) {
  //(1) pre: arguments
  if (arguments.length == 3 && arguments[2] instanceof Function) {
    callback = arguments[2];
    options = undefined;
  }

  if (!table) throw new Error("Table expected.");
  if (!rows) throw new Error("Row(s) expected.");
  if (!options) options = {};
  if (options.id && !callback) throw new Error("Callback expected.");

  //(2) insert
  if (rows instanceof Array) this.insertRows(table, rows, options, callback);
  else this.insertRow(table, rows, options, callback);
};

/**
 * @private
 */
InsertEngine.prototype.insertRow = function insertRow(table, row, options, callback) {
  var self = this, sql, cols, vals, params;

  //(1) build sql
  cols = vals = "";
  params = [];

  for (var i = 0, names = Object.keys(row); i < names.length; ++i) {
    var col = table.columns[names[i]];
    var val = row[col.name];

    cols += (i === 0 ? "" : ", ") + col.name;
    vals += (i === 0 ? "" : ", ") + "?";

    if (col.isSet()) {
      if (val === undefined) val = null;
      else if (val) val = JSON.stringify(val);
    }

    params.push(val);
  }

  sql = "INSERT INTO " + table.sqlQN + "(" + cols + ") VALUES(" + vals + ")";

  //(2) insert
  if (!options.id) {
    this.runp(sql, params, callback);
  } else {
    this.runp(sql, params, function(error)  {
      if (error) return callback(error);

      self.findOne("SELECT last_insert_rowid() as id", function(error, row) {
        if (error) callback(error);
        else callback(undefined, row.id);
      });
    });
  }
};

/**
 * @private
 */
InsertEngine.prototype.insertRows = function insertRows(table, rows, options, callback) {
  var self = this, i;

  function insert() {
    if (i < rows.length) {
      self.insertRow(table, rows[i], {}, function(error) {
        if (error) {
          self.rollback(function() {
            if (callback) callback(error);
          });
        } else {
          ++i;
          insert();
        }
      });
    } else {
      self.commit(callback);
    }
  }

  if (rows.length > 0) {
    i = 0;
    this.begin(insert);
  } else {
    if (callback) callback();
  }
};