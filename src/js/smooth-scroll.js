var smoothScroll = {}; // Object for public APIs
var supports = 'querySelector' in document && 'addEventListener' in root; // Feature test
var settings, anchor, toggle, fixedHeader, headerHeight, eventTimeout, animationInterval;

// Default settings
var defaults = {
	selector: '[data-scroll]',
	selectorHeader: null,
	speed: 500,
	easing: 'easeInOutCubic',
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
	if (type === 'easeInQuad') pattern = time * time; // accelerating from zero velocity
	if (type === 'easeOutQuad') pattern = time * (2 - time); // decelerating to zero velocity
	if (type === 'easeInOutQuad') pattern = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time; // acceleration until halfway, then deceleration
	if (type === 'easeInCubic') pattern = time * time * time; // accelerating from zero velocity
	if (type === 'easeOutCubic') pattern = (--time) * time * time + 1; // decelerating to zero velocity
	if (type === 'easeInOutCubic') pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1; // acceleration until halfway, then deceleration
	if (type === 'easeInQuart') pattern = time * time * time * time; // accelerating from zero velocity
	if (type === 'easeOutQuart') pattern = 1 - (--time) * time * time * time; // decelerating to zero velocity
	if (type === 'easeInOutQuart') pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (--time) * time * time * time; // acceleration until halfway, then deceleration
	if (type === 'easeInQuint') pattern = time * time * time * time * time; // accelerating from zero velocity
	if (type === 'easeOutQuint') pattern = 1 + (--time) * time * time * time * time; // decelerating to zero velocity
	if (type === 'easeInOutQuint') pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (--time) * time * time * time * time; // acceleration until halfway, then deceleration
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
	return !options || !(typeof JSON === 'object' && typeof JSON.parse === 'function') ? {} : JSON.parse(options);
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
 * Start/stop the scrolling animation
 * @public
 * @param {Node|Number} anchor  The element or position to scroll to
 * @param {Element}     toggle  The element that toggled the scroll event
 * @param {Object}      options
 */
smoothScroll.animateScroll = function (anchor, toggle, options) {

	// Options and overrides
	var overrides = getDataOptions(toggle ? toggle.getAttribute('data-options') : null);
	var animateSettings = {};
	Object.assign(animateSettings, settings || defaults, options || {}, overrides);

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

	/**
	 * Stop the scroll animation when it reaches its target (or the bottom/top of page)
	 * @private
	 * @param {Number} position Current position on the page
	 * @param {Number} endLocation Scroll to location
	 * @param {Number} animationInterval How much to scroll on this loop
	 */
	var stopAnimateScroll = function (position, endLocation, animationInterval) {
		var currentLocation = root.pageYOffset;
		if (position == endLocation || currentLocation == endLocation || ((root.innerHeight + currentLocation) >= documentHeight)) {

			// Clear the animation timer
			clearInterval(animationInterval);

			// Bring the anchored element into focus
			adjustFocus(anchor, endLocation, isNum);

			// Run callback after animation complete
			animateSettings.callback(anchor, toggle);

		}
	};

	/**
	 * Loop scrolling animation
	 * @private
	 */
	var loopAnimateScroll = function () {
		timeLapsed += 16;
		percentage = (timeLapsed / parseInt(animateSettings.speed, 10));
		percentage = (percentage > 1) ? 1 : percentage;
		position = startLocation + (distance * easingPattern(animateSettings.easing, percentage));
		root.scrollTo(0, Math.floor(position));
		stopAnimateScroll(position, endLocation, animationInterval);
	};

	/**
	 * Set interval timer
	 * @private
	 */
	var startAnimateScroll = function () {
		clearInterval(animationInterval);
		animationInterval = setInterval(loopAnimateScroll, 16);
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

};

/**
 * Handle has change event
 * @private
 */
var hashChangeHandler = function (event) {
	// Only run if there's an anchor element to scroll to
	if (!anchor) return;

	// Reset the anchor element's ID
	anchor.id = anchor.getAttribute('data-scroll-id');

	// Scroll to the anchored content
	smoothScroll.animateScroll(anchor, toggle);

	// Reset anchor and toggle
	anchor = null;
	toggle = null;
};

/**
 * If smooth scroll element clicked, animate scroll
 * @private
 */
var clickHandler = function (event) {

	// Don't run if right-click or command/control + click
	if (event.button !== 0 || event.metaKey || event.ctrlKey) return;

	// Check if a smooth scroll link was clicked
	toggle = event.target.closest(settings.selector);
	if (!toggle || toggle.tagName.toLowerCase() !== 'a') return;

	// Only run if link is an anchor and points to the current page
	if (toggle.hostname !== root.location.hostname || toggle.pathname !== root.location.pathname || !/#/.test(toggle.href)) return;

	// Get the sanitized hash
	// var hash = decodeURIComponent( escapeCharacters( toggle.hash ) );
	// console.log(hash);
	var hash;
	try {
		hash = escapeCharacters(decodeURIComponent(toggle.hash));
	} catch (e) {
		hash = escapeCharacters(toggle.hash);
	}

	// If the hash is empty, scroll to the top of the page
	if (hash === '#') {

		// Prevent default link behavior
		event.preventDefault();

		// Set the anchored element
		anchor = document.body;

		// Save or create the ID as a data attribute and remove it (prevents scroll jump)
		var id = anchor.id ? anchor.id : 'smooth-scroll-top';
		anchor.setAttribute('data-scroll-id', id);
		anchor.id = '';

		// If no hash change event will happen, fire manually
		// Otherwise, update the hash
		if (root.location.hash.substring(1) === id) {
			hashChangeHandler();
		} else {
			root.location.hash = id;
		}

		return;

	}

	// Get the anchored element
	anchor = document.querySelector(hash);

	// If anchored element exists, save the ID as a data attribute and remove it (prevents scroll jump)
	if (!anchor) return;
	anchor.setAttribute('data-scroll-id', anchor.id);
	anchor.id = '';

	// If no hash change event will happen, fire manually
	if (toggle.hash === root.location.hash) {
		event.preventDefault();
		hashChangeHandler();
	}

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

/**
 * Destroy the current initialization.
 * @public
 */
smoothScroll.destroy = function () {

	// If plugin isn't already initialized, stop
	if (!settings) return;

	// Remove event listeners
	document.removeEventListener('click', clickHandler, false);
	root.removeEventListener('resize', resizeThrottler, false);

	// Reset varaibles
	settings = null;
	anchor = null;
	toggle = null;
	fixedHeader = null;
	headerHeight = null;
	eventTimeout = null;
	animationInterval = null;
};

/**
 * Initialize Smooth Scroll
 * @public
 * @param {Object} options User settings
 */
smoothScroll.init = function (options) {

	// feature test
	if (!supports) return;

	// Destroy any existing initializations
	smoothScroll.destroy();

	// Selectors and variables
	settings = {};
	Object.assign(settings, defaults, options || {});
	fixedHeader = settings.selectorHeader ? document.querySelector(settings.selectorHeader) : null; // Get the fixed header
	headerHeight = getHeaderHeight(fixedHeader);

	// When a toggle is clicked, run the click handler
	document.addEventListener('click', clickHandler, false);

	// Listen for hash changes
	root.addEventListener('hashchange', hashChangeHandler, false);

	// If window is resized and there's a fixed header, recalculate its size
	if (fixedHeader) {
		root.addEventListener('resize', resizeThrottler, false);
	}

};


//
// Public APIs
//

export default smoothScroll;