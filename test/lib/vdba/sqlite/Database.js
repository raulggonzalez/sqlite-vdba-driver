describe("vdba.sqlite.SQLiteDatabase", function() {
  var user = config.database.user;
  var drv, cx, db;

  before(function() {
    drv = vdba.Driver.getDriver(config.driver.name);
  });

  beforeEach(function(done) {
    drv.openConnection(config.connection.config, function(error, con) {
      cx = con;
      db = cx.database;
      done();
    });
  });

  afterEach(function(done) {
    cx.close(done);
  });

  describe("Properties", function() {
    it("connection", function() {
      cx.database.connection.should.be.exactly(cx);
    });

    it("name", function() {
      cx.database.name.should.be.eql("main");
    });
  });

  describe("#createTable()", function() {
    afterEach(function(done) {
      cx.native.run("DROP TABLE IF EXISTS " + user.name, done);
    });

    describe("Error handling", function() {
      it("createTable(name)", function() {
        (function() {
          db.createTable(user.name);
        }).should.throwError("Table columns expected.");
      });

      it("createTable(name, {})", function() {
        (function() {
          db.createTable(user.name, {});
        }).should.throwError("Table columns expected.");
      });
    });
  });
});