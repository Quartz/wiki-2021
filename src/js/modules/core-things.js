const fm = require("./fm");
var utils = require('./utils');



var _ = {};
_.assign = require('lodash.assign');

var d3 = _.assign({},
	require("d3-fetch")
);

const ONLY_LOG_ON_LOCAL = true;

let file_loaders = [];
let _loadedFiles = [];
let _fmOptions = {};
let _fm = null;
let _readyResolve, _readyReject;

let _frameWidth
let _bodyElement, _interactiveContentElement, _interactiveContentWidth;

let _customFunctions = {}

const doNothing = (e) => {log(`Ignoring: ${e}`)}

// create a custom log function that only outputs in dev mode
Object.defineProperty(window, "log", {get: function () {
    return !ONLY_LOG_ON_LOCAL ||  ENV == "dev" ? console.log.bind(window.console, `[${new Date().toLocaleTimeString()}]`) 
                 : function(){};}
});

function _setup(){
    log("_setup")

    _bodyElement = document.querySelector("body");
    _interactiveContentElement = document.querySelector("#interactive-content")

    if(_customFunctions.customSetup) _customFunctions.customSetup();

}

function _init(){
    log("_init")

    _updateElementSizes();
    
    if(_customFunctions.customInit) _customFunctions.customInit();

}

function _render(){
    log("_render")

    if(_customFunctions.customRender) _customFunctions.customRender();
    fm.resize();

}

function _update(args){
    log("_update")

    _updateElementSizes()
    
    if(_customFunctions.customUpdate) _customFunctions.customUpdate(...arguments);
    fm.resize()
}

function _resizeCondition() {
    log("_resizeCondition")

    // if a custom resize conidtion has been set, use that instead
    if(_customFunctions.customResizeCondition) return _customFunctions.customResizeCondition()

    // by default only trigger a resize if the width has changed
    let newWidth = _bodyElement.getBoundingClientRect().width

    return new Promise((resolve, reject) => {
        _frameWidth = newWidth;

        resolve()
    })
}

function _resize(){
    log("_resize")
    let customReturn = undefined

    if(_customFunctions.customResize) customReturn = _customFunctions.customResize();

    return customReturn !== undefined ? customReturn : true;
  
}

function _updateElementSizes(){
    log("_updateElementSizes")

    _frameWidth = _bodyElement.getBoundingClientRect().width;
    _interactiveContentWidth = _interactiveContentElement.getBoundingClientRect().width
}

function _postRender() {
    log("_postRender")

    if(_customFunctions.customPostRender) _customFunctions.customPostRender()

    // set up the promise chain for what happens on resize
    let resizeChain = () => {
                    _resizeCondition()
                        .then(_resize)
                        .then(_update)
                        // .catch(doNothing)
        };

    window.addEventListener("resize", utils.throttle( resizeChain , 250), true);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", _update)
}

function _createLoaderPromiseFromUrl(url){

    let loader;
    let no_query_url = url.split("?")[0]
    if(no_query_url.endsWith(".json")) loader = d3.json
    if(no_query_url.endsWith(".csv")) loader = d3.csv
    if(no_query_url.endsWith(".tsv")) loader = d3.tsv

    if(!loader) {
        loader = d3.text
    }

    return loader(url)
}

function _setFMOptions(o){
    log("_setFMOptions")

    _fmOptions = o
}

function _setFilesToLoad(file_list) {

    file_loaders = file_list.map(o => {
        if(typeof o == "string") {
            return _createLoaderPromiseFromUrl(o)
        }
        else {
            return new Promise((resolve, reject) => {
                o.loader(o.fn, resolve, reject)
            })
        }

    })
}


// the names of the built-in functions
const functionNames = ["setup", "init", "render", "update", "postRender", "resize", "resizeCondition"];

// create an override for the built in functions
const setCustomFunctions = functionNames
    .map(s => s.charAt(0).toUpperCase() + s.slice(1)) // capitalize everything
    .reduce((agg, n) => {
        agg["setCustom" + n] = function(f) {
            if(typeof f !== 'function') throw new Error(`customised ${f} must be a function not a ${typeof f}`)

            _customFunctions[`custom${n}`] = f
        }
        return agg
    }, {})

// Bind on-load handler
document.addEventListener("DOMContentLoaded", function() {
    
    let fmPromise = new Promise((resolve, reject) => {
        fm.setup(_fmOptions, resolve, reject)
    })

    Promise.all([fmPromise, ...file_loaders])
        .then((resolveList) => {
            let [fmDone, ...loadedFiles] = resolveList;

            _fm = fm;

            _loadedFiles = loadedFiles;

            return resolveList;
        })
        .then(_setup)
        .then(_init)
        .then(_render)
        .then(_postRender)
	
});


module.exports = {
	setup: _setup,
    init: _init,
    render: _render,
    update: _update,
    ...setCustomFunctions,
    setFilesToLoad: _setFilesToLoad,
    getLoadedFiles: () => _loadedFiles,
    setFMOptions: _setFMOptions,
    getFM: () => _fm,
    getWidth: () => _frameWidth,
    log: log
}
