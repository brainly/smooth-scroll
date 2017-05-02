# Smooth Scroll - Work In Progress
A simplified, modern version of the [original smooth scroll](https://github.com/cferdinandi/smooth-scroll).

```javascript
import animateScroll from './path/smooth-scroll.js';

const a = document.getElementById('link');
const destination = document.getElementById('destination');

a.addEventListener('click', e => {
	animateScroll(destination, {speed: 5000});
	e.preventDefault();
});
```

This version, compared to the original, is:

- it's 50% smaller
- it's an ES6 module
- it uses `requestAnimationFrame` instead of `setInterval`
- it doesn't include polyfills (closest, Object.assign / extend). If you really need them, include them yourself.
- it doesn't escape characters from hash (no [CSS.escape](https://github.com/mathiasbynens/CSS.escape))
- includes only two easing options (`easeOutCubic`, `easeInCubic`) instead of 12. If you need a different one, pass a function as an `easing` param.
- it doesn't track or measure your header. If you need it, measure it yourself and pass to the SmoothScroll via the `offset` param (you can also pass a function here).

## License

The code is available under the [MIT License](LICENSE.md).