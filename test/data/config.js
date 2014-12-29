exports.driver = {
  name: "SQLite"
};

exports.connection = {
  config: {
    file: "./test/data/db/vdba.db",
    database: "main",
    mode: "readwrite",
    create: true
  }
};

exports.database = {
  user: {
    name: "User",
    columns: {
      userId: {type: "serial", pk: true},
      username: {type: "text", unique: true, nullable: false},
      password: {type: "text", nullable: false}
    }
  },

  session: {
    name: "Session",
    columns: {
      sessionId: {type: "serial", pk: true},
      userId: {type: "int", nullable: false}
    }
  }
};