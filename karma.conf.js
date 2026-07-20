module.exports = function(config) {
  config.set({
    // Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // Testing frameworks to use
    frameworks: ['jasmine'],

    // List of files / patterns to load in the browser
    files: [
      'src/**/*.js',       // Your source files
      'tests/**/*.spec.js' // Your test files
    ],

    // Test results reporter to use (e.g., 'dots', 'progress')
    reporters: ['progress'],

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,

    // Level of logging
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'], // Use 'Chrome' if you want to see the browser pop up

    // Continuous Integration mode: if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level: how many browser should be started simultaneous
    concurrency: Infinity
  })
}