/**
 * @classdesc An engine to perform SELECT's.
 * @class vdba.sqlite.SelectEngine
 * @private
 *
 * @param {vdba.Connection} cx  The connection to use.
 */
function SelectEngine(cx) {
  SelectEngine.super_.call(this, cx);
}

util.inherits(SelectEngine, SQLEngine);

/**
 * Returns the ORDER BY clause.
 *
 * @name buildOrderBy
 * @function
 * @memberof vdba.sqlite.SQLiteQuery#
 * @private
 *
 * @param {vdba.Query} query  The query.
 *
 * @returns {String}
 */
SelectEngine.prototype.buildOrderBy = function buildOrderBy(query) {
  var sql;

  //(1) build clause
  sql = "ORDER BY ";

  for (var i = 0, cols = Object.keys(query.orderBy); i < cols.length; ++i) {
    var name = cols[i];
    var mode = query.orderBy[name];

    sql += (i === 0 ? "" : ", ") + name + " " + mode;
  }

  //(2) return
  return sql;
};

/**
 * Returns the LIMIT clause.
 *
 * @name buildLimit
 * @function
 * @memberof vdba.sqlite.SQLiteQuery#
 * @private
 *
 * @param {vdba.Query} query  The query.
 *
 * @returns {String}
 */
SelectEngine.prototype.buildLimit = function buildLimit(query) {
  return "LIMIT " + query.limitTo.count + " OFFSET " + query.limitTo.start;
};

/**
 * Returns the number of rows that the table has.
 *
 * @name count
 * @function
 * @memberof vdba.sqlite.SelectEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table to count.
 * @param {Function} callback             The function to call: fn(error, count).
 */
SelectEngine.prototype.count = function count(table, callback) {
  var sql;

  //(1) pre: arguments
  if (!table) throw new Error("Table expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) build sql
  sql = "SELECT count(*) as count FROM " + table.sqlQN;

  //(2) count
  this.findOne(sql, function(error, row) {
    if (error) callback(error);
    else callback(undefined, row.count);
  });
};

/**
 * Runs the query.
 *
 * @name findQuery
 * @function
 * @memberof vdba.sqlite.SQLiteQuery#
 *
 * @param {vdba.Query} query  The query.
 * @param {Function} callback The function to call: fn(error, result).
 */
SelectEngine.prototype.runQuery = function findQuery(query, callback) {
  //(1) pre: arguments
  if (!query) throw new Error("Query expected.");
  if (!callback) throw new Error("Callback expected.");

  //(2) find
  if (query.isMultiTable()) this.runMultiTableQuery(query, callback);
  else this.runSimpleQuery(query, callback);
};

/**
 * @private
 */
SelectEngine.prototype.runSimpleQuery = function runSimpleQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter;

  //(1) build sql
  sql = "SELECT * FROM " + query.source.sqlQN;
  expr = this.filterFormatter.format(query.filterBy);
  sql += " WHERE " + expr.expression;
  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, expr.parameters, function(error, result) {
    if (error) callback(error);
    else callback(undefined, adapter.adapt(result, query));
  });
};

/**
 * @private
 */
SelectEngine.prototype.runMultiTableQuery = function runMultiTableQuery(query, callback) {
  var self = this, join = query.joins[0], adapter = vdba.sqlite.Adapter.adapter;

  //if target has been specified, we have to find the table
  if (typeof(join.target) == "string") {
    var schema, table, name = join.target, dot = name.indexOf(".");

    if (dot < 0) {
      schema = query.source.schema.name;
      table = name;
    } else {
      schema = name.substr(0, dot);
      table = name.substr(dot+1);
    }

    query.source.database.findTable(schema, table, function(error, tbl) {
      if (error) {
        callback(error);
      } else {
        if (!tbl) {
          callback(new Error("Target table doesn't exist: " + schema + "." + table  + "."));
        } else {
          join.target = tbl;
          self.runMultiTableQuery(query, callback);
        }
      }
    });
  } else {  //if target is a table object, then we can run the SQL command
    var sql, expr;

    //build sql
    sql = "SELECT * " +
          "FROM " + query.source.sqlQN + " as Src INNER JOIN " + join.target.sqlQN + " as Tgt " +
          "ON Src." + join.sourceColumn + " = Tgt." + join.targetColumn;
    expr = this.filterFormatter.format(query.filterBy);
    sql += " WHERE " + expr.expression;
    if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
    if (query.hasLimit()) sql += " " + this.buildLimit(query);

    //find
    this.findp(sql, expr.parameters, function(error, result) {
      if (error) {
        callback(error);
      } else {
        adapter.adapt(result, query);
        callback(undefined, result);
      }
    });
  }
};