// (function() {

// 'use strict';

// var page = {
// 	host: window.location.hostname,
// 	path: window.location.pathname
// };

// page.detect = function(path) {
// 	var type = '';
// 	switch ( true ) {
// 		case ( path.split('?')[0] === '/' ):
// 			type = 'search'; break;
// 		case ( path.split('?')[0] === '/favorites.php' ):
// 			type = 'favorites'; break;
// 		case ( path.split('?')[0] === '/uconfig.php' ):
// 			type = 'settings'; break;
// 		case ( path.split('/')[1] === 'g' ):
// 			type = 'gallery'; break;
// 		case ( path.split('/')[1] === 's' ):
// 			type = 'image'; break;
// 		case ( path.split('/')[1] === 'mpv' ):
// 			type = 'mpv'; break;
// 		default:
// 			type = 'unsupported'; break;
// 	}
// 	return type;
// };

// page.type = page.detect(page.path);

// page.process = function() {
// 	var data = {};

// }

// page.processGallery = function() {

// }

// if (page.type !== 'unsupported') {
// 	page.process();
// }

// if (page.type(page.path) === 'search' ||
// 		page.type(page.path) === 'browsing') {

// }

// console.log(JSON.stringify(page));

// })();
