module.exports = function(grunt){
    grunt.initConfig({
        babel: {
            options: {
                presets: ["es2015", "stage-3"]
            },
            dist: {
                files: {
                    "dist/iDB.js": "dev/iDB.js"
                }
            }
        },

        uglify: {
            my_target: {
                files: {
                    "dist/iDB.min.js" : ["dist/iDB.js"]
                }
            }
        },

        watch: {
            scripts: {
                files: ["dev/iDB.js"],
                tasks: ["babel", "minify"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-babel");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("build", ["babel"]);
    grunt.registerTask("minify", ["uglify"]);
}