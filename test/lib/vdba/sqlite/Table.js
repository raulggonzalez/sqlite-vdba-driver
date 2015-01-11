describe("vdba.sqlite.SQLiteTable", function() {
  var user = config.database.user;
  var drv, cx, db, tbl;

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

  beforeEach(function(done) {
    db.createTable(user.schema, user.name, user.columns, done);
  });

  beforeEach(function(done) {
    db.findTable(user.schema, user.name, function(error, tab) {
      tbl = tab;
      done();
    });
  });

  afterEach(function(done) {
    db.dropTable(user.schema, user.name, done);
  });

  afterEach(function(done) {
    cx.close(done);
  });

  describe("DML", function() {
    describe("#insert()", function() {
      var row;

      before(function() {
        row = user.rowsWithId[0];
      });

      describe("Error handling", function() {
        it("insert(row, {id: true})", function() {
          (function() {
            tbl.insert(row, {id: true});
          }).should.throwError("Callback expected.");
        });
      });

      it("insert(row, {id: true}, callback)", function(done) {
        tbl.insert(row, {id: true}, function(error, id) {
          should.assert(error === undefined);
          id.should.be.eql(row.userId);
          done();
        });
      });
    });
  });
});