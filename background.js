const defaultStorage = {
    bookmarks: [],
    keyBindings: {
        addBookmark: 87,// W
        jumpToPrevBookmark: 81,// Q
        jumpToNextBookmark: 69,// E
        setRepeatStart: 65,// A
        setRepeatEnd: 66,// B
        slower: 83,// S
        faster: 68,// D
        loop: 82,// R
        hide: 72// H
    },
    options:{
        latency: 1.5
    }
};

//每次tab更新時觸發(Youtube 切換影片必須要由這裡才偵測得到)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(changeInfo && changeInfo.status == "complete"){
        chrome.tabs.sendMessage(tabId, {action: "INIT"});
    }
});

// 安裝好先存入預設值(只執行一次)
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        chrome.storage.sync.set(defaultStorage, function() {
            if (chrome.runtime.error) {
                console.log("Runtime error.");
            }
        });
    }
});