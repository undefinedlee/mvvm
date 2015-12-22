var gulp = require('gulp');
var allInOne = require("gulp-all-in-one");
var uglify = require("gulp-uglify");
var rename = require('gulp-rename');

gulp.task('default',function(){
    gulp.src("src/index.js")
	    .pipe(allInOne("VM"))
	    .pipe(rename('vm.js'))
	    .pipe(gulp.dest("dist"))
	    .pipe(uglify())
	    .pipe(rename('vm.min.js'))
	    .pipe(gulp.dest('dist'));
});