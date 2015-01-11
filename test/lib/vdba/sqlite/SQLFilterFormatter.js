
describe("vdba.sqlite.SQLFilterFormatter", function() {
  var formatter, params;

  before(function() {
    formatter = new vdba.sqlite.SQLFilterFormatter("?");
  });

  beforeEach(function() {
    params = [];
  });

  describe("#$eq()", function() {
    it("$eq(col, string, params)", function() {
      formatter.$eq("name", "elvis", params).should.be.eql("name = ?");
      params.should.be.eql(["elvis"]);
    });

    it("$eq(col, int, params)", function() {
      formatter.$eq("age", 39, params).should.be.eql("age = ?");
      params.should.be.eql([39]);
    });

    it("$eq(col, null, params)", function() {
      formatter.$eq("name", null, params).should.be.eql("name is null");
      params.should.be.eql([]);
    });
  });

  describe("#$ne()", function() {
    it("$ne(col, string, params)", function() {
      formatter.$ne("name", "elvis", params).should.be.eql("name <> ?");
      params.should.be.eql(["elvis"]);
    });

    it("$ne(col, int, params)", function() {
      formatter.$ne("age", 39, params).should.be.eql("age <> ?");
      params.should.be.eql([39]);
    });

    it("$ne(col, null, params)", function() {
      formatter.$ne("name", null, params).should.be.eql("name is not null");
      params.should.be.eql([]);
    });
  });

  describe("#$gt()", function() {
    it("$gt(col, string, params)", function() {
      formatter.$gt("name", "elvis", params).should.be.eql("name > ?");
      params.should.be.eql(["elvis"]);
    });

    it("$gt(col, int, params)", function() {
      formatter.$gt("age", 39, params).should.be.eql("age > ?");
      params.should.be.eql([39]);
    });
  });

  describe("#$ge()", function() {
    it("$ge(col, string, params)", function() {
      formatter.$ge("name", "elvis", params).should.be.eql("name >= ?");
      params.should.be.eql(["elvis"]);
    });

    it("$ge(col, int, params)", function() {
      formatter.$ge("age", 39, params).should.be.eql("age >= ?");
      params.should.be.eql([39]);
    });
  });

  describe("#$lt()", function() {
    it("$lt(col, string, params)", function() {
      formatter.$lt("name", "elvis", params).should.be.eql("name < ?");
      params.should.be.eql(["elvis"]);
    });

    it("$lt(col, int, params)", function() {
      formatter.$lt("age", 39, params).should.be.eql("age < ?");
      params.should.be.eql([39]);
    });
  });

  describe("#$le()", function() {
    it("$le(col, string, params)", function() {
      formatter.$le("name", "elvis", params).should.be.eql("name <= ?");
      params.should.be.eql(["elvis"]);
    });

    it("$le(col, int, params)", function() {
      formatter.$le("age", 39, params).should.be.eql("age <= ?");
      params.should.be.eql([39]);
    });
  });

  describe("#$like()", function() {
    it("$like(col, string, params)", function() {
      formatter.$like("name", "%elvis%", params).should.be.eql("name like ?");
      params.should.be.eql(["%elvis%"]);
    });
  });

  describe("#$notLike()", function() {
    it("$notLike(col, string, params)", function() {
      formatter.$notLike("name", "%elvis%", params).should.be.eql("name not like ?");
      params.should.be.eql(["%elvis%"]);
    });
  });

  describe("#$in()", function() {
    it("$in(col, [], params)", function() {
      formatter.$in("name", [], params).should.be.eql("name in ()");
      params.should.be.eql([]);
    });

    it("$in(col, array, params)", function() {
      formatter.$in("name", ["elvis", "costello"], params).should.be.eql("name in (?, ?)");
      params.should.be.eql(["elvis", "costello"]);
    });
  });

  describe("#$notIn()", function() {
    it("$notIn(col, [], params)", function() {
      formatter.$notIn("name", [], params).should.be.eql("name not in ()");
      params.should.be.eql([]);
    });

    it("$notIn(col, array, params)", function() {
      formatter.$notIn("name", ["elvis", "costello"], params).should.be.eql("name not in (?, ?)");
      params.should.be.eql(["elvis", "costello"]);
    });
  });

  describe("#format()", function() {
    describe("Simple", function() {
      it("format({col: value})", function() {
        var res = formatter.format({name: "elvis"});
        res.should.be.eql({expression: "(name = ?)", parameters: ["elvis"]});
      });

      it("format({col: {$eq: value}})", function() {
        var res = formatter.format({name: {$eq: "elvis"}});
        res.should.be.eql({expression: "(name = ?)", parameters: ["elvis"]});
      });

      it("format({col: {$ne: value}})", function() {
        var res = formatter.format({name: {$ne: "elvis"}});
        res.should.be.eql({expression: "(name <> ?)", parameters: ["elvis"]});
      });

      it("format({col: {$gt: value}})", function() {
        var res = formatter.format({name: {$gt: "elvis"}});
        res.should.be.eql({expression: "(name > ?)", parameters: ["elvis"]});
      });

      it("format({col: {$ge: value}})", function() {
        var res = formatter.format({name: {$ge: "elvis"}});
        res.should.be.eql({expression: "(name >= ?)", parameters: ["elvis"]});
      });

      it("format({col: {$lt: value}})", function() {
        var res = formatter.format({name: {$lt: "elvis"}});
        res.should.be.eql({expression: "(name < ?)", parameters: ["elvis"]});
      });

      it("format({col: {$le: value}})", function() {
        var res = formatter.format({name: {$le: "elvis"}});
        res.should.be.eql({expression: "(name <= ?)", parameters: ["elvis"]});
      });

      it("format({col: {$like: value}})", function() {
        var res = formatter.format({name: {$like:"%elvis%"}});
        res.should.be.eql({expression: "(name like ?)", parameters: ["%elvis%"]});
      });

      it("format({col: {$notLike: value}})", function() {
        var res = formatter.format({name: {$notLike: "%elvis%"}});
        res.should.be.eql({expression: "(name not like ?)", parameters: ["%elvis%"]});
      });

      it("format({col: {$in: value}})", function() {
        var res = formatter.format({name: {$in: ["elvis", "costello"]}});
        res.should.be.eql({expression: "(name in (?, ?))", parameters: ["elvis", "costello"]});
      });

      it("format({col: {$notIn: value}})", function() {
        var res = formatter.format({name: {$notIn: ["elvis", "costello"]}});
        res.should.be.eql({expression: "(name not in (?, ?))", parameters: ["elvis", "costello"]});
      });
    });

    describe("Compound", function() {
      it("format({col: value, col: value})", function() {
        var res = formatter.format({first: "elvis", last: "costello"});
        res.should.be.eql({expression: "(first = ?) and (last = ?)", parameters: ["elvis", "costello"]});
      });

      it("format({col: {$eq: value}, col: {$ne: value}})", function() {
        var res = formatter.format({first: {$eq: "elvis"}, last: {$ne: "costello"}});
        res.should.be.eql({expression: "(first = ?) and (last <> ?)", parameters: ["elvis", "costello"]});
      });
    });
  });
});