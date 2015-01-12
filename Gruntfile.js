//imports
var child_process = require("child_process");

//Grunt
module.exports = function(grunt) {
  //(1) configure
  grunt.config.init({
    pkg: grunt.file.readJSON("package.json"),

    clean: {
      doc: {
        src: ["doc/api/"]
      },

      test: {
        src: ["test/data/vdba.db"]
      }
    },

    concat: {
      driver: {
        options: {
          banner: "(function() {\n\n",
          footer: "\n\n})();"
        },

        src: ["build/sqlite-api.js", "lib/**"],
        dest: "build/node-vdba-sqlite.js"
      },

      build: {
        options: {
          banner: "/*! <%= pkg.name %> - <%= pkg.version %> (<%= grunt.template.today('yyyy-mm-dd') %>) */\n",
          separator: "\n\n"
        },

        src: ["build/node-vdba-core.js", "build/node-vdba-sqlite.js"],
        dest: "build/sqlite-vdba-driver.js"
      }
    },

    compress: {
      "api.html": {
        options: {
          mode: "zip",
          archive: "doc/api.html.zip",
          level: 3,
        },

        expand: true,
        cwd: "doc/api/",
        src: "**",
      }
    },

    copy: {
      "node-vdba-core.js": {
        src: "../vdba-core/build/node-vdba-core.js",
        dest: "build/node-vdba-core.js"
      }
    },

    jsdoc: {
      "api.html": {
        src: ["build/sqlite-vdba-driver.js"],
        options: {
          recurse: false,
          template: "templates/default",
          destination: "doc/api",
          "private": false
        }
      }
    },

    jshint: {
      grunt: {
        files: {
          src: ["Gruntfile.js"]
        }
      },

      lib: {
        options: {
          jshintrc: true
        },

        files: {
          src: ["lib/**"]
        }
      },

      "sqlite-vdba-driver.js": {
        options: {
          jshintrc: true
        },

        files: {
          src: ["build/sqlite-vdba-driver.js"]
        }
      },

      test: {
        options: {
          ignores: [
            "test/data/**",
            "test/mocha.opts",
            "test/vendor/**",
            "../vdba-driver-validator/test/mocha.opts"
          ]
        },

        files: {
          src: ["test/**", "../vdba-driver-validator/test/**"]
        }
      }
    },

    mochaTest:{
      options: {
        ignoreLeaks: false,
        quiet: false,
        reporter: "dot",
        require: ["should", function() { util = require("util"); }]
      },

      common: {
        src: ["test/init.js", "../vdba-driver-validator/test/common/**/*.js"]
      },

      specific: {
        src: ["test/init.js", "../vdba-driver-validator/test/common/init.js", "test/**/*.js"]
      }
    },

    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> - <%= pkg.version %> (<%= grunt.template.today('yyyy-mm-dd') %>) */",
        mangle: false,
        compress: {
          drop_console: true,
          drop_debugger: true,
          properties: true,
          dead_code: true,
          conditionals: true,
          comparisons: true,
          booleans: true,
          loops: true,
          warnings: true
        },
        preserveComments: false
      },

      node: {
        files: {
          "sqlite-vdba-driver.min.js": ["sqlite-vdba-driver.js"]
        }
      }
    }
  });

  //(2) enable plugins
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-compress");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-jsdoc");
  grunt.loadNpmTasks("grunt-mocha-test");

  //(3) define tasks
  grunt.registerTask("testSpecific", "Specific unit testing", [
    "jshint:lib",
    //"jshint:test",
    "copy:node-vdba-core.js",
    "concat:driver",
    "concat:build",
    //"jshint:sqlite-vdba-driver.js",
    "clean:test",
    "mochaTest:specific"
  ]);

  grunt.registerTask("testCommon", "Common unit testing", [
    "jshint:lib",
    //"jshint:test",
    "copy:node-vdba-core.js",
    "concat:driver",
    "concat:build",
    //"jshint:sqlite-vdba-driver.js",
    "clean:test",
    "mochaTest:common"
  ]);

  grunt.registerTask("api.html.zip", "Generates the API doc.", [
    "clean:doc",
    "jsdoc:api.html",
    "compress:api.html",
    "clean:doc",
  ]);

  grunt.registerTask("default", "All.", [
    "jshint:grunt",
    "jshint:test",
    "jshint:lib",
    "copy:node-vdba-core.js",
    "concat:driver",
    "concat:build",
    //"jshint:sqlite-vdba-driver.js",
    //"uglify:node",
    "mochaTest",
    "api.html.zip"
  ]);
};

