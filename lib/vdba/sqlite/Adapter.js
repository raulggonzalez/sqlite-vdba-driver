/**
 * @classdesc A result adapter to VDBA.
 * @class vdba.sqlite.Adapter
 * @protected
 */
function Adapter() {

}

Adapter.adapter = new Adapter();

/**
 * Adapts the result to the query.
 *
 * @name adapt
 * @function
 * @memberof vdba.sqlite.Adapter#
 * @protected
 *
 * @param {Object|vdba.Result} object     The object to adapt.
 * @param {vdba.sqlite.SQLiteQuery} query The root query.
 *
 * @returns {Object} The same object for chainning if needed.
 */
Adapter.prototype.adapt = function adapt(object, query) {
  if (object instanceof vdba.Result) return this.adaptResult(object, query);
  else return this.adaptRow(object, query);
};

/**
 * @private
 */
Adapter.prototype.adaptRow = function adaptRow(row, query) {
  var converter = vdba.sqlite.Converter.converter;

  if (row) {
    var tbl = query.source;

    if (tbl.hasAdaptableColumns()) converter.cast(row, tbl.adaptableColumns);
  }

  return row;
};

/**
 * @private
 */
Adapter.prototype.adaptResult = function adaptResult(result, query) {
  if (query.isSimple()) return this.adaptSimple(result, query);
  else return this.adaptMultiTable(result, query);
};

/**
 * @private
 */
Adapter.prototype.adaptSimple = function adaptSimple(result, query) {
  var tbl = query.source, converter = vdba.sqlite.Converter.converter;

  //(1) adapt
  if (tbl.hasAdaptableColumns()) converter.cast(result, tbl.adaptableColumns);

  //(2) return
  return result;
};

/**
 * @private
 */
Adapter.prototype.adaptMultiTable = function adaptMultiTable(result, query) {
  var src, join, tgt, cols, agg, converter = vdba.sqlite.Converter.converter;

  //(1) prepare
  src = query.source;
  join = query.joins[0];
  tgt = join.target;
  cols = {};
  agg = vdba.Aggregator.aggregator;

  //(2) adapt simple columns
  if (src.hasAdaptableColumns()) cols = util._extend(cols, src.adaptableColumns);
  if (tgt.hasAdaptableColumns()) cols = util._extend(cols, tgt.adaptableColumns);
  converter.cast(result, cols);

  //(3) adapt joins
  if (join.mode == "1-1") {
    //determine columns to transform
    if (join.sourceColumn == join.targetColumn) {
      cols = {};
      for (var i = 0, colNames = tgt.columnNames; i < colNames.length; ++i) cols[colNames[i]] = true;
      cols[join.sourceColumn] = false;
    } else {
      cols = tgt.columnNames;
    }

    //transform
    agg.transform(result, cols, tgt.name);
  }

  //(4) return
  return result;
};