/**
 * @classdesc An engine to perform UPDATE's.
 * @class vdba.sqlite.UpdateEngine
 * @private
 *
 * @param {vdba.sqlite.SQLiteConnection} cx The connection to use.
 */
function UpdateEngine(cx) {
  UpdateEngine.super_.call(this, cx);
}

util.inherits(UpdateEngine, SQLEngine);

/**
 * Updates zero, one or several rows.
 *
 * @name update
 * @function
 * @memberof vdba.sqlite.UpdateEngine#
 *
 * @param {vdba.sqlite.SQLiteTable} table The table.
 * @param {Object} [filter]               The filter.
 * @param {Object} columns                The columns to update.
 * @param {Object} [options]              The update options.
 * @param {Function} [callback]           The function to call: fn(error).
 */
UpdateEngine.prototype.update = function update(table, filter, columns, options, callback) {
  var sql, expr, params;

  //(1) pre: arguments
  if (arguments.length == 2) {
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
      filter = columns = options = undefined;
    } else {
      columns = arguments[1];
      filter = options = callback = undefined;
    }
  } else if (arguments.length == 3 && arguments[2] instanceof Function) {
    callback = arguments[2];
    columns = arguments[1];
    filter = options = undefined;
  } else if (arguments.length == 4 && arguments[3] instanceof Function) {
    callback = arguments[3];
    options = undefined;
  }

  if (!table) throw new Error("Table expected.");
  if (!filter) filter = {};
  if (!columns) throw new Error("Column(s) to update expected.");
  if (!options) options = {};

  //(2) build sql
  sql = "UPDATE " + table.sqlQN + " SET ";
  params = [];

  for (var i = 0, names = Object.keys(columns); i < names.length; ++i) {
    var col = names[i];
    sql += (i === 0 ? "" : ", ") + buildColumnUpdate(table.columns[col], columns[col], params);
  }

  expr = this.filterFormatter.format(filter);
  sql += " WHERE " + expr.expression;

  //(3) update
  this.runp(sql, params.concat(expr.parameters), callback);
};

/**
 * @private
 */
function buildColumnUpdate(col, val, params) {
  var sql;

  if (col.isSetOfIntegers()) {
    sql = buildSetOfIntegersUpdate(col, val, params);
  } else if (col.isSetOfTexts()) {
    sql = buildSetOfTextsUpdate(col, val, params);
  } else if (col.isInteger()) {
    sql = buildIntegerUpdate(col, val, params);
  } else if (col.isReal()) {
    sql = buildRealUpdate(col, val, params);
  } else if (col.isText()) {
    sql = buildTextUpdate(col, val, params);
  } else {
    sql = col.name + " = ?";
    params.push(val);
  }

  return sql;
}

function buildIntegerUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (typeof(val) != "object") {
    op = "$set";
    val = parseInt(val);
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    sql = util.format("%s = ?", col.name);
    params.push(val);
  } else if (op == "$inc" || op == "$add") {
    sql = util.format("%s = %s + ?", col.name, col.name);
    params.push(val);
  } else if (op == "$dec") {
    sql = util.format("%s = %s - ?", col.name, col.name);
    params.push(val);
  } else if (op == "$mul") {
    sql = util.format("%s = cast(%s * ? as integer)", col.name, col.name);
    params.push(val);
  }

  //(3) return
  return sql;
}

function buildRealUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (typeof(val) != "object") {
    op = "$set";
    val = parseFloat(val);
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    sql = util.format("%s = ?", col.name);
    params.push(val);
  } else if (op == "$inc" || op == "$add") {
    sql = util.format("%s = %s + ?", col.name, col.name);
    params.push(val);
  } else if (op == "$dec") {
    sql = util.format("%s = %s - ?", col.name, col.name);
    params.push(val);
  } else if (op == "$mul") {
    sql = util.format("%s = cast(%s * ? as real)", col.name, col.name);
    params.push(val);
  }

  //(3) return
  return sql;
}

