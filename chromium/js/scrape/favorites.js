(function() {

'use strict';

console.log('scrape/favorites.js injected');

var detect = {};

// assuming list view
// thumbnail view doesn't display comments inline
var favorites = document.querySelectorAll('form table.itg tr.gtr0, form table.itg tr.gtr1');
console.log(favorites.length);

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

detect.favoriteComment = function(item) {
	var comment = item.querySelector('td.itd div[style="font-style:italic; clear:both; padding:3px 0 1px 5px"]');
	if (!comment) {
		return '';
	} else {
		return comment.textContent.slice('9'); // removes "Comment: "
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

[].forEach.call(favorites, function(favorite) {
	var info = {};

	// same schema as the official API
	// * = unofficial property
	info.title = favorite.querySelector('div.it5 a').textContent;
	info.gid = parseInt(favorite.querySelector('div.it5 a').href.split('/g/')[1].split('/')[0], 10);
	info.token = favorite.querySelector('div.it5 a').href.split('/g/')[1].split('/')[1];
	info.uploader = favorite.querySelector('td.itu div a').textContent;
	if ( favorite.querySelector('div.it2 img') ) {
		info.thumb = favorite.querySelector('div.it2 img').src;
	}
	info.category = favorite.querySelector('td.itdc img').alt;
	info.fcategory = detect.favoriteCategory(favorite); // *
	info.fcomment = detect.favoriteComment(favorite); // *
	info.expunged = detect.expunged(favorite);
	info.timestamp = (new Date).getTime().toString();

	chrome.runtime.sendMessage({saveFavorite: JSON.stringify(info)});
});

})();
