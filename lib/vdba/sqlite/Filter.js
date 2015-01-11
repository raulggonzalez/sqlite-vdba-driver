/**
 * @classdesc A filter.
 * @class vdba.sqlite.Filter
 * @protected
 */
function Filter(filter) {
  /**
   * The filter object.
   *
   * @name filter
   * @type {Object}
   * @memberof vdba.sqlite.Filter#
   */
  Object.defineProperty(this, "filter", {value: filter});
}

/**
 * Parses and returns a filter.
 *
 * @name parse
 * @function
 * @memberof vdba.sqlite.Filter
 */
Filter.parse = function parse(filter) {
  return new Filter(filter);
};