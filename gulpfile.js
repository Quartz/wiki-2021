// Node modules
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const browserSync = require("browser-sync");
const reload = browserSync.reload;
const nib = require("nib");
const del = require("del");
const glob = require('glob')

// Gulp-related
const gulp = require("gulp");
const pug = require("gulp-pug");
const preprocess = require("gulp-preprocess");
const shell = require("gulp-shell");
const stylus = require("gulp-stylus");
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const replace = require('gulp-replace');
const gulpif = require('gulp-if');
const touch = require('gulp-touch-cmd');

// Non-gulp NPM modules
const fs = require("fs");
const request = require('request');

// Local modules
const args = require("./gulp/cli").parse();
const config = require("./gulp/config");
const utils = require("./gulp/utils");

// Configuration
const thingConfig = require("./thing-config.js")

const gdoc_id = thingConfig.gdoc_id;
const gdoc_host = "127.0.0.1:6006";
const gdoc_url = "http://"+gdoc_host+"/"+ gdoc_id;
var content = {};
var data_from_file = {};


const qzthingspath = process.env.QZTHINGS_PATH || "~/qz-things";
const thingName = thingConfig.thing_name;
const thingPath = qzthingspath + thingConfig.thing_path;

const datafiles = thingConfig.datafiles.map(d => {
	return {
		...d, 
		'taskName':`  get-data ${d.fn}`,
		"cleanFN": d.fn.split("/").pop().split(".")[0].replace(/-/g, "_")
	}
})

const AWS_URL = "https://things-assets.qz.com";

const AWS_DATA_URL = AWS_URL + thingConfig.thing_path + "/data/";
const AWS_ASSETS_URL = AWS_URL + thingConfig.thing_path + "/assets/";

const isProd = args.build ? true : false;
const preprocessOpts = {
	context: {
		ENV: isProd ? "prod" : "dev"
	}
};



// there are three groups of tasks that get fill with taskts to run in parallel.

// Tasks that load content files and check files for policy compliance 
var contentTasks = []

// Tasks that compile or transpile source files into their final form
var compilationTasks = []

// tasks that move files from the source folder to the build folder
var copyTasks = []

var sizeLimitedFolders = ["assets", "data"]
var sizeCheckTasks = sizeLimitedFolders.map(d => d + "-check")


// set up the tasks that just copy files from folder to folder
var allFoldersToCopy = []

var allFoldersToAlwaysCopy = [
	{id:"libs",		src: config.paths.src.js + "/libs/*", 	dst: config.paths.build.js + "/libs"},
	{id:"assets", 	src: config.paths.src.assets + "/**", 	dst: config.paths.build.assets},
	{id:"data", 	src: config.paths.src.data + "/**", 	dst: config.paths.build.data},
]

var allFoldersToCopyIfLocal = [
	{id:"fonts", 	src: config.paths.src.fonts + "/**", 	dst: config.paths.build.fonts},
	{id:"favicon",	src: "./src/favicon.ico", 				dst: "./build"},
]

var allFoldersToCopyIfProd = [
	
]

allFoldersToCopy.push(...allFoldersToAlwaysCopy)

if(isProd) {
	allFoldersToCopy.push(...allFoldersToCopyIfProd)
}
else {
	allFoldersToCopy.push(...allFoldersToCopyIfLocal)
}

// get all of the pages that are in the pages folder
var allPages = fs.readdirSync("./src/pug/pages/")
	.filter(d => d.includes(".pug"))
	.map(d => d.replace(".pug", ""))

// get all scripts that are in the scripts folder
var allScripts = fs.readdirSync("./src/js/scripts/")
	.filter(d => d.includes(".js"))
	.map(d => d.replace(".js", ""))

// get all the stylesheets that are in the stylesheet folder
var allStylesheets = fs.readdirSync("./src/styl/stylesheets")
	.filter(d => d.includes(".styl"))
	.map(d => d.replace(".styl", ""))

var pugTasks = [];
var browserifyTasks = []
var stylusTasks = []

var shellCmd = utils.generateShellCmd(args.build, thingPath, thingName, thingConfig.thing_path);

