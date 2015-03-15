module.exports = function(grunt) {
    "use strict";

    var path = require("path");
    var cwd = process.cwd();
    var tsJSON = {
        all: {
            src: ["src/*.ts", "typings/**/*.d.ts"],
            out: "build/main.js",
            options: {
                sourceMap: false
            },
        },
    };

    var watchJSON = {
        ts: {
            options: {
                livereload: false,
                atBegin: true
            },
            tasks: ["buildts"],
            files: ["src/*.ts"]
        },
    }

    var configJSON = {
        pkg: grunt.file.readJSON("package.json"),
        ts: tsJSON,
        watch: watchJSON,
        connect: {
            server: {
                options: {
                    port: 9999,
                    base: "",
                    livereload: true
                }
            }
        },
        clean: {
            tscommand: ["tscommand*.tmp.txt"]
        },
    };

    // project configuration
    grunt.initConfig(configJSON);

    require('load-grunt-tasks')(grunt);

    grunt.registerTask("buildts", [
        "ts:all",
        "clean",
    ]);

    grunt.registerTask("tsrunner", ["connect", "watch:ts", "buildts", ]);
    // default task (this is what runs when a task isn't specified)
    grunt.registerTask("default", ["tsrunner"]);
};
