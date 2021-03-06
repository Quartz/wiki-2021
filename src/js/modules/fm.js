var interactiveEl = document.getElementById("interactive-content")
var FM = null;
var propCallback, hashCallback;

var _ = {};
_.assign = require('lodash.assign');

var d3 = _.assign({},
	require("d3-selection"),
	require("d3-transition"),
	require("d3-interpolate")
);

/**
 * Setup Frame Messenger and connect to parent.
 */
function setupFrameMessenger(options, resolve, reject) {
	// Production: use frame messenging (will error if no parent frame)
	var local_prod_test = window.location.search.toString().indexOf("e=1") > -1
	var forScreenshot = window.location.search.toString().indexOf("screenshot=true") > -1;
	if ((ENV == 'prod' || local_prod_test) && !forScreenshot) {
		var intervalCount = 0;

		var fmInterval = setInterval(() => {
			FM = frameMessager(options || {});

			FM.onMessage("parent:register", () => {
				clearInterval(fmInterval)
				resolve()
			})
			
			FM.triggerMessage("QZParent", "child:register", {url: window.location.href})

			if (intervalCount++ > 100) {
				reject(new Error("FM was not reached after 100 attempts"))
			}
		}, 250)

		document.body.style.overflow = "hidden";
	// Test environment: no frame messenging
	} else {
		resolve();
	}
}

/**
 * Compute the height of the interactive.
 */
/**
 * Get height of window including margin
 */
function _getDocumentHeight() {
  var height = interactiveEl.offsetHeight;
  var style = getComputedStyle(interactiveEl);

  return height + parseInt(style.marginTop) + parseInt(style.marginBottom);
}

/**
 * Update parent height.
 */
function updateHeight (height) {
	if (!FM) {
		return;
	}

	height = height || _getDocumentHeight();

	FM.triggerMessage("QZParent", "child:updateHeight", {
		height : height
	});

	return;
}

/**
 * Update parent hash.
 */
function updateHash (hash) {
	if (!FM) {
		window.location.hash = "data/" + hash;
	} else {
		FM.triggerMessage("QZParent", "child:updateHash", {
			hash : hash
		});
	}
	return;
}

function setupReadHash(cb) {
	if(!FM) {
		hashCallback = cb
	}
	else {
		FM.onMessage("parent:readHash", msg => cb(msg.data.hash))
	}
}

function readHash() {
	if(!FM) {
		hashCallback(window.location.hash.split("#data/")[1])
	}
	else {
		FM.triggerMessage("QZParent", "child:readHash")
	}
}

/**
 * Read parent hash.
 */
function readWindowProps () {
	if (!FM) {
		var frame = document.getElementById("interactive-content")
		var frame_bb = frame.getBoundingClientRect()

		var clientWidth = window.innerWidth;
		var clientHeight = window.innerHeight;

		return propCallback({
			action: "parent:readWindowProps",
			fromId: "QZParent",
			toId: "interactive-local",
			data: {
				windowProps: {
					clientDimensions: {
						width: clientWidth,
						height: clientHeight,
					},
					pageOffset: {
						x: window.scrollX,
						y: window.scrollY
					},
					uri: {
						hash: window.location.hash,
						href: window.location.href,
						origin: window.location.origin,
						pathname: window.location.pathname
					}
				}
			}
		});
	}

	FM.triggerMessage("QZParent", "child:readWindowProps");

	return;
}

function setupItemScroll(callback) {
	if(!FM) {
		var frame = document.getElementById("interactive-content")

		window.onscroll = function(){
			var rect = frame.getBoundingClientRect();
			var windowHeight = window.innerHeight;

			callback({
				"action":"itemWell:scroll",
				"data":{
					"frameTop":{
					"nav": rect.top,
					"window": windowHeight - rect.top
				},
				"frameBottom":{
					"nav": rect.bottom,
					"window": windowHeight - rect.bottom
				},
				"scrollDepth": document.documentElement.scrollTop || document.body.scrollTop,
				"viewable":true,
					"visible":true
				},
				"fromId":"QZParent",
				"toId":"interactive-local"
			})
		}
	} else {
		FM.onMessage("itemWell:scroll", callback)
	}
}

/**
 * Set up a callback that will handle incoming hash data
 */
function setupReadWindow(callback) {
	if (!FM) {
		propCallback = callback;
	} else {
		FM.onMessage("parent:readWindowProps", callback);
	}
}

/**
 * Resize the parent to match the new child height.
 */
function resize () {
  updateHeight(_getDocumentHeight());
}

/**
 * Get height of window including margin
 */
function _getWindowHeight() {
  var height = interactiveEl.offsetHeight;
  var style = getComputedStyle(interactiveEl);

  return height + parseInt(style.marginTop) + parseInt(style.marginBottom);
}

/**
 * Scroll the parent window to a given location.
 *
 * Call like this:
 * fm.scrollToPosition($("#scrollToThisDiv").offset().top,500)
 *
 * Where 500 is the duration of the scroll animation
 */
 function scrollToPosition (position,duration) {
 	if (!FM) {
 		d3.transition()
 		    .delay(0)
 		    .duration(duration)
 		    .tween("scroll", scrollTween(position));
 	} else {
 		FM.triggerMessage("QZParent", "child:scrollToPosition", {
 			position : position,
 			duration : 500
 		});
 	}
 }


 function scrollTween(offset) {
   return function() {
     var i = d3.interpolateNumber(window.pageYOffset || document.documentElement.scrollTop, offset);
     return function(t) { scrollTo(0, i(t)); };
   };
 }

/**
 * Get a reference to the parent window.
 */
function getParentWindow () {
	return FM.triggerMessage("QZParent", "child:getWindow");
}

// setupFrameMessenger();

module.exports = {
	setup: setupFrameMessenger,
	updateHeight: updateHeight,
	resize: resize,
	scrollToPosition: scrollToPosition,
	getParentWindow: getParentWindow,
	updateHash: updateHash,
	readHash: readHash,
	setupReadHash: setupReadHash,
	readWindowProps: readWindowProps,
	setupReadWindow: setupReadWindow,
	setupItemScroll: setupItemScroll
};
