describe("vdba.Driver", function() {
  var drv;

  before(function() {
    drv = vdba.Driver.getDriver(config.driver.name);
  });

  describe("#createConnection()", function() {
    describe("Error handling", function() {
      it("createConnection({})", function() {
        (function() {
          drv.createConnection({});
        }).should.throwError("Database file expected.");
      });

      it("createConnection({file: undefined})", function() {
        (function() {
          drv.createConnection({file: undefined});
        }).should.throwError("Database file expected.");
      });

      it("createConnection({file: 'file.db', mode: 'unknown'})", function() {
        (function() {
          drv.createConnection({file: config.connection.config.file, mode: "unknown"});
        }).should.throwError("Unknown open mode: unknown.");
      });
    });
  });
});