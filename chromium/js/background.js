(function() {

'use strict';

/*

	favoritesDB, data scraped from browsing favorites pages

	each item contains the following properties

		{
			title: (english)
			gid:
			token:
			uploader:
			thumb: (full path, including hostname)
			category: (gallery category)
			fcategory: (favorite category)*
			fcomment: (favorite comment)*
			expunged:
			timestamp: (new Date).getTime().toString()*
		}

	* = not part of official API

*/

var favoritesDB = localforage.createInstance({ name: 'favoritesDB' });

/*

	apiDB, cached responses from official API with "namespace": 1

	contains the properties listed http://ehwiki.org/wiki/API, plus the following

		{
			timestamp: (new Date).getTime().toString()*
		}

	* = not part of official API

	note that the category names are different via api vs scraped from site

	data is kept until cleared, but stale data (>24h) is refreshed when possible

*/

var apiDB = localforage.createInstance({ name: 'apiDB' });

/*

	galleriesDB, data scraped from browsing gallery pages/search results

	each item contains the following properties

		{
			title:
			title_jpn: +
			gid:
			token:
			uploader:
			ucomment: (uploader comment)*+
			category:
			fcategory: (favorite category)*
			fcount: (favorite count)*
			thumb: for larger thumb replace _l.jpg with _250.jpg
			thumbs: (array of page thumbnails)*+
			tags:
			timestamp: (new Date).getTime().toString()*
		}
	
	+ = when browsing gallery pages (not implemented yet)
	* = not part of official API

*/

var galleriesDB = localforage.createInstance({ name: 'galleriesDB' });

/*

	tagFlagsDB

	array of objects; [{"color": "flagged:tags", "etc"}]

*/

var tagFlagsDB = localforage.createInstance({ name: 'tagFlagsDB' });

/* ****************************************************************************** */

var handler = {};
handler.galleryQueue = []; // array of strings in "gid:token" format
handler.lastAPIcallTime = (new Date).getTime();

/* ****************************************************************************** */

handler.galleryQueueAdd = function(gid, token) {
	var galleryitem = '' + gid + ':' + token;
	if ( handler.galleryQueue.indexOf(galleryitem) === -1 ) {
		handler.galleryQueue.push(galleryitem);
	}
	if ( handler.timeout ) {
		clearTimeout(handler.timeout);
	}
	handler.timeout = setTimeout(function() {
		handler.processGalleryQueue();
	}, 350);
};


// rate-limit gdata API calls to approx 1 every 5000ms

handler.getGalleryDataFromAPI = function(galleryitems) {
	handler.lastAPIcallTime = (new Date).getTime();
	
	var gdata = {};
	gdata.method = 'gdata';
	gdata.namespace = 1;

	var gidlist = [];
	galleryitems.forEach(function(galleryitem) {
		galleryitem = galleryitem.split(':');
		galleryitem[0] = parseInt(galleryitem[0], 10);
		gidlist.push(galleryitem);
	});
	gdata.gidlist = gidlist;

	console.log('requesting data from api for ' + gidlist.length + ' / '+ JSON.stringify(gidlist));
	console.log(handler.timeout);

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if ( xhr.readyState === 4 ) {
			if ( xhr.status === 200 ) {
				// successful api request
				var apiResponse = JSON.parse(xhr.responseText);
				if ( apiResponse && apiResponse.gmetadata && apiResponse.gmetadata.length > 0 ) {
					apiResponse.gmetadata.forEach(function(data) {
						data.timestamp = (new Date).getTime().toString();
						// prevent jsx double-escaping
						if ( data.title.indexOf('&') !== -1 ) {
							data.title = data.title.replace(/&amp;/g, '&')
								.replace(/&lt;/g, '<')
								.replace(/&gt;/g, '>')
								.replace(/&quot;/g, '"')
								.replace(/&#039;/g, "'");
						}
						apiDB.setItem(data.gid.toString(), data);
					});
				}
			} else {
				console.log('  api http error ' + status);
			}
		}
	}
	xhr.open('POST', 'http://g.e-hentai.org/api.php', true);
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.timeout = 3000;
	xhr.ontimeout = function() { console.log(' api call timed out'); }
	xhr.send(JSON.stringify(gdata));
}

handler.processGalleryQueue = function() {
	if ( handler.galleryQueue.length > 0 ) {
		var currentTime = (new Date).getTime();
		var currentQueueLength = handler.galleryQueue.length;
		var nextAPICall = [];
		if ( currentTime - handler.lastAPIcallTime > 5 * 1000 ) {
			for ( var i = 0; i < currentQueueLength; i++ ) {
				if ( nextAPICall.length < 25 ) {
					nextAPICall.push(handler.galleryQueue.shift());
				}
			}
			console.log('api call length: '+nextAPICall.length+' / remaining in queue: ' + handler.galleryQueue.length);
			handler.getGalleryDataFromAPI(nextAPICall);
			if ( handler.galleryQueue.length > 0 ) { // limit to 2 during testing with && handler.timeout < 2 
				handler.timeout = setTimeout(function() {
					handler.processGalleryQueue();
				}, 5001);
			}
		} else {
			handler.timeout = setTimeout(function() {
					handler.processGalleryQueue();
			}, 5001 - (currentTime - handler.lastAPIcallTime) );
		}
	}
};

/* ****************************************************************************** */

handler.executeScriptsFromFile = function(tab, scripts) {
	if ( scripts.length > 0 ) {
		var script = scripts.shift();
		chrome.tabs.executeScript(tab, { file: script }, function() {
			handler.executeScriptsFromFile(tab, scripts);
		});
	}
};

handler.insertStylesheetsFromFile = function(tab, stylesheets) {
	if ( stylesheets.length > 0 ) {
		var stylesheet = stylesheets.shift();
		chrome.tabs.insertCSS(tab, { file: stylesheet }, function() {
			handler.insertStylesheetsFromFile(tab, stylesheets);
		});
	}
};

/* ****************************************************************************** */

handler.init = function(sender, initType) {
	if ( initType === 'favorites' ) {
		console.log(' from favorites');
		console.log(JSON.stringify(sender));

		console.log(' injecting css');
		handler.insertStylesheetsFromFile(sender.tab.id, [
			'/css/lib/mui.min.css',
			// '/css/thumbnailview.css'
		]);

		console.log(' injecting js/react');
		handler.executeScriptsFromFile(sender.tab.id, [
			'/js/lib/react.min.js',
			'/js/lib/react-dom.min.js',
			'/js/scrape/favorites.js'
		]);

	} else if ( initType === 'gallery' ) {
		handler.executeScriptsFromFile(sender.tab.id, [
			'/js/scrape/gallery.js'
		]);
	} else if ( initType === 'search' ) {
		handler.insertStylesheetsFromFile(sender.tab.id, [
			'/css/lib/mui.min.css',
		]);
		handler.executeScriptsFromFile(sender.tab.id, [
			'/js/scrape/search.js',
			'/js/lib/mui.min.js',
			'/js/lib/react.min.js',
			'/js/lib/react-dom.min.js',
			'/js/ui/search/searchpage.js'
		]);
	}
};

/* ****************************************************************************** */

// https://jsperf.com/indexof-vs-object-lookup/4 (worst case, doesn't exist)
// https://jsperf.com/indexof-vs-object-lookup/32 (best case, exists)

handler.saveFavorite = function(message) {
	var favorite = JSON.parse(message);
	if ( favorite.gid ) {
		favoritesDB.setItem(favorite.gid.toString(), favorite);
	}
};

handler.saveGalleryData = function(message) {
	var data = JSON.parse(message);
	if ( data.gid ) {
		galleriesDB.setItem(data.gid.toString(), data);
	}
};

handler.saveTagFlagData = function(message) {
	var data = JSON.parse(message);
	if ( data && data.gid && data.tagflags && data.tagflags.length > 0 ) {
		tagFlagsDB.setItem(data.gid.toString(), data.tagflags);
	}
};

/* ****************************************************************************** */

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if ( request.init ) {
			handler.init(sender, request.init);
		} else if ( request.saveFavorite ) {
			handler.saveFavorite(request.saveFavorite);
		} else if ( request.saveGalleryData ) {
			handler.saveGalleryData(request.saveGalleryData);
		} else if ( request.saveTagFlagData ) {
			handler.saveTagFlagData(request.saveTagFlagData);
		}
	}
);