sizeLimitedFolders.forEach(folderName => {
	function checkFolderTask(doneCallback) {
		var numFileLimit = 13;
		var totalSizeLimit = 5; //in MB
		var singleSizeLimit = 1.25; //in MB

		glob("./src/"+ folderName +"/**/*", (err, files) => {

			// limit the number of files
			if (files.length > numFileLimit) {
				doneCallback(new Error("You have "+files.length+" files in your "+ folderName +" folder. We only allow "+(numFileLimit - 1)+". Move them to the aws-"+ folderName +" and adjust your code accordingly."))
				return
			}

			var fileSizes = files.map(d => fs.statSync(d).size / 1000000);

			// limit the total file size
			var totalFileSize = Math.round(fileSizes.reduce((acc, cur) => acc + cur, 0)*10)/10
			if(totalFileSize > totalSizeLimit) {
				doneCallback(new Error("Your files in the "+ folderName +" folder are "+totalFileSize+"MB. That's over the "+totalSizeLimit+"MB limit for the "+ folderName +" folder. Move them to the aws-"+ folderName +" and adjust your code accordingly."))
				return
			}
			
			// limit the size of individual files
			var filesLargerThanLimit = fileSizes.filter(d => d > singleSizeLimit).length;
			
			if(filesLargerThanLimit) {
				doneCallback(new Error("You have "+filesLargerThanLimit+" files larger than "+singleSizeLimit+"MB in the "+ folderName +" folder. Move them to the aws-"+ folderName +" and adjust your code accordingly."))
				return
			}

			doneCallback();
		})
	}

	let taskName = `  ${folderName}-check`
	gulp.task(taskName, checkFolderTask)
	contentTasks.push(taskName)
})

/**
 * Fetch ArchieML data from Google Docs.
 */
function getContentTask(doneCallback) {
	if(gdoc_id !== "") {
		request.get({
				"url": gdoc_url
			},
			function(error, resp, body) {
				if(!error && resp.statusCode < 400) {
					content = JSON.parse(body);
					fs.writeFileSync("content.json", body, "utf-8");
					doneCallback();
				}
				else {
					// if the server isn't up load from file
					if(resp && resp.statusCode >= 400) {
						console.log(body);
					}

					console.log("Cannot load content from server, loading from file");
					readContentFromFile(doneCallback);
				}
		});
	}
	else {
		console.log("No google doc specified, loading from file");
		readContentFromFile(doneCallback);
	}
}

gulp.task("  get-content", getContentTask);
contentTasks.push("  get-content")

// loop through each data file and create a task to load and parse it
datafiles.forEach(o => {
	function readDataFromFile(doneCallback) {
		request.get(o.fn, function(err, data) {
			if (!err) {
				data_from_file[o.cleanFN] = o.parser ? o.parser(data.body.toString("utf-8")) : JSON.parse(data.body);
				doneCallback();
			}
			else {
				console.log(`Cannot load data from ${o.fn}`);
				doneCallback(err);
			}
		})
		// fs.readFile(o.fn, function(err, data){
			
		// });
	}
	gulp.task(o.taskName, readDataFromFile)
	contentTasks.push(o.taskName)

})

/**
 * Compile Pug HTML templates. (Also triggers a refetch of the ArchieML doc.)
 */

 
allPages.forEach(function(pageid){
	var pugTaskName = "  pug: " + pageid
	pugTasks.push(pugTaskName);

	compilationTasks.push(pugTaskName)

	function compilePugTask() {
		var context = {
			"content": content, // this is the AML document
			...data_from_file, // these are any of the files listed to load
			"build_info": {
				"timestamp": (new Date()).getTime().toString(),
				"thing_name": thingConfig.thing_name,
				"thing_description": thingConfig.thing_description,
				"thing_path": thingConfig.thing_path,
				"gdoc_id": thingConfig.gdoc_id
			}
		}
		
		return gulp.src(config.paths.src.pug + "/pages/"+ pageid +".pug")
			.pipe(pug({ pretty: true, locals: context }))
			.pipe(gulpif(isProd, replace("aws-data/", AWS_DATA_URL)))
			.pipe(gulpif(isProd, replace("aws-assets/", AWS_ASSETS_URL)))
			.pipe(gulp.dest(config.dirs.build))
			.pipe(touch())
			.pipe(reload({ stream: true }));
	}

	gulp.task(pugTaskName, compilePugTask);
})

/**
 * Writes environment configuration variables to config.js and puts it in
 * the build directory.
 */
function preprocessTask() {
	return gulp.src([config.paths.src.js + "/config.js"])
		.pipe(preprocess(preprocessOpts))
		.pipe(gulp.dest(config.paths.build.js))
		.pipe(touch());
}

gulp.task("preprocess", preprocessTask);


/**
 * Bundle Javascript with browserify.
 */
