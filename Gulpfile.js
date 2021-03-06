'use strict';

var gulp  = require('gulp');
var tasks = require('gulp-load-tasks')();
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var PROD = tasks.util.env.production;



gulp.task('scripts', function () {
  return browserify('./app/js/main.js')
    .transform('debowerify')
    .bundle({ debug: !PROD })
    .on('error', function (error) {
      tasks.util.log(tasks.util.colors.red(error.message));
    })
    .pipe(source('main.js'))
    .pipe(tasks.if(PROD, tasks.util.combine(
      tasks.buffer(),
      tasks.ngmin(),
      tasks.uglify()
    )()))
    .pipe(gulp.dest('./.build/js'));
});



gulp.task('less', function () {
  return gulp.src('app/styles/main.less')
    .pipe(tasks.less())
    .pipe(tasks.if(PROD, tasks.csso()))
    .pipe(gulp.dest('./.build/styles'));
});



gulp.task('build', ['scripts', 'less']);



gulp.task('watch', ['build'], function () {

  gulp.watch('app/js/**/*.js', ['scripts']);
  gulp.watch('app/styles/**/*.less', ['less']);

});


gulp.task('nodemon', function () {
  return tasks.nodemon({
    options: '-e js,json --watch server --watch config',
    script: './server'
  });
});

gulp.task('develop', ['build', 'watch', 'nodemon']);





gulp.task('jshint:client', function () {
  return gulp.src(['app/js/**/*.js'])
    .pipe(tasks.jshint('./.jshintrc'))
    .pipe(tasks.jshint.reporter('jshint-stylish'));
});

gulp.task('jshint:server', function () {
  return gulp.src(['server/**/*.js'])
    .pipe(tasks.jshint('./.jshintrc'))
    .pipe(tasks.jshint.reporter('jshint-stylish'));
});

gulp.task('recess', function () {
  return gulp.src('app/styles/main.less')
    .pipe(tasks.recess());
});


gulp.task('lint', ['jshint:client', 'jshint:server', 'recess']);





gulp.task('mocha', function () {
  return gulp.src(['./test/server/**/*.spec.js'], { read: false })
    .pipe(tasks.mocha())
    .on('error', function (error) {
      tasks.util.log(tasks.util.colors.red(error.message));
    });
});

gulp.task('mocha-watch', ['mocha'], function () {
  gulp.watch([
    './server/**/*.js',
    './test/server/**/*.spec.js'
  ], ['mocha']);
});


gulp.task('coverage', function () {
  return gulp.src(['./test/server/**/*.spec.js'], { read: false })
    .pipe(tasks.coverage.instrument({
      pattern: ['server/**/*.js'],
      debugDirectory: 'debug'
    }))
    .pipe(tasks.mocha())
    .pipe(tasks.coverage.gather())
    .pipe(tasks.coverage.format({
      reporter: 'html'
    }))
    .pipe(gulp.dest('./coverage'));
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
