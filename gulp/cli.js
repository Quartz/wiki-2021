var opts = require('@gerhobbelt/nomnom')
	.option('build', {
		abbr: 'b',
		help: 'Build project. [local | move | commit | push | push-noS3 | s3]',
		choices: ['local', 'move', 'commit', 'push', "push-noS3", "s3"]
	})
	.option('dont-minify', {
		abbr: 'd',
		flag: true,
		help: 'Prevent build from minifying your js'
	})
	.option("server", {
		abbr: "s",
		help: "Run the project locally",
		flag: true,
		default: true
	})
	.autoShowUsage(false);

module.exports = opts;
