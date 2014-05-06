module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['gruntfile.js', 'js/**/*.js', 'test/src/**/*.js']
        },
        jsonlint: {
            all: {
                src: ['data/**/*.json']
            }
        },
        qunit: {
            all: {
                options: {
                    urls: [
                      'http://localhost:8070/test/src/graph.html',
                    ]
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 8070,
                    base: '.'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-jsonlint');

    grunt.registerTask('default', ['jsonlint', 'jshint']);
    grunt.registerTask('test', ['connect', 'qunit']);
};