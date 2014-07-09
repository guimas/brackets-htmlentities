/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** 
    Simple extension that converts the selected text in the editor to a text with the correspondent html entities
*/
define(function (require, exports, module) {

    'use strict';

    var re_nonASCII = /[^\0-\x7F]/g,
        re_astralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
        entities = JSON.parse(require('text!./entities.json'));

    function getInverseObj(obj) {
        console.log(typeof (obj));
        return Object.keys(obj).sort().reduce(function (inverse, name) {
            inverse[obj[name]] = "&" + name + ";";
            return inverse;
        }, {});
    }

    function getInverseReplacer(inverse) {
        var single = [],
            multiple = [];

        Object.keys(inverse).forEach(function (k) {
            if (k.length === 1) {
                single.push("\\" + k);
            } else {
                multiple.push(k);
            }
        });

        //TODO add ranges
        multiple.unshift("[" + single.join("") + "]");

        return new RegExp(multiple.join("|"), "g");
    }

    function singleCharReplacer(c) {
        return "&#x" + c.charCodeAt(0).toString(16).toUpperCase() + ";";
    }

    function astralReplacer(c) {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var high = c.charCodeAt(0);
        var low = c.charCodeAt(1);
        var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
        return "&#x" + codePoint.toString(16).toUpperCase() + ";";
    }

    function encodeText(text) {
        var inverseHTML = getInverseObj(entities),
            htmlReplacer = getInverseReplacer(inverseHTML);

        function func(name) {
            return inverseHTML[name];
        }

        return text
            .replace(htmlReplacer, func)
            .replace(re_astralSymbols, astralReplacer)
            .replace(re_nonASCII, singleCharReplacer);
    }

    // á é í ó ó ç d & &amp;
    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        EditorManager = brackets.getModule('editor/EditorManager'),
        COMMAND_ID = "guimas.brackets-htmlentities.encode",
        MENU_NAME = "Convert to HTML entities";

    function handleHelloWorld() {
        var editor = EditorManager.getFocusedEditor();
        //console.log("Text: " + editor.getSelectedText());
        //console.log("Text encoded: " + encodeText(editor.getSelectedText()));
        editor.document.replaceRange(encodeText(editor.getSelectedText()), editor.getSelection().start, editor.getSelection().end);
    }

    CommandManager.register(MENU_NAME, COMMAND_ID, handleHelloWorld);

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    if (menu) {
        menu.addMenuDivider();
        menu.addMenuItem(COMMAND_ID, "Ctrl-&");
    }

});