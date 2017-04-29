const root = window;
var settings, anchor, fixedHeader, headerHeight, eventTimeout, animationInterval;

// Default settings
var defaults = {
	selector: '[data-scroll]',
	selectorHeader: null,
	speed: 500,
	easing: 'easeOutCubic',
	offset: 0,
	callback: function () { }
};

//
// Methods
//

/**
 * Get the height of an element.
 * @private
 * @param  {Node} elem The element to get the height of
 * @return {Number}    The element's height in pixels
 */
var getHeight = function (elem) {
	return Math.max(elem.scrollHeight, elem.offsetHeight, elem.clientHeight);
};

/**
 * Calculate the easing pattern
 * @private
 * @link https://gist.github.com/gre/1650294
 * @param {String} type Easing pattern
 * @param {Number} time Time animation should take to complete
 * @returns {Number}
 */
var easingPattern = function (type, time) {
	var pattern;
	if (type === 'easeInCubic') pattern = time * time * time; // accelerating from zero velocity
	if (type === 'easeOutCubic') pattern = (--time) * time * time + 1; // decelerating to zero velocity
	return pattern || time; // no easing, no acceleration
};

/**
 * Calculate how far to scroll
 * @private
 * @param {Element} anchor The anchor element to scroll to
 * @param {Number} headerHeight Height of a fixed header, if any
 * @param {Number} offset Number of pixels by which to offset scroll
 * @returns {Number}
 */
var getEndLocation = function (anchor, headerHeight, offset) {
	var location = 0;
	if (anchor.offsetParent) {
		do {
			location += anchor.offsetTop;
			anchor = anchor.offsetParent;
		} while (anchor);
	}
	location = Math.max(location - headerHeight - offset, 0);
	return Math.min(location, getDocumentHeight() - getViewportHeight());
};

/**
 * Determine the viewport's height
 * @private
 * @returns {Number}
 */
var getViewportHeight = function () {
	return Math.max(document.documentElement.clientHeight, root.innerHeight || 0);
};

/**
 * Determine the document's height
 * @private
 * @returns {Number}
 */
var getDocumentHeight = function () {
	return Math.max(
		document.body.scrollHeight, document.documentElement.scrollHeight,
		document.body.offsetHeight, document.documentElement.offsetHeight,
		document.body.clientHeight, document.documentElement.clientHeight
	);
};

/**
 * Convert data-options attribute into an object of key/value pairs
 * @private
 * @param {String} options Link-specific options as a data attribute string
 * @returns {Object}
 */
var getDataOptions = function (options) {
	return !options || JSON.parse(options);
};

/**
 * Get the height of the fixed header
 * @private
 * @param  {Node}   header The header
 * @return {Number}        The height of the header
 */
var getHeaderHeight = function (header) {
	return !header ? 0 : (getHeight(header) + header.offsetTop);
};

/**
 * Bring the anchored element into focus
 * @private
 */
var adjustFocus = function (anchor, endLocation, isNum) {

	// Don't run if scrolling to a number on the page
	if (isNum) return;

	// Otherwise, bring anchor element into focus
	anchor.focus();
	if (document.activeElement.id !== anchor.id) {
		anchor.setAttribute('tabindex', '-1');
		anchor.focus();
		anchor.style.outline = 'none';
	}
	root.scrollTo(0, endLocation);

};

/**
 * Handle has change event
 * @private
 */
var hashChangeHandler = function (event) {
	anchor = document.getElementById(location.hash.substring(1));

	// Only run if there's an anchor element to scroll to
	if (!anchor) return;

	// Scroll to the anchored content
	this.animateScroll(anchor);

	// Reset anchor
	anchor = null;
};

/**
 * On window scroll and resize, only run events at a rate of 15fps for better performance
 * @private
 * @param  {Function} eventTimeout Timeout function
 * @param  {Object} settings
 */
var resizeThrottler = function (event) {
	if (!eventTimeout) {
		eventTimeout = setTimeout(function () {
			eventTimeout = null; // Reset timeout
			headerHeight = getHeaderHeight(fixedHeader); // Get the height of a fixed header if one exists
		}, 66);
	}
};

