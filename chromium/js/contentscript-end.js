(function() {

'use strict';

var page = {
	host: window.location.hostname,
	path: window.location.pathname
};

/*
	add support for recent tagging history?
	https://forums.e-hentai.org/index.php?showtopic=162493
*/

page.detect = function(path) {
	var errText = [ // need to add 503 error text
		/*
			failover mode error messages; also note that during failover mode:
			* '_250.jpg' cover thumbnails for new galleries may not be generated (http 404)
			* uploader name may be completely missing from search table/gallery pages
			* tag flagging doesn't function
		*/
		'err',
		'The site is currently in Read Only Mode. This page is therefore not available.',
		'tools cannot be used from the secondary cluster',
		/*
			http://ehwiki.org/wiki/Technical_Issues
		*/
		'Error 503 - Service Unavailable', // remove hyphen?
		'Error 509 - Bandwidth Exceeded', // remove hyphen?
		'You are opening pages too fast, thus placing a heavy load on the server. Back down, or your IP address will be automatically banned.',
		'Key missing, or incorrect key provided.',
		'No ACL entry',
		'Keep trying.',
		'eeenope',
	];
	switch ( true ) {
		case ( errText.indexOf(document.body.firstChild.textContent) !== -1 ):
			return 'error';
		case ( path.split('?')[0] === '/' ):
		case ( path.split('/')[1] === 'tag' ):
		case ( path.split('/')[1] === 'uploader' ):
			return 'search';
		case ( path.split('?')[0] === '/favorites.php' ):
			return 'favorites';
		case ( path.split('?')[0] === '/uconfig.php' ):
			return 'settings';
		case ( path.split('/')[1] === 'g' ):
			return 'gallery';
		case ( path.split('/')[1] === 's' ):
			return 'image';
		case ( path.split('/')[1] === 'mpv' ):
			return 'mpv';
		default:
			return 'unsupported';
	}
};

page.type = page.detect(page.path);

console.log(JSON.stringify(page));

page.init = function() {
	var supported = [ 'favorites', 'gallery', 'search' ];
	if ( supported.indexOf(page.type) !== -1 ) {
		console.log('init ' + page.type);
		chrome.runtime.sendMessage({ init: page.type });
	}
};

page.init();

})();
