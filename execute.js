var $video;
var bookmarks;
var bookmark;
var isHide;
var repeat_start;
var repeat_end;
var repeatKey;
var channel;
var channels;

const reset = () => {  
  $video = undefined;
  bookmarks = [];
  bookmark = {
    timeList: []
  };
  isHide = false;
  repeat_start = undefined;
  repeat_end = undefined;
  repeatKey = undefined;
  channel = {};
  channels = [
    {
      urlPattern: "www.youtube.com",
      progressSelector: "#player-container .ytp-progress-bar-container"
    }, {
      urlPattern: "vimeo.com",
      progressSelector: ".vp-progress"
    }, {
      urlPattern: "www.bilibili.com",
      progressSelector: ".bilibili-player-video-progress-slider"
    }, {
      urlPattern: "nicovideo.jp",
      progressSelector: ".ProgressBar:first"
    }
  ];
};

// 取得當前頁面的精簡 url
const getFormattedUrl = () => {
  let ytParam = "";
  let url = window.location.href;
  let paramIdx = (url.indexOf("?") == -1)? url.length: url.indexOf("?");
  if(url.indexOf("www.youtube.com") != -1){
    ytParam = url.substr(url.indexOf("?v="), 14);
  }
  return url.substring(0, paramIdx) + ytParam; 
};

// 取得 storage
const getStorage = () => {
	return new Promise(function(resolve, reject){
		chrome.storage.sync.get(null, function(data) {
			if (chrome.runtime.error) {
				// console.err("Runtime error.");
				reject(chrome.runtime.error);
			} else {
				resolve(data);  
			}
		});
	});
};

// 儲存 storage
const setStorage = () => {
  chrome.storage.sync.set({
		bookmarks: bookmarks
	}, function() {
		// if (chrome.runtime.error) {
		// 	console.err("Runtime error.");
		// }
	});
};

const keydownBinding = (storage) => {
  var latency = storage.options.latency;
  $(window)
  .off("keydown.video_bookmarks")
  .on("keydown.video_bookmarks", function(e){
    if(e.target.tagName == "INPUT"){
      return ;
    }

    var currentTime = $video[0].currentTime;
    if(e.keyCode == storage.keyBindings.addBookmark){
        e.preventDefault();
        if(bookmark.timeList.length == 0){
          bookmark.url = getFormattedUrl();
          bookmark.name = $("title").text();
        }
        bookmark.timeList.push(currentTime);
        bookmark.timeList.sort(function(a, b){return a-b;});
        bookmark.updateTime = new Date().toLocaleString();
        // 將書籤存到 Chrome storage
        setStorage();
        // 將書籤顯示在進度條上
        renderBookmark(currentTime);
    } else if(e.keyCode == storage.keyBindings.jumpToPrevBookmark){
        e.preventDefault();
        var timeList = bookmark.timeList;
        var len = timeList.length;
        if(currentTime < timeList[0]+latency){
          setVideoTime(timeList[len-1]);
        } else if(currentTime >= timeList[len-1]+latency){
          setVideoTime(timeList[len-1]);
        } else {
          for(var i=0; i<len; i++){
            if(timeList[i]+latency > currentTime){
              setVideoTime(timeList[i-1]);
              break;
            }
          }
        }
    } else if(e.keyCode == storage.keyBindings.jumpToNextBookmark){
      e.preventDefault();
      var timeList = bookmark.timeList;
      var len = timeList.length;
      if(currentTime > timeList[len-1]-latency){
        setVideoTime(timeList[0]);
      } else if(currentTime <= timeList[0]-latency){
        setVideoTime(timeList[0]);
      } else {
        for(var i=len-1; i>=0; i--){
          if(timeList[i]-latency < currentTime){
            setVideoTime(timeList[i+1]);
            break;
          }
        }
      }
    } else if(e.keyCode == storage.keyBindings.setRepeatStart){
      e.preventDefault();
      repeat_start = currentTime;
      renderRepeat("A");
    } else if(e.keyCode == storage.keyBindings.setRepeatEnd && repeat_start){
      e.preventDefault();
      if(repeat_start && currentTime > repeat_start){
        repeat_end = currentTime;
        renderRepeat("B");
  
        repeatAB();
      }
    } else if(e.keyCode == storage.keyBindings.slower){
      e.preventDefault();
      $video[0].playbackRate -= 0.1;
    } else if(e.keyCode == storage.keyBindings.faster){
      e.preventDefault();
      $video[0].playbackRate += 0.1;
    } else if(e.keyCode == storage.keyBindings.loop){
      e.preventDefault();
      $video[0].loop = !$video[0].loop;
    } else if(e.keyCode == storage.keyBindings.hide){
      e.preventDefault();
      $(".video-bookmarker-bookmark").css("display", (isHide)? "block": "none");
      $(".video-bookmarker-repeatMark").css("display", (isHide)? "block": "none");
      isHide = !isHide;
    }
  });
};

// 移除進度條上的書籤
const cleanBookmark = () => {
  return new Promise((resolve, reject) => {
    waitUntilElementAvailable(channel.progressSelector)
    .then(function() {
      $(channel.progressSelector).find(".video-bookmarker-bookmark").remove();
      $(channel.progressSelector).find("style").remove();
      resolve();
    }, function() {
      resolve();
    });
  });
};

// 將書籤顯示在進度條上
const renderBookmark = (currentTime) => {
  waitUntilElementAvailable(channel.progressSelector)
  .then(function() {
    let positionLeft = Math.round((currentTime / $video[0].duration)* 100) + "%";
    let $bookmarkElem = $("<div></div>").addClass("video-bookmarker-bookmark").data("time", currentTime).css({
      "left": positionLeft
    });
    $(channel.progressSelector).append($bookmarkElem);
  });
};

