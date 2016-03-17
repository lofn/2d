(function() {

'use strict';

console.log('scrape/search.js injected');

var detect = {};

// assuming list view
// thumbnail view doesn't display comments inline
var results = document.querySelectorAll('table.itg tr.gtr0, table.itg tr.gtr1');
console.log(results.length);

detect.favoriteCategory = function(item) {
	var icon = item.querySelector('div.i[style*="/img/fav.png"]');
	if (!icon) {
		// no favorite
		return '+';
	} else {
		 // vertical offsets from style tag
		var categories = {
			a: '-2',
			b: '-21',
			c: '-40',
			d: '-59',
			e: '-78',
			f: '-97',
			g: '-116',
			h: '-135',
			i: '-154',
			j: '-173'
		};
		for (var category in categories) {
			if (icon.style.backgroundPosition.indexOf('0px ' + categories[category] + 'px') !== -1) {
				return category;
			}
		}
		// fall-through error state
		return '?';
	}
};

detect.tagFlags = function(item, gid) {
	var flags = item.querySelectorAll('div[title].tfl');
	if ( flags && flags.length > 0 ) {
		var flagdata = [];
		var colors = {
			red: '-1',
			orange: '-18',
			yellow: '-35',
			green: '-52',
			blue: '-69',
			purple: '-86'
		};
		[].forEach.call(flags, function(flagged) {
			var tagflagcolor = '';
			for (var color in colors ) {
				if ( flagged.style.backgroundPosition.indexOf('0px ' + colors[color] + 'px') !== -1 ) {
					tagflagcolor = color;
				}
			}
			if ( tagflagcolor.length > 0 ) {
				var data = {}
				data[tagflagcolor] = flagged.title;
				flagdata.push(data);
			}
		});
		if ( flagdata.length > 0 ) {
			var tagflagdata = {};
			tagflagdata.gid = gid;
			tagflagdata.tagflags = flagdata;
			chrome.runtime.sendMessage({saveTagFlagData: JSON.stringify(tagflagdata)});
		}
	}
};

detect.expunged = function(item) {
	var icon = item.querySelector('div.i img.n[src$="/img/e.png"]');
	if (!icon) {
		return false;
	} else {
		return true;
	}
};

[].forEach.call(results, function(result) {
	var info = {};

	// same schema as the official API
	// * = unofficial property
	info.title = result.querySelector('div.it5 a').textContent;
	info.gid = parseInt(result.querySelector('div.it5 a').href.split('/g/')[1].split('/')[0], 10);
	info.token = result.querySelector('div.it5 a').href.split('/g/')[1].split('/')[1];
	if ( result.querySelector('td.itu') ) { // uploader sometimes not present during failover mode
		info.uploader = result.querySelector('td.itu div a').textContent; 
	} else {
		info.uploader = '?';
	}
	if ( result.querySelector('div.it2 img') ) {
		info.thumb = result.querySelector('div.it2 img').src;
	}
	info.category = result.querySelector('td.itdc img').alt;
	info.fcategory = detect.favoriteCategory(result); // *
	info.expunged = detect.expunged(result);
	info.timestamp = (new Date).getTime().toString();

	chrome.runtime.sendMessage({saveGalleryData: JSON.stringify(info)});

	// tag flagging
	detect.tagFlags(result, info.gid);
});

})();
