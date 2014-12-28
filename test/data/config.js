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