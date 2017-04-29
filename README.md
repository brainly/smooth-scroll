# Smooth Scroll - Work In Progress
A simplified, modern version of the [original smooth scroll](https://github.com/cferdinandi/smooth-scroll).

```javascript
		const a = document.getElementById('link');
		const destination = document.getElementById('destination');
		const smooth = new SmoothScroll();

		a.addEventListener('click', e => {
			smooth.animateScroll(destination, {speed: 5000});
			e.preventDefault();
		});
```

## License

The code is available under the [MIT License](LICENSE.md).