// 將A、B顯示在進度條上
const renderRepeat = (type) => {
  // 先把舊的移除
  $(channel.progressSelector).find(".video-bookmarker-repeatMark[data-type="+type+"]").remove();
  // 計算位置後放到 progress bar 上
  let currentTime = $video[0].currentTime;
  let positionLeft = (currentTime / $video[0].duration)* 100 + "%";
  let $repeatMarkElem = $("<div data-type="+type+">"+type+"</div>").addClass("video-bookmarker-repeatMark").css({
    "left": positionLeft
  });
  $(channel.progressSelector).append($repeatMarkElem);
};

const repeatAB = () => {
  setVideoTime(repeat_start);
  repeatKey = setInterval(()=>{
    if($video[0].currentTime >= repeat_end){
      setVideoTime(repeat_start);
    }
  }, 200);
};

const queryVideoElem = () => {  
  $video = $("video:first");

  var url = window.location.href;
  for (var i=0,len=channels.length; i<len; i++) {
    if(url.indexOf(channels[i].urlPattern) != -1){
      channel = channels[i];
      break;
    }
  }
};

const setVideoTime = (time) => {  
  $video[0].currentTime = time;
};

const progressBarEventBinding = () => {  
  waitUntilElementAvailable(channel.progressSelector)
  .then(function() {
    let style = 
    $(`<style>
      .video-bookmarker-bookmark {
        width: 6px;
        height: 7px;
        z-index: 999998;
        background-color: lightgray;
        position: absolute;
      }

      .video-bookmarker-repeatMark {
        width: 8px;
        height: 7px;
        z-index: 999999;
        color: lightgray;
        position: absolute;
        text-shadow: 3px 2px 0 #000, -1px 2px 0 #000, 2px 1px 0 #000, -1px 2px 0 #000, 2px 2px 0 #000;
      }

      .video-bookmarker-bookmark:hover,
      .video-bookmarker-bookmark:focus {
        border-radius: 10px;
        background-color: yellow;
        transition: background-color 0.5s;
        -webkit-transition: background-color 0.5s;
      }
    </style>`);
    $(channel.progressSelector).append(style);

    // 點一下跳到該書籤位置
    $(channel.progressSelector).on("click", ".video-bookmarker-bookmark", function(e){
      setVideoTime($(e.target).data("time"));
    });

    // 點兩下移除書籤
    $(channel.progressSelector).on("dblclick", ".video-bookmarker-bookmark", function(e){
      if(bookmark.timeList.length == 1){
        bookmark.timeList = [];
        bookmarks.splice(bookmarks.indexOf(bookmark), 1);
      } else {
        let time = $(e.target).data("time");
        bookmark.timeList.splice(bookmark.timeList.indexOf(time), 1);
      }
      $(e.target).remove();
      setStorage();
    });

    // 點兩下移除AB循環
    $(channel.progressSelector).on("dblclick", ".video-bookmarker-repeatMark", function(e){
      clearInterval(repeatKey);
      $(e.target).parent().find(".video-bookmarker-repeatMark").remove();
    });
  });
};

const init = () => { 
  reset();
  queryVideoElem();

  if($video.length > 0){
    waitUntilVideoReady()
    .then(function() {
      // 第一次進來要將書籤從進度條上清除
      return cleanBookmark();
    })
    .then(function() {
      // 從 storage 取回之前儲存的書籤並載入
      return getStorage();
    })
    .then(function(storage){
      let url = getFormattedUrl();
      bookmarks = storage.bookmarks;
      for(var i=0,len=bookmarks.length; i<len; i++){
        if(bookmarks[i].url == url){
          // 曾經建立過書籤
          bookmark = bookmarks[i];
          // 將書籤顯示在進度條上
          for(var i=0,len=bookmark.timeList.length; i<len; i++){
            renderBookmark(bookmark.timeList[i]);
          }
          break;
        }
      }
      if(!bookmark.url){
        // 尚未建立書籤
        bookmarks.push(bookmark);
      }
      progressBarEventBinding();
      keydownBinding(storage);
    });
  }
};

// 回傳promise，直到指定的頁面元素出現在畫面上，才會resolved
const waitUntilElementAvailable = (elementSelector) => {
  if(elementSelector){
    // 判斷該元素是否顯示在畫面上
    const isElementVisible = () => {
      return $(elementSelector).length > 0;
    };

    return new Promise(function (resolve, reject) {
      // 如果該元素已經在畫面上了，立刻resolve，不用在下面多等一秒
      if (isElementVisible()) {
        resolve();
      } else {
        var maxWaitTime = 10;
        var second = 0;
        var counterKey = setInterval(function(){
          if (isElementVisible()) {
            clearInterval(counterKey);
            resolve();
          } else if(second == maxWaitTime){
            clearInterval(counterKey);
            reject();
          }
          second++;
        }, 1000);
      }
    });
  } else {
    return Promise.reject();
  }
};

// 回傳promise，直到影片讀取進來，才會resolved
const waitUntilVideoReady = () => {
  // 判斷影片是否已讀取進來
  const isVideoReady = () => {
    return $video[0].readyState == 4;
  };

  return new Promise(function (resolve, reject) {
    var maxWaitTime = 40;
    var second = 0;
    var counterKey = setInterval(function(){
      if (isVideoReady()) {
        clearInterval(counterKey);
        resolve();
      } else if(second == maxWaitTime){
        clearInterval(counterKey);
        reject();
      }
      second++;
    }, 500);
  });
};

// 與background.js之間的橋樑
const onMessage = (message) => {
  switch (message.action) {
    case 'INIT':
      // 初始化
      init();
      break;
    default:
      break;
  }
}

// 接收從background.js傳來的資料
chrome.runtime.onMessage.addListener(onMessage);