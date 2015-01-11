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
        }).should.throwError("Database expected.");
      });

      it("createConnection({database: undefined})", function() {
        (function() {
          drv.createConnection({database: undefined});
        }).should.throwError("Database expected.");
      });

      it("createConnection({database: 'file.db', mode: 'unknown'})", function() {
        (function() {
          drv.createConnection({database: config.connection.config.database, mode: "unknown"});
        }).should.throwError("Unknown open mode: unknown.");
      });
    });
  });
});