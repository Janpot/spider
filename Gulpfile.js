'use strict';

var gulp = require('gulp');
var tasks = require('gulp-load-tasks')();

var PROD = tasks.util.env.production;

gulp.task('scripts', function () {
  gulp.src('app/js/main.js')
    .pipe(tasks.browserify({
      insertGlobals : true,
      debug : !PROD
    }))
    .on('error', function (error) {
      tasks.util.log(error.name, error.message);
    })
    .pipe(tasks.if(PROD, tasks.ngmin()))
    .pipe(tasks.if(PROD, tasks.uglify({
      outSourceMap: true
    })))
    .pipe(gulp.dest('./.build/js'));
});



gulp.task('less', function () {
  gulp.src('app/styles/main.less')
    .pipe(tasks.less())
    .pipe(tasks.if(PROD, tasks.csso()))
    .pipe(gulp.dest('./.build/styles'));
});



gulp.task('build', ['scripts', 'less']);



gulp.task('watch', function () {
  
  gulp.watch('app/js/**/*.js', ['scripts']);
  gulp.watch('app/styles/**/*.less', ['less']);
  
});


gulp.task('nodemon', function () {
  tasks.nodemon({
    options: '-e js,json --watch server --watch config',
    script: './server'
  });
});

gulp.task('develop', ['build', 'watch', 'nodemon']);





gulp.task('jshint', function () {
  gulp.src(['app/js/**/*.js'])
    .pipe(tasks.jshint('./.jshintrc'))
    .pipe(tasks.jshint.reporter('jshint-stylish'));
  
  gulp.src(['server/**/*.js'])
    .pipe(tasks.jshint('./.jshintrc'))
    .pipe(tasks.jshint.reporter('jshint-stylish'));
});

gulp.task('recess', function () {
  gulp.src('app/styles/main.less')
    .pipe(tasks.recess());
});


gulp.task('lint', ['jshint', 'recess']);





gulp.task('mocha', function () {
  gulp.src(['./test/server/**/*.spec.js'], { read: false })
    .pipe(tasks.mocha())
    .on('error', function (error) {
      console.log(error.name, error.message);
    });
});

gulp.task('mocha-watch', ['mocha'], function () {
  gulp.watch([
    './server/**/*.js',
    './test/server/**/*.spec.js'
  ], ['mocha']);
});


gulp.task('coverage', function () {
  gulp.src(['./test/server/**/*.spec.js'], { read: false })
    .pipe(tasks.coverage.instrument({
      pattern: ['server/**/*.js'],
      debugDirectory: 'debug'
    }))
    .pipe(tasks.mocha())
    .pipe(tasks.coverage.report({
      outFile: 'coverage.html'
    }));

// use this instead of report when coverage > 0.0.18
//    .pipe(tasks.coverage.gather())
//    .pipe(tasks.coverage.format({
//      reporter: 'html'
//    }))
//    .dest('./coverage.html');
});


gulp.task('karma', function () {
  var testFiles = [
    './.build/js/main.js',
    './test/karma/**/*.spec.js'
  ];
  
  return gulp.src(testFiles)
    .pipe(tasks.karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }));
});


gulp.task('test', ['mocha', 'karma']);



gulp.task('default', ['lint', 'build']);