class SmoothScroll {

	/**
	 * Initialize Smooth Scroll
	 * @public
	 * @param {Object} options User settings
	 */
	constructor(options) {
		// Selectors and variables
		settings = {};
		Object.assign(settings, defaults, options || {});
		fixedHeader = settings.selectorHeader ? document.querySelector(settings.selectorHeader) : null; // Get the fixed header
		headerHeight = getHeaderHeight(fixedHeader);

		// Listen for hash changes
		root.addEventListener('hashchange', hashChangeHandler.bind(this), false);

		// If window is resized and there's a fixed header, recalculate its size
		if (fixedHeader) {
			root.addEventListener('resize', resizeThrottler, false);
		}
	}

	/**
	 * Start/stop the scrolling animation
	 * @public
	 * @param {Node|Number} anchor  The element or position to scroll to
	 * @param {Object}      options
	 */
	animateScroll(anchor, options) {
		// Options
		var animateSettings = {};
		Object.assign(animateSettings, settings || defaults, options || {});

		// Selectors and variables
		var isNum = Object.prototype.toString.call(anchor) === '[object Number]' ? true : false;
		var anchorElem = isNum || !anchor.tagName ? null : anchor;
		if (!isNum && !anchorElem) return;
		var startLocation = root.pageYOffset; // Current location on the page
		if (animateSettings.selectorHeader && !fixedHeader) {
			// Get the fixed header if not already set
			fixedHeader = document.querySelector(animateSettings.selectorHeader);
		}
		if (!headerHeight) {
			// Get the height of a fixed header if one exists and not already set
			headerHeight = getHeaderHeight(fixedHeader);
		}
		var endLocation = isNum ? anchor : getEndLocation(anchorElem, headerHeight, parseInt((typeof animateSettings.offset === 'function' ? animateSettings.offset() : animateSettings.offset), 10)); // Location to scroll to
		var distance = endLocation - startLocation; // distance to travel
		var documentHeight = getDocumentHeight();
		var timeLapsed = 0;
		var percentage, position;
		var start = null;

		/**
		 * Loop scrolling animation
		 * @private
		 */
		var loopAnimateScroll = function(timestamp) {
  			if (!start) start = timestamp;
  			var progress = timestamp - start;
			timeLapsed += progress;
			percentage = (timeLapsed / parseInt(animateSettings.speed, 10));
			percentage = (percentage > 1) ? 1 : percentage;
			position = startLocation + (distance * easingPattern(animateSettings.easing, percentage));
			root.scrollTo(0, Math.floor(position));
			console.log(percentage);

			var currentLocation = root.pageYOffset;
			if (position == endLocation || currentLocation == endLocation || ((root.innerHeight + currentLocation) >= documentHeight)) {
				// Bring the anchored element into focus
				adjustFocus(anchor, endLocation, isNum);

				// Run callback after animation complete
				animateSettings.callback(anchor);
			} else {
				animationInterval = requestAnimationFrame(loopAnimateScroll);
			}
		};

		/**
		 * Set interval timer
		 * @private
		 */
		var startAnimateScroll = function () {
			start = null;
			cancelAnimationFrame(animationInterval);
			animationInterval = requestAnimationFrame(loopAnimateScroll);
		};

		/**
		 * Reset position to fix weird iOS bug
		 * @link https://github.com/cferdinandi/smooth-scroll/issues/45
		 */
		if (root.pageYOffset === 0) {
			root.scrollTo(0, 0);
		}

		// Start scrolling animation
		startAnimateScroll();

	}

	/**
	 * Destroy the current initialization.
	 * @public
	 */
	destroy() {
		// If plugin isn't already initialized, stop
		if (!settings) return;

		// Remove event listeners
		root.removeEventListener('resize', resizeThrottler, false);

		// Reset varaibles
		settings = null;
		anchor = null;
		fixedHeader = null;
		headerHeight = null;
		eventTimeout = null;
		animationInterval = null;
	}

}