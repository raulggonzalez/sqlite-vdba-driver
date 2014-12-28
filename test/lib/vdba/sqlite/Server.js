describe("vdba.sqlite.SQLiteServer", function() {
  var drv, cx;

  before(function() {
    drv = vdba.Driver.getDriver(config.driver.name);
  });

  before(function(done) {
    drv.openConnection(config.connection.config, function(error, con) {
      cx = con;
      done();
    });
  });

  after(function(done) {
    cx.close(done);
  });

  describe("Properties", function() {
    it("connection", function() {
      cx.server.connection.should.be.exactly(cx);
    });

    it("host", function() {
      cx.server.host.should.be.eql("localhost");
    });

    it("port", function() {
      should.assert(cx.server.port === undefined);
    });

    it("version", function() {
      cx.server.version.should.be.instanceOf(String);
      cx.server.version.should.match(/^\d+\.\d+\.\d+\.\d+/);
    });
  });
});