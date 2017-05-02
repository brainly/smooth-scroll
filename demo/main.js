import animateScroll from '../src/smooth-scroll.js';

const a = document.getElementById('link');
const destination = document.getElementById('destination');

a.addEventListener('click', e => {
    animateScroll(destination, {speed: 5000});
    e.preventDefault();
});