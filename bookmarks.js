var addTable = function(storage) {
    let bookmarks = storage.bookmarks;
    let $tbody = $("#tabledata").find("tbody");
    let record = $("#record").html();
    
    var index = 1;
    for(var i=0,len=bookmarks.length; i<len; i++){
        var tr = record;
        tr = tr.replace(/{index}/g, index++);
        tr = tr.replace(/{valueIndex}/g, i);
        tr = tr.replace(/{name}/g, bookmarks[i].name);
        tr = tr.replace(/{url}/g, bookmarks[i].url);
        tr = tr.replace(/{time}/g, bookmarks[i].updateTime);
        $tbody.append(tr);
    }
};

var deleteCheckedItems = function(bookmarks) {
    // Get selected items
    var deleteList = [];
    $(".select:checked").toArray().forEach(function(item, index){
        deleteList.push(item.value);
    });

    // Filter data
    bookmarks = bookmarks.filter(function(item, index){
        return !deleteList.includes(index.toString());
    });

    setStorage({bookmarks: bookmarks});
};

var saveModification = function(bookmarks, modifingIndex) {
    bookmarks[modifingIndex] = $.editor.get();
    setStorage({bookmarks: bookmarks});
};

var setStorage = function(data) {
    chrome.storage.sync.set(data, function() {
      if (chrome.runtime.error) { console.log("Runtime error."); }
      else {
        // Refresh
        history.go(0);
      }
    });
};

var hideEditor = function() {
    document.getElementById("jsoneditor1").style.display = "none";
};

var showEditor = function() {
    document.getElementById("jsoneditor1").style.display = "block";
    window.scrollTo(0, $("#jsoneditor1").offset().top);
    $("#saveBtn").css("display", "inline-block");
};

var eventBinding = function(storage) {
    var bookmarks = storage.bookmarks;
    var modifingIndex;

    // selectAll checkbox
    $("#selectAll").on("change", function(e){
        $(".select").prop("checked", e.target.checked);
    });

    // Save modification button
    $("#saveBtn").on("click", function(e){
        saveModification(bookmarks, modifingIndex);
    });

    // Delete button
    $("#deleteBtn").on("click", function(e){
        deleteCheckedItems(bookmarks);
    });

    // Modify button
    $(".modify").on("click", function(e){
        modifingIndex = this.value;
        var bookmark = bookmarks[this.value];

        $.editor.set(bookmark);
        showEditor();
    });

    // Ctrl+S to save modification
    $(window).on("keydown", function(e){
        if(e.ctrlKey && e.keyCode == 'S'.charCodeAt(0) && modifingIndex){
            e.preventDefault();
            saveModification(bookmarks, modifingIndex);
        }
    });
};

document.addEventListener('DOMContentLoaded', function () {

    // get chrome.storage
    chrome.storage.sync.get(null, function(storage) {
        if (chrome.runtime.error) {
            console.log("Runtime error.");
        } else {
            // Render bookmarks
            addTable(storage);
            // Event binding
            eventBinding(storage);
        }

        //json editor
        $.editor = new JSONEditor(document.getElementById("jsoneditor1"), {});
        hideEditor();
    });
});
