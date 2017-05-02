/**
 * Calculate the easing pattern
 * @private
 * @link https://gist.github.com/gre/1650294
 * @param {String} easing Easing pattern
 * @param {Number} time Time animation should take to complete
 * @returns {Number}
 */
export const easingPattern = function (easing, time) {
	let pattern;
	if (easing === 'easeInCubic') pattern = time * time * time; // accelerating from zero velocity
	if (easing === 'easeOutCubic') pattern = (--time) * time * time + 1; // decelerating to zero velocity
	if (typeof easing === 'function') pattern = easing(time);
	return pattern || time; // no easing, no acceleration
};

/**
 * Calculate how far to scroll
 * @private
 * @param {Element} anchor The anchor element to scroll to
 * @param {Number} offset Number of pixels by which to offset scroll
 * @returns {Number}
 */
export const getEndLocation = function (anchor, offset) {
	let location = 0;
	if (anchor.offsetParent) {
		do {
			location += anchor.offsetTop;
			anchor = anchor.offsetParent;
		} while (anchor);
	}
	location = Math.max(location - offset, 0);
	return Math.min(location, getDocumentHeight() - getViewportHeight());
};

/**
 * Determine the viewport's height
 * @private
 * @returns {Number}
 */
export const getViewportHeight = () => Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

/**
 * Determine the document's height
 * @private
 * @returns {Number}
 */
export const getDocumentHeight = () => {
	return Math.max(
		document.body.scrollHeight, document.documentElement.scrollHeight,
		document.body.offsetHeight, document.documentElement.offsetHeight,
		document.body.clientHeight, document.documentElement.clientHeight
	);
};

/**
 * Bring the anchored element into focus
 * @private
 */
export const adjustFocus = function (anchor, endLocation) {
	// Otherwise, bring anchor element into focus
	anchor.focus();
	if (document.activeElement.id !== anchor.id) {
		anchor.setAttribute('tabindex', '-1');
		anchor.focus();
		anchor.style.outline = 'none';
	}
	window.scrollTo(0, endLocation);
};