allScripts.forEach(function(scriptid){
	var browserifyTaskName = "  browserify: " + scriptid;
	browserifyTasks.push(browserifyTaskName);

	compilationTasks.push(browserifyTaskName);

	function compileJavascriptTask(doneCallback) {

		var bundler = browserify({
				entries: [config.paths.src.js + "/scripts/"+ scriptid +".js"],
				debug: !isProd
			})

		// target the javascript capabilities of the browsers 
		// specified under "browserslist" in package.json
		bundler.transform("babelify", {
			presets: [[
				"@babel/preset-env",
				{
					"useBuiltIns": "entry",
					"corejs": "3"
				}
			]]
		})


		if (isProd && !args["dont-minify"]) {
			bundler.transform({ global: true }, "uglifyify");
		}

		return bundler
			.bundle()
			.on('error', function(err) {
				console.error('ERROR IN ' + scriptid + ".js");
				console.error(err.message);
				doneCallback();
			})
			.pipe(source(scriptid + ".js"))
			.pipe(gulpif(isProd, replace("aws-data/", AWS_DATA_URL)))
			.pipe(gulpif(isProd, replace("aws-assets/", AWS_ASSETS_URL)))
			.pipe(gulp.dest(config.paths.build.js))
			.pipe(touch())
			.pipe(reload({ stream: true }));
	}

	gulp.task(browserifyTaskName, compileJavascriptTask);
})


/**
 * Compile Stylus CSS meta-language.
 */
allStylesheets.forEach(function(styleid){
	var stylusTaskName = "  stylus: " + styleid;
	stylusTasks.push(stylusTaskName);

	compilationTasks.push(stylusTaskName);

	function compileStylusTask() {
		return gulp.src(config.paths.src.styl + "/stylesheets/" + styleid + ".styl")
			.pipe(stylus({
				use: [nib()],
				"include css": true,
				errors: true
			}))
			.pipe(postcss([ autoprefixer() ]))
			.pipe(gulp.dest(config.paths.build.css))
			.pipe(touch())
			.pipe(reload({ stream: true }));
	}

	gulp.task(stylusTaskName, compileStylusTask);

})


/**
 * Create all the copy tasks
 */
allFoldersToCopy.forEach(function(opts){
	var copyTaskName = "  copy-" + opts.id;

	copyTasks.push(copyTaskName);

	function copyTask() {
		return gulp.src(opts.src)
			.pipe(gulp.dest(opts.dst))
			.pipe(touch())
			.pipe(reload({ stream: true }));
	}

	gulp.task(copyTaskName, copyTask)
	

})
/**
 * Reads compiled ArchieML content from the local JSON file.
 */
function readContentFromFile(doneCallback) {
	fs.readFile("content.json", function(err, data){
		if (!err) {
			content = JSON.parse(data);
			doneCallback();
		}
		else {
			console.log("Cannot load content from file");
			doneCallback(err);
		}
	});
}


/**
 * Clear files from the build directory.
 */
function cleanTask() {
	return del([
		config.dirs.build + "/*"
	]);
}

gulp.task("clean", cleanTask);

gulp.task("reload", (cb) => browserSync.reload() || cb())

/**
 * Watches project files for changes and runs the appropriate copy/compile
 * tasks.
 */
function watchTask(done) {
	allFoldersToCopy.forEach(opts => gulp.watch(opts.src, gulp.series(`  copy-${opts.id}`, "reload")))
	datafiles.forEach(df => gulp.watch(df.fn, gulp.series(df.taskName, pugTasks, "reload")))
	gulp.watch(config.paths.src.js + "/**", gulp.series(browserifyTasks, "reload"));
	gulp.watch(config.paths.src.styl + "/**", gulp.series(stylusTasks, "reload"));
	gulp.watch(config.paths.src.pug + "/**", gulp.series(contentTasks, pugTasks, "reload"));
	done();
}
gulp.task("watch", watchTask);

/**
 * Starts the browsersync server.
 */
function browserSyncTask() {
	browserSync({
		server: {
			baseDir: "build", 
			routes : {
				"/aws-assets": "src/aws-assets",
				"/aws-data": "src/aws-data"
			},
		},
		injectChanges: true,
		open: false
	});
}

gulp.task("browser-sync", gulp.series("watch", browserSyncTask));


// create the paralell tasks from the populated groups
gulp.task("content-tasks", gulp.parallel(...contentTasks));
gulp.task("compilation-tasks", gulp.parallel(...compilationTasks));
gulp.task("copy-tasks", gulp.parallel(...copyTasks))

/**
 * Command tasks
 * 
 * these tasks wrap all the above into the commands we run
 */

// run the __build.sh command to move files as appropriate
gulp.task("shell-commands", shell.task(shellCmd))

// Do everything in the right order!
gulp.task("build", gulp.series(
		"content-tasks",
		"preprocess",
		"compilation-tasks",
		"copy-tasks", 
		"shell-commands"
	));

// Only run browser-sync if we're doing local dev
var defaultTasks = args.build ? gulp.series("clean", "build") : gulp.series("clean", "build", "browser-sync");

gulp.task("default", defaultTasks)