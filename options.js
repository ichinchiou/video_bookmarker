const keyCodeAliases = {
    0: 'null',
    null: 'null',
    undefined: 'null',
    32: 'Space',
    96: 'Num 0',
    97: 'Num 1',
    98: 'Num 2',
    99: 'Num 3',
    100: 'Num 4',
    101: 'Num 5',
    102: 'Num 6',
    103: 'Num 7',
    104: 'Num 8',
    105: 'Num 9',
    106: 'Num *',
    107: 'Num +',
    109: 'Num -',
    110: 'Num .',
    111: 'Num /',
    186: ';',
    188: '<',
    189: '-',
    187: '+',
    190: '>',
    191: '/',
    192: '~',
    219: '[',
    220: '\\',
    221: ']',
    222: '\'',
};
var keyBindings = {};

const recordKeyPress = function(e) {
  if (
    (e.keyCode >= 48 && e.keyCode <= 57)    // Numbers 0-9
    || (e.keyCode >= 65 && e.keyCode <= 90) // Letters A-Z
    || keyCodeAliases[e.keyCode]            // Other character keys
  ) {
    e.target.value = keyCodeAliases[e.keyCode] || String.fromCharCode(e.keyCode);
    e.target.keyCode = e.keyCode;

    e.preventDefault();
    e.stopPropagation();
  } else if (e.keyCode === 8) { // Clear input when backspace pressed
    e.target.value = '';
  } else if (e.keyCode === 27) { // When esc clicked, clear input
    e.target.value = 'null';
    e.target.keyCode = null;
  }

  keyBindings[e.target.id] = e.keyCode;
};

const inputFilterNumbersOnly = function(e) {
  var char = String.fromCharCode(e.keyCode);
  if (!/[\d\.]$/.test(char) || !/^\d+(\.\d*)?$/.test(e.target.value + char)) {
    e.preventDefault();
    e.stopPropagation();
  }
};

const updateCustomShortcutInputText = function(inputItem, keyCode) {
    inputItem.value = keyCodeAliases[keyCode] || String.fromCharCode(keyCode);
    inputItem.keyCode = keyCode;
};

const saveOptions = function() {
    chrome.storage.sync.set({
        keyBindings: keyBindings
    }, function() {
        if (chrome.runtime.error) {
            console.log("Runtime error.");
        }
    });
};

const restore_options = function() {
    chrome.storage.sync.get(null, function(storage) {
        if (chrome.runtime.error) {
            console.log("Runtime error.");
        } else {
            keyBindings = storage.keyBindings;
            for (let action of Object.keys(keyBindings)) {
                updateCustomShortcutInputText(document.querySelector("#" + action), keyBindings[action]);
            }
            options = storage.options;
            for (let item of Object.keys(options)) {
                document.querySelector("#" + item).value = options[item];
            }
        }
    });
};

document.addEventListener('DOMContentLoaded', function () {
    restore_options();

    document.getElementById("bookmarksBtn").addEventListener('click', (e) => {
        window.open(chrome.runtime.getURL("bookmarks.html"));
    });

    document.getElementById("saveOptionsBtn").addEventListener('click', (e) => {
        saveOptions(e);
    });
    Array.from(document.getElementsByClassName("keyBinding")).forEach(link => {
        link.addEventListener('keypress', e => {
            inputFilterNumbersOnly(e);
        });
        link.addEventListener('keydown', e => {
            recordKeyPress(e);
        });
        link.addEventListener('focus', e => {
            e.target.value = "";
        });
        link.addEventListener('blur', e => {
            e.target.value = keyCodeAliases[e.target.keyCode] || String.fromCharCode(e.target.keyCode);
        });
    });
});