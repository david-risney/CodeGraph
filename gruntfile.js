module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['gruntfile.js', 'js/**/*.js', 'test/src/**/*.js']
        },
        jslint: { // configure the task
            all: {
                src: [ // some example files
                  'js/**/*.js'
                ],
                directives: { // example directives
                    browser: true,
                    predef: ['console', 'objectToHtml', 'hljs', 'EventTarget', 'WinJS', 'Graph', 'WinJSGlobalCodeStore', 'WinJSGlobalPathLister', 'Deferral', 'd3', 'CodeStore', 'CodeVisualizer', 'PathLister', 'CodeGenerator', 'Controls', 'promiseJoinWithProgress']
                },
                options: {
                    edition: 'latest', // specify an edition of jslint or use 'dir/mycustom-jslint.js' for own path
                }
            }
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
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-jsonlint');

    grunt.registerTask('default', ['jsonlint', 'jshint', 'jslint']);
    grunt.registerTask('test', ['connect', 'qunit']);
};