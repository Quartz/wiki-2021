// NPM modules
const QZ = require("../modules/core-things")

const d3 = Object.assign({}, 
	require("d3-selection"),
	require("d3-scale")
)


d3.getEvent = function(){ return require("d3-selection").event}.bind(this);


// Local modules
var features = require('../modules/detectFeatures')();
var utils = require('../modules/utils');

var fm;
var width;


/**
 * CONFIGURATION
 */

// add the paths of files you want to load to this array
const filesToLoad = []

let loadedFiles;


/**
 * Initialize the graphic.
 *
 * Populate global variables, add event listeners.
 * This gets called exactly one time, after the site registers the iframe and the files are loaded
 */
function init() {
	// get a reference to framemessager just in case you need it (you probably wont)
	fm = QZ.getFM();

	// Store loaded files you requested
	loadedFiles = QZ.getLoadedFiles()

	width = QZ.getWidth()
}

/**
 * Render the graphic
 * 
 * Add or draw things to the page
 * In the default setup, this gets called after init following load and on every resize
 */
function render() {
	

}

/**
 * Update the graphic.
 * 
 * This gets called on resize
 * To have separate update and resize functions delete render from below
 */
function update() {
	width = QZ.getWidth()
	render();
}

/**
 * The general operation flow is as follows
 * 
 * On load:
 * setup → init → render → postRender
 * 
 * On resize:
 * resize → update
 * 
 * You can customize them all by passing functions into using QZ.setCustom
 * They are designed to be called independently of each other. If you need
 * to chain these base functions for some reason, do so with promises.
 */

QZ.setFilesToLoad(filesToLoad)
QZ.setCustomInit(init)
QZ.setCustomRender(render)
QZ.setCustomUpdate(update)