exports.driver = {
  name: "SQLite"
};

exports.connection = {
  config: {
    database: "./test/data/vdba.db",
    mode: "readwrite",
    create: true
  }
};