var path = require('path');

var dirs = {
	build: './build',
	tmp: './.tmp',
	src: './src'
};

var paths = {
	src: {
		data: dirs.src + '/data',
		img: dirs.src + '/img',
		pug: dirs.src + '/pug',
		js: dirs.src + '/js',
		styl: dirs.src + '/styl',
		assets: dirs.src + '/assets',
		fonts: dirs.src + '/fonts',
		aws_assets: dirs.src + '/aws-assets',
		aws_data: dirs.src + '/aws-data'
	},
	build: {
		css: dirs.build + '/css',
		data: dirs.build + '/data',
		img: dirs.build + '/img',
		pug: dirs.build + '/pug',
		js: dirs.build + '/js',
		assets: dirs.build + '/assets',
		fonts: dirs.build + '/fonts',
		aws_assets: dirs.build + '/aws-assets',
		aws_data: dirs.build + '/aws-data'
	}
};

module.exports = {
	dirs: dirs,
	paths: paths
};
