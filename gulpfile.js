'use strict';
var gulp = require('gulp'),
	sass = require('gulp-sass'),
	watch = require('gulp-watch'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	jsFiles = [
		'./node_modules/angular/angular.min.js',
		'./node_modules/angular-route/angular-route.min.js',
		'./node_modules/angular-loading-bar/build/loading-bar.min.js',
		'./resources/js/app.js',
	];

gulp.task('sass', function() {
	return gulp.src('./resources/scss/app.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./assets/css'));
});

gulp.task('js', () => {
	return gulp.src(jsFiles)
		.pipe(concat('app.js'))
		.pipe(gulp.dest('./assets/js'))
		.pipe(rename('app.min.js'))
		.pipe(gulp.dest('assets/js'));
})

gulp.task('run', function() {
	watch('./resources/scss/app.scss', function() {
		gulp.start('sass');
	});
	watch(jsFiles, function() {
		gulp.start('js');
	});
})