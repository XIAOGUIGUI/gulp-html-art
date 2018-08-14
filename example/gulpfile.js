'use strict';

const gulp = require('gulp');
const htmlArt = require('../lib/index');

gulp.task('default', function() {
	return gulp.src('html/component/index.html')
		.pipe(htmlArt({
			paths: ['./html/common'],
			data: {
				useHeader: false
			},
			beautify: {
				indent_char: ' ',
				indent_with_tabs: false
			}
		}))
		.pipe(gulp.dest('./dist'));
});