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
  if (query.isAggregate()) this.runSimpleAggQuery(query, callback);
  else this.runSimpleNonAggQuery(query, callback);
};

/**
 * @private
 */
SelectEngine.prototype.runSimpleNonAggQuery = function runSimpleNonAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter;

  //(1) build sql
  sql = "SELECT * " + this.buildSimpleFrom(query);

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
SelectEngine.prototype.runSimpleAggQuery = function runSimpleAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter, params = [];

  //(1) build sql
  sql = this.buildAggSelect(query) + " " + this.buildSimpleFrom(query);

  expr = this.filterFormatter.format(query.filterBy);
  params = params.concat(expr.parameters);
  sql += " WHERE " + expr.expression;

  sql += " " + this.buildGroupBy(query);
  if (query.groupBy.hasFilter()) {
    expr = this.filterFormatter.format(query.groupBy.filter);
    sql += " HAVING " + expr.expression;
    params = params.concat(expr.parameters);
  }

  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, params, function(error, result) {
    if (error) callback(error);
    else callback(undefined, adapter.adapt(result, query));
  });
};

/**
 * @private
 */
SelectEngine.prototype.buildSimpleFrom = function buildSimpleFrom(query) {
  return "FROM " + query.source.sqlQN;
};

/**
 * @private
 */
SelectEngine.prototype.runMultiTableQuery = function runMultiTableQuery(query, callback) {
  var self = this, join;

  join = query.joins[0];

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
    if (query.isAggregate()) this.runMultiTableAggQuery(query, callback);
    else this.runMultiTableNonAggQuery(query, callback);
  }
};

/**
 * @private
 */
SelectEngine.prototype.runMultiTableNonAggQuery = function runMultiTableNonAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter;

  //(1) build sql
  sql = "SELECT * " + this.buildMultiTableFrom(query);

  expr = this.filterFormatter.format(query.filterBy);
  sql += " WHERE " + expr.expression;

  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, expr.parameters, function(error, result) {
    if (error) {
      callback(error);
    } else {
      adapter.adapt(result, query);
      callback(undefined, result);
    }
  });
};

/**
 * @private
 */
SelectEngine.prototype.runMultiTableAggQuery = function runMultiTableAggQuery(query, callback) {
  var sql, expr, adapter = vdba.sqlite.Adapter.adapter, params = [];

  //(1) build sql
  sql = this.buildAggSelect(query) + " " + this.buildMultiTableFrom(query);

  expr = this.filterFormatter.format(query.filterBy);
  params = params.concat(expr.parameters);
  sql += " WHERE " + expr.expression;

  sql += " " + this.buildGroupBy(query);
  if (query.groupBy.hasFilter()) {
    expr = this.filterFormatter.format(query.groupBy.filter);
    sql += " HAVING " + expr.expression;
    params = params.concat(expr.parameters);
  }

  if (query.hasOrderBy()) sql += " " + this.buildOrderBy(query);
  if (query.hasLimit()) sql += " " + this.buildLimit(query);

  //(2) find
  this.findp(sql, params, function(error, result) {
    if (error) {
      callback(error);
    } else {
      adapter.adapt(result, query);
      callback(undefined, result);
    }
  });
};

/**
 * @private
 */
SelectEngine.prototype.buildMultiTableFrom = function buildMultiTableFrom(query) {
  var from, src, tgt, srcCol, tgtCol;

  //(1) prepare
  src = query.source;
  srcCol = query.joins[0].sourceColumn;
  tgt = query.joins[0].target;
  tgtCol = query.joins[0].targetColumn;

  //(2) build
  from = util.format(
    "FROM %s INNER JOIN %s ON %s.%s = %s.%s",
    src.sqlQN, tgt.sqlQN,
    src.sqlQN, srcCol,
    tgt.sqlQN, tgtCol
  );

  //(3) return
  return from;
};

/**
 * @private
 */
SelectEngine.prototype.buildAggSelect = function buildAggSelect(query) {
  var sql, i, cols, aggs, col;

  //(1) build
  sql = "SELECT";

  //grouping columns
  for (i = 0, cols = query.groupBy.columns; i < cols.length; ++i) {
    col = cols[i];
    var tbl = query.getTableOf(col);

    sql += (i === 0 ? " " :  ", ") + util.format("%s.%s", tbl.sqlQN, col);
  }

  //aggregation results
  for (i = 0, aggs = query.groupBy.aggregations; i < aggs.length; ++i) {
    var agg = aggs[i];
    col = agg.column;
    var alias = agg.alias;

    if (agg.name == "count") {
      sql += util.format(", count(%s) as %s", col, alias);
    } else if (agg.name == "sum") {
      sql += util.format(", sum(%s) as %s", col, alias);
    } else if (agg.name == "avg") {
      sql += util.format(", avg(%s) as %s", col, alias);
    } else if (agg.name == "min") {
      sql += util.format(", min(%s) as %s", col, alias);
    } else if (agg.name == "max") {
      sql += util.format(", max(%s) as %s", col, alias);
    }
  }

  //(2) return
  return sql;
};

/**
 * @private
 */
SelectEngine.prototype.buildGroupBy = function buildGroupBy(query) {
  var sql;

  //(1) build
  sql = "GROUP BY";

  for (var i = 0, cols = query.groupBy.columns; i < cols.length; ++i) {
    var col = cols[i];
    var tbl = query.getTableOf(col);

    sql += (i === 0 ? " " : ", ") + util.format("%s.%s", tbl.sqlQN, col);
  }

  //(2) return
  return sql;
};