/* ****************************************************************************** */

// standard runtime messaging doesn't work with localforage callbacks, use ports instead

chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name == 'galleryData');
	port.onMessage.addListener(function(msg) {
		if ( msg.getTagFlagData ) {
			tagFlagsDB.getItem(msg.getTagFlagData.toString(), function(err, tagFlagData) {
				if ( tagFlagData ) {
					port.postMessage({ tagflags: tagFlagData });
				}
			});
		} else if ( msg.getFavoriteCategory) {
			galleriesDB.getItem(msg.getFavoriteCategory.toString(), function(err, scrapedData) {
				if ( scrapedData && scrapedData.fcategory ) {
					port.postMessage({ fcategory: scrapedData.fcategory });
				}
			});
		} else if ( msg.getGalleryData ) {
			apiDB.getItem(msg.getGalleryData.toString(), function(err, apiData) {
				if ( apiData ) {
					// got cached api response
					port.postMessage({ source: 'api', metadata: apiData });
					if ( !apiData.timestamp || (new Date).getTime() - parseInt(apiData.timestamp, 10) > 24 * 60 * 60 * 1000 ) {
						// refresh api data if older than 24h
						// maybe change this to: if gallery was uploaded within the past month && api data older than 24h
						// else, refresh if data older than 7d
						// add a slight delay so that these get added last
						handler.galleryQueueAdd(apiData.gid, apiData.token);
					}
				} else {
					// no api data? delve into callback hell to provide data from backup sources
					// add to queue if found
					galleriesDB.getItem(msg.getGalleryData.toString(), function(err, scrapedData) {
						if ( scrapedData ) {
							port.postMessage({ source: 'scraped', metadata: scrapedData });
							handler.galleryQueueAdd(scrapedData.gid, scrapedData.token);
						} else {
							// if we get to here, something probably broke, but try the favoritesdb anyways
							favoritesDB.getItem(msg.getGalleryData.toString(), function(err, favoriteData) {
								if ( favoriteData ) {
									port.postMessage({ source: 'favorites', metadata: favoriteData });
									handler.galleryQueueAdd(favoriteData.gid, favoriteData.token);
								} else {
									console.log('  no data');
									port.postMessage({ source: 'nodata', metadata: {} });
								}
							});
						}
					});
				}
			});
		}
	});
});

})();
