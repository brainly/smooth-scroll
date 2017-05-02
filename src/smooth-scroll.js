import { easingPattern, getEndLocation, getViewportHeight, getDocumentHeight, adjustFocus } from './helpers';

const defaults = {
	speed: 500,
	easing: 'easeOutCubic',
	offset: 0,
	callback: function () { }
};

/**
 * Start/stop the scrolling animation
 * @public
 * @param {Node|Number} target  The element or position to scroll to
 * @param {Object}      options
 */
function animateScroll(target, options) {
	// Options
	var animateSettings = {};
	Object.assign(animateSettings, defaults, options || {});

	// Selectors and variables
	const isNum = (typeof target === 'number');
	if (!isNum && !(target instanceof Element))
		return;

	const offset = parseInt((typeof animateSettings.offset === 'function' ? animateSettings.offset() : animateSettings.offset), 10);
	const startLocation = window.pageYOffset; // Current location on the page
	const endLocation = isNum ? target : getEndLocation(target, offset); // Location to scroll to
	const distance = endLocation - startLocation; // distance to travel
	const timeEnd = parseInt(animateSettings.speed, 10);
	const documentHeight = getDocumentHeight();
	let timeLapsed = 0;
	let percentage;
	let position;
	let timeStart;
	let animationInterval;

	/**
	 * Loop scrolling animation
	 * @private
	 */
	const loopAnimateScroll = function (timestamp) {
		if (!timeStart) {
			timeStart = timestamp;
		}

		const frameLength = timestamp - timeStart;
		timeLapsed += frameLength;
		const percentage = Math.min((timeLapsed / timeEnd), 1);
		const newPosition = startLocation + (distance * easingPattern(animateSettings.easing, percentage));
		window.scrollTo(0, Math.floor(newPosition));

		var currentLocation = window.pageYOffset;
		if (newPosition === endLocation || currentLocation === endLocation || ((window.innerHeight + currentLocation) >= documentHeight)) {
			// Bring the anchored element into focus
			if (!isNum) {
				adjustFocus(target, endLocation);
				if (target.id) {
					location.hash = target.id;
				}
			}

			// Run callback after animation complete
			animateSettings.callback(target);
		} else {
			animationInterval = requestAnimationFrame(loopAnimateScroll);
		}
	};

	/**
	 * Reset position to fix weird iOS bug
	 * @link https://github.com/cferdinandi/smooth-scroll/issues/45
	 */
	if (window.pageYOffset === 0) {
		window.scrollTo(0, 0);
	}

	// Start scrolling animation
	requestAnimationFrame(loopAnimateScroll)
}

export default animateScroll;