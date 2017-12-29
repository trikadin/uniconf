require('sugar').extend();

const
	{join} = require('path'),
	fs = require('fs'),
	$C = require('collection.js'),
	del = require('del'),
	gulp = require('gulp'),
	ts = require('gulp-typescript'),
	merge = require('merge2');

const
	srcPath = join(process.cwd(), 'src'),
	destPath = process.cwd(),
	tsExtReg = /\.ts$/,
	project = ts.createProject('tsconfig.json');

gulp.task('clean', () => del($C(fs.readdirSync(srcPath)).reduce((res, filename) => {
	filename = join(destPath, filename);

	res.push(filename);

	if (tsExtReg.test(filename)) {
		res.push(filename.replace(tsExtReg, '.js'));
	}
}, [])));

const buildTask = (() => {
	const res = project.src().pipe(project);

	return merge([
		res.js.pipe(gulp.dest(destPath)),
		res.dts.pipe(gulp.dest(destPath))
	]);
}).debounce(300);

gulp.task('build', ['clean'], buildTask);
gulp.task('default', ['build']);

gulp.task('watch', ['clean', 'build'], () => {
	gulp.watch(join(srcPath, '**/*.*'), buildTask);
});
