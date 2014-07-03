var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

var src = 'clientpage/';

gulp.task('default', ['develop']);

gulp.task('develop', function () {
  nodemon({ script: 'server.js', ext: 'js html' })
    .on('restart', function () {
      console.log('restarted!');
    })
});
