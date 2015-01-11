/**
 * @classdesc A SQL filter formatter.
 * @class vdba.sqlite.SQLFilterFormatter
 * @protected
 *
 * @param {String} [placeholder]  The placeholder. Default: ?.
 */
function SQLFilterFormatter(placeholder) {
  /**
   * The placeholder.
   *
   * @name placeholder
   * @type {String}
   * @memberof vdba.SQLFilterFormatter#
   */
  Object.defineProperty(this, "placeholder", {value: placeholder, enumerable: true});
}

/**
 * Formats a filter as an SQL expression.
 *
 * @name format
 * @function
 * @memberof vdba.sqlite.SQLFilterFormatter#
 *
 * @param {Object} filter   The filter to format.
 *
 * @returns {Object} An object with two properties: expression and parameters.
 */
SQLFilterFormatter.prototype.format = function format(filter) {
  var sql, params, keys;

  //(1) pre: arguments
  if (!filter) throw new Error("Filter expected.");

  //(2) format
  keys = Object.keys(filter);

  if (keys.length === 0) {
    sql = this.placeholder + " = " + this.placeholder;
    params = [true, true];
  } else {
    sql = "";
    params = [];

    for (var i = 0; i < keys.length; ++i) {
      var col = keys[i];
      sql += (i === 0 ? "" : " and ") + "(" + this.formatItem(col, filter[col], params) + ")";
    }
  }

  //(3) return
  return {expression: sql, parameters: params};
};

/**
 * @private
 */
SQLFilterFormatter.prototype.formatItem = function formatItem(col, val, params) {
  var item;

  //(1) format
  if (typeof(val) != "object") {        //col: value
    item = this.$eq(col, val, params);
  } else {                              //col: {$op: val, $op: val...}
    item = "";

    for (var i = 0, ops = Object.keys(val); i < ops.length; ++i) {
      item += (i === 0 ? "" : " and ") + this.formatOp(ops[i], col, val[ops[i]], params);
    }
  }

  //(2) return
  return item;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.formatOp = function formatOp(op, col, val, params) {
  var res;

  //(1) format
  if (op == "$eq") res = this.$eq(col, val, params);
  else if (op == "$ne") res = this.$ne(col, val, params);
  else if (op == "$lt") res = this.$lt(col, val, params);
  else if (op == "$le") res = this.$le(col, val, params);
  else if (op == "$gt") res = this.$gt(col, val, params);
  else if (op == "$ge") res = this.$ge(col, val, params);
  else if (op == "$like") res = this.$like(col, val, params);
  else if (op == "$notLike") res = this.$notLike(col, val, params);
  else if (op == "$nlike") res = this.$notLike(col, val, params);
  else if (op == "$in") res = this.$in(col, val, params);
  else if (op == "$notIn") res = this.$notIn(col, val, params);
  else if (op == "$nin") res = this.$notIn(col, val, params);
  else if (op == "$contain") res = this.$contain(col, val, params);
  else if (op == "$notContain") res = this.$notContain(col, val, params);
  else if (op == "$ncontain") res = this.$notContain(col, val, params);
  else throw new Error("Unknown operator: " + op + ".");

  //(2) return
  return res;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$eq = function $eq(col, val, params) {
  var res;

  if (val === null || val === undefined) {
    res = col + " is null";
  } else {
    params.push(val);
    res = col + " = " + this.placeholder;
  }

  return res;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$ne = function $ne(col, val, params) {
  var res;

  if (val === null || val === undefined) {
    res = col + " is not null";
  } else {
    params.push(val);
    res = col + " <> " + this.placeholder;
  }

  return res;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$lt = function $lt(col, val, params) {
  params.push(val);
  return col + " < " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$le = function $le(col, val, params) {
  params.push(val);
  return col + " <= " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$gt = function $gt(col, val, params) {
  params.push(val);
  return col + " > " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$ge = function $ge(col, val, params) {
  params.push(val);
  return col + " >= " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$like = function $like(col, val, params) {
  params.push(val);
  return col + " like " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$notLike = function $notLike(col, val, params) {
  params.push(val);
  return col + " not like " + this.placeholder;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$in = function $in(col, vals, params) {
  var expr;

  //(1) format
  expr = col + " in (";

  for (var i = 0; i < vals.length; ++i) {
    params.push(vals[i]);
    expr += (i === 0 ? "" : ", ") + this.placeholder;
  }

  expr += ")";

  //(2) return
  return expr;
};

/**
 * @private
 */
SQLFilterFormatter.prototype.$notIn = function $notIn(col, vals, params) {
  var expr;

  //(1) format
  expr = col + " not in (";

  for (var i = 0; i < vals.length; ++i) {
    params.push(vals[i]);
    expr += (i === 0 ? "" : ", ") + this.placeholder;
  }

  expr += ")";

  //(2) return
  return expr;
};