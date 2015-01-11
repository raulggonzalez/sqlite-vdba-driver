/**
 * @classdesc A converter.
 * @class vdba.sqlite.Converter
 */
function Converter() {

}

Converter.converter = new Converter();

/**
 * Casts the specified columns to their types.
 *
 * @name cast
 * @function
 * @memberof vdba.sqlite.Converter#
 *
 * @param {vdba.sqlite.SQLiteResult|Object} object  The object to cast.
 * @param {Object} columns                          The columns to cast.
 *
 * @returns {Object} The same object to cast.
 */
Converter.prototype.cast = function cast(object, columns) {
  //(1) pre: arguments
  if (!object) throw new Error("Object to cast expected.");
  if (!columns) throw new Error("Columns expected.");

  //(2) cast
  if (object instanceof vdba.Result) this.castResult(object, columns);
  else this.castRow(object, columns);

  //(3) return
  return object;
};

/**
 * @private
 */
Converter.prototype.castRow = function castRow(row, columns) {
  for (var i = 0, colNames = Object.keys(columns); i < colNames.length; ++i) {
    var col = columns[colNames[i]];

    if (row.hasOwnProperty(col.name)) {
      var curVal, newVal;

      curVal = row[col.name];

      if (col.type == "boolean") newVal = Boolean(curVal);
      else if (col.type == "date") newVal = new Date(curVal);
      else if (col.type == "datetime") newVal = new Date(curVal);
      else if (col.type == "integer") newVal = parseInt(curVal);
      else if (col.type == "real") newVal = parseFloat(curVal);
      else if (col.type == "set<integer>") newVal = parseIntegerSet(curVal);
      else if (col.type == "set<text>") newVal = parseTextSet(curVal);
      else if (col.type == "text") newVal = String(curVal);
      else if (col.type == "time") newVal = new Date(curVal);
      else newVal = curVal;

      row[col.name] = newVal;
    }
  }

  //helper functions
  function parseIntegerSet(value) {
    return (value === undefined ? undefined : JSON.parse(value));
  }

  function parseTextSet(value) {
    //(1) prepare to cast


    //(2) return
    return (value === undefined ? undefined : JSON.parse(value));
  }
};

/**
 * @private
 */
Converter.prototype.castResult = function castResult(result, columns) {
  for (var i = 0; i < result.length; ++i) {
    this.castRow(result.rows[i], columns);
  }
};