function buildTextUpdate(col, val, params) {
 var sql, op;

 //(1) determine op
 if (val === undefined || val === null) {
   op = "$set";
   val = null;
 } else if (typeof(val) != "object") {
   op = "$set";
   val = val.toString();
 } else {
   op = Object.keys(val)[0];
   val = val[op];
 }

 //(2) build sql
 if (op == "$set") {
   sql = util.format("%s = ?", col.name);
   params.push(val);
 } else if (op == "$add") {
   sql = util.format("%s = %s || ?", col.name, col.name);
   params.push(val);
 }

 //(3) return
 return sql;
}

function buildSetOfIntegersUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (val instanceof Array) {
    op = "$set";
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    if (val === undefined || val === null) val = null;
    else if (!(val instanceof Array)) val = [val];

    sql = col.name + " = ?";
    params.push(JSON.stringify(val));
  } else if (op == "$add") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null or %s = '[]' or %s = '[%d]' THEN '[%d]'" +
      " WHEN instr(%s, '[%d,') > 0 or instr(%s, ',%d,') > 0 or instr(%s, ',%d]') > 0 THEN %s" +
      " ELSE substr(%s, 0, length(%s)) || ',%d]' END)",
      col.name,
      col.name, col.name, col.name, val, val,
      col.name, val, col.name, val, col.name, val, col.name,
      col.name, col.name, val
    );
  } else if (op == "$del") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null THEN null" +
      " WHEN %s = '[]' THEN '[]'" +
      " WHEN %s = '[%d]' THEN '[]'" +
      " WHEN instr(%s, '[%d,') > 0 THEN replace(%s, '[%d,', '[')" +
      " WHEN instr(%s, ',%d,') > 0 THEN replace(%s, ',%d,', ',')" +
      " WHEN instr(%s, ',%d]') > 0 THEN replace(%s, ',%d]', ']')" +
      " ELSE %s END)",
      col.name,
      col.name,
      col.name,
      col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name
    );
  }

  //(3) return
  return sql;
}

function buildSetOfTextsUpdate(col, val, params) {
  var sql, op;

  //(1) determine op
  if (val === undefined || val === null) {
    op = "$set";
    val = null;
  } else if (val instanceof Array) {
    op = "$set";
  } else {
    op = Object.keys(val)[0];
    val = val[op];
  }

  //(2) build sql
  if (op == "$set") {
    if (val === undefined || val === null) val = null;
    else if (!(val instanceof Array)) val = [val];

    sql = col.name + " = ?";
    params.push(JSON.stringify(val));
  } else if (op == "$add") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null or %s = '[]' or %s = '[\"%s\"]' THEN '[\"%s\"]'" +
      " WHEN instr(%s, '[\"%s\",') > 0 or instr(%s, ',\"%s\",') > 0 or instr(%s, ',\"%s\"]') > 0 THEN %s" +
      " ELSE substr(%s, 0, length(%s)) || ',\"%s\"]' END)",
      col.name,
      col.name, col.name, col.name, val, val,
      col.name, val, col.name, val, col.name, val, col.name,
      col.name, col.name, val
    );
  } else if (op == "$del") {
    if (val === undefined) val = null;

    sql = util.format(
      "%s = " +
      "(CASE" +
      " WHEN %s is null THEN null" +
      " WHEN %s = '[]' THEN '[]'" +
      " WHEN %s = '[\"%s\"]' THEN '[]'" +
      " WHEN instr(%s, '[\"%s\",') > 0 THEN replace(%s, '[\"%s\",', '[')" +
      " WHEN instr(%s, ',\"%s\",') > 0 THEN replace(%s, ',\"%s\",', ',')" +
      " WHEN instr(%s, ',\"%s\"]') > 0 THEN replace(%s, ',\"%s\"]', ']')" +
      " ELSE %s END)",
      col.name,
      col.name,
      col.name,
      col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name, val, col.name, val,
      col.name
    );
  }

  //(3) return
  return sql;
}