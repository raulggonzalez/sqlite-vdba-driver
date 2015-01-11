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

exports.database = {
  user: {
    schema: "sec",
    name: "user",
    qn: "sec.user",
    columns: {
      userId: {type: "sequence", pk: true},
      username: {type: "text", uq: true, nullable: false},
      password: {type: "text", nullable: false},
      createDate: {type: "date", nullable: false},
      enabled: {type: "boolean", nullable: false}
    },
    index: {
      name: "ix_user_username",
      columns: "username",
      options: {ifNotExists: true}
    },
    rowsWithId: [
      {userId: 1, username: "user01", password: "pwd01", createDate: new Date("01-02-2015"), enabled: true},
      {userId: 2, username: "user02", password: "pwd02", createDate: new Date("01-02-2015"), enabled: false},
      {userId: 3, username: "user03", password: "pwd03", createDate: new Date("01-02-2015"), enabled: true},
      {userId: 4, username: "user04", password: "pwd04", createDate: new Date("01-03-2015"), enabled: true},
      {userId: 5, username: "user05", password: "pwd05", createDate: new Date("01-03-2015"), enabled: false},
      {userId: 6, username: "user11", password: "pwd11", createDate: new Date("01-04-2015"), enabled: true},
      {userId: 7, username: "user12", password: "pwd12", createDate: new Date("01-05-2015"), enabled: true}
    ]
  },

  profile: {
    schema: "sec",
    name: "profile",
    qn: "sec.profile",
    columns: {
      userId: {type: "integer", pk: true, ref: "sec.user.userId"},
      nick: "text",
      emails: {type: "set<text>"}
    },
    rows: [
      {userId: 1, nick: "u01", emails: ["user01@test.com", "u01@test.com", "another@test.com"]},
      {userId: 2, nick: "u02", emails: ["user02@test.com"]},
      {userId: 3, nick: "u03", emails: ["user03@test.com", "u03@test.com"]},
      {userId: 4, nick: "u04", emails: []},
      {userId: 5, nick: "u05", emails: ["user05@test.com", "u05@test.com"]},
      {userId: 6, nick: "u11", emails: ["user11@test.com", "u11@test.com"]},
      {userId: 7, nick: "u12"}
    ]
  },

  session: {
    schema: "sec",
    name: "session",
    qn: "sec.session",
    columns: {
      sessionId: {type: "sequence", pk: true},
      userId: {type: "integer", nullable: false, ref: "sec.user.userId"},
      login: {type: "datetime", nullable: false},
      clickedArticles: {type: "set<integer>"}
    },
    rowsWithId: [
      {sessionId: 1, userId: 1, login: new Date("01-02-2015 08:30"), clickedArticles: [1, 2, 3, 4, 5]},
      {sessionId: 2, userId: 2, login: new Date("01-02-2015 15:35"), clickedArticles: [1]},
      {sessionId: 3, userId: 1, login: new Date("01-03-2015 07:45"), clickedArticles: []},
      {sessionId: 4, userId: 3, login: new Date("01-05-2015 16:23")}
    ]
  }
};

exports.ops = {
  joinUserSession: [
    {userId: 1, username: "user01", password: "pwd01", createDate: new Date("01-02-2015"), enabled: true, sessionId: 1, login: new Date("01-02-2015 08:30"), clickedArticles: [1, 2, 3, 4, 5]},
    {userId: 2, username: "user02", password: "pwd02", createDate: new Date("01-02-2015"), enabled: false, sessionId: 2, login: new Date("01-02-2015 15:35"), clickedArticles: [1]},
    {userId: 1, username: "user01", password: "pwd01", createDate: new Date("01-02-2015"), enabled: true, sessionId: 3, login: new Date("01-03-2015 07:45"), clickedArticles: []},
    {userId: 3, username: "user03", password: "pwd03", createDate: new Date("01-02-2015"), enabled: true, sessionId: 4, login: new Date("01-05-2015 16:23"), clickedArticles: null}
  ],
  joinooUserProfile: [
    {userId: 1, username: "user01", password: "pwd01", createDate: new Date("01-02-2015"), enabled: true, profile: {userId: 1, nick: "u01", emails: ["user01@test.com", "u01@test.com", "another@test.com"]}},
    {userId: 2, username: "user02", password: "pwd02", createDate: new Date("01-02-2015"), enabled: false, profile: {userId: 2, nick: "u02", emails: ["user02@test.com"]}},
    {userId: 3, username: "user03", password: "pwd03", createDate: new Date("01-02-2015"), enabled: true, profile: {userId: 3, nick: "u03", emails: ["user03@test.com", "u03@test.com"]}},
    {userId: 4, username: "user04", password: "pwd04", createDate: new Date("01-03-2015"), enabled: true, profile: {userId: 4, nick: "u04", emails: []}},
    {userId: 5, username: "user05", password: "pwd05", createDate: new Date("01-03-2015"), enabled: false, profile: {userId: 5, nick: "u05", emails: ["user05@test.com", "u05@test.com"]}},
    {userId: 6, username: "user11", password: "pwd11", createDate: new Date("01-04-2015"), enabled: true, profile: {userId: 6, nick: "u11", emails: ["user11@test.com", "u11@test.com"]}},
    {userId: 7, username: "user12", password: "pwd12", createDate: new Date("01-05-2015"), enabled: true, profile: {userId: 7, nick: "u12", emails: null}}
  ]
};