// 取得 storage
var getStorage = () => {
	return new Promise(function(resolve, reject){
		chrome.storage.sync.get(null, function(storage) {
			if (chrome.runtime.error) {
				reject(chrome.runtime.error);
			} else {
				resolve(storage);  
			}
		});
	});
};

// 初始化
document.body.onload = function() {
	getStorage()
	.then(function(storage){
		var keyBindings = storage.keyBindings;
		var shortcutText = document.getElementById('shortcut').innerHTML;
		shortcutText = shortcutText.replace("{addBookmark}", String.fromCharCode(keyBindings.addBookmark));
		shortcutText = shortcutText.replace("{jumpToPrevBookmark}", String.fromCharCode(keyBindings.jumpToPrevBookmark));
		shortcutText = shortcutText.replace("{jumpToNextBookmark}", String.fromCharCode(keyBindings.jumpToNextBookmark));
		shortcutText = shortcutText.replace("{setRepeatStart}", String.fromCharCode(keyBindings.setRepeatStart));
		shortcutText = shortcutText.replace("{setRepeatEnd}", String.fromCharCode(keyBindings.setRepeatEnd));
		document.getElementById('shortcut').innerHTML = shortcutText;
	});

    document.getElementById("options").addEventListener('click', (e) => {
        window.open(chrome.runtime.getURL("options.html"));
    });

    document.getElementById("feedback").addEventListener('click', (e) => {
    	window.open("https://github.com/chiubeta/video_bookmarker/issues");
    });

    document.getElementById("about").addEventListener('click', (e) => {
    	window.open("https://github.com/chiubeta/video_bookmarker");
    });
}