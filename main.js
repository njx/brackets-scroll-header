/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, CodeMirror */

// BUGS:
// * WAY too slow on change events. Re-searches for all functions on each change.
// * In many files, horizontal position of the header text doesn't match its horizontal position in the document
//   (probably because of max line number width difference).
// * Function name isn't color-coded the same way as in the original document.
// * Horizontal position doesn't track document scroll position.
// * Line number in header isn't visible (it's pushed to the bottom of the header area).

// TODO:
// * Make it work for CSS media queries.

define(function (require, exports, module) {
    "use strict";
    
    var EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        JSUtils = brackets.getModule("language/JSUtils"),
        CSSUtils = brackets.getModule("language/CSSUtils");
    
    var $header, headerCM, editor, providers = [], curProvider;
    var ranges = [], curRange, visible = false;
    
    function register(provider) {
        providers.push(provider);
    }
    
    function hide() {
        $header.hide();
        visible = false;
    }
    
    function show() {
        $header.show();
        visible = true;
    }

    function update() {
        // find the topmost visible line and which range it's in
        var editorTop = $(editor._codeMirror.getWrapperElement()).offset().top,
            topLine = editor._codeMirror.coordsChar({x: 0, y: editorTop}).line,
            topLineY = editor._codeMirror.charCoords({line: topLine, ch: 0}).y,
            i,
            coords,
            newRange;

        // Even if the current top line is inside the current range, we still need to re-search
        // because it might be in a nested range.
        for (i = 0; i < ranges.length; i++) {
            if (topLine < ranges[i].lineStart) {
                break;
            } else if (topLine >= ranges[i].lineStart && topLine <= ranges[i].lineEnd) {
                newRange = ranges[i];
                // Don't break yet because we want to find the narrowest range.
            }
        }
        
        if (!newRange) {
            curRange = null;
            if (visible) {
                hide();
            }
            return;
        }
        
        if (newRange !== curRange) {
            curRange = newRange;
            headerCM.setOption("mode", editor._codeMirror.getOption("mode"));
            headerCM.setOption("theme", editor._codeMirror.getOption("theme"));
            headerCM.setOption("lineNumbers", editor._codeMirror.getOption("lineNumbers"));
            headerCM.setOption("firstLineNumber", topLine + 1);
            headerCM.setValue(editor._codeMirror.getLine(curRange.lineStart));

            coords = editor._codeMirror.charCoords({line: 0, ch: 0});
            var height = coords.yBot - coords.y + 4;
            $header.height(height);
            $(headerCM.getScrollerElement()).height(height);
        }
        
        if (topLine === curRange.lineEnd) {
            $header.css("top", topLineY - editorTop);
        } else {
            $header.css("top", 0);
        }
        
        if (!visible) {
            show();
            headerCM.refresh();
        }
    }
    
    function handleDocumentChange(editor, changeList) {
        // update ranges based on change
        ranges = curProvider.updateHeaders(editor, changeList)
            .sort(function (a, b) {
                return a.lineStart - b.lineStart;
            });
        curRange = null;
        update();
    }
    
    function setEditor() {
        // We only deal with the outer editor (not inline editors).
        var curEditor = EditorManager.getCurrentFullEditor(), i;
        if (curEditor === editor) {
            return;
        }
        
        if (editor) {
            $(editor).off("scroll", update);
            $(editor.document).off("change", handleDocumentChange);
        }
        hide();
        ranges = [];
        curRange = null;
        editor = curEditor;
        if (editor) {
            for (i = 0; i < providers.length; i++) {
                // TODO: how to handle mixed mode?
                if (providers[i].canHandle(editor)) {
                    curProvider = providers[i];
                    break;
                }
            }
            if (curProvider) {
                $(editor).on("scroll", update);
                $(editor.document).on("change", handleDocumentChange);
                handleDocumentChange(editor);
                update();
            }
        }
    }

    // JS provider (function definitions)
    register({
        canHandle: function (editor) {
            return (editor.getModeForSelection() === "javascript");
        },
        updateHeaders: function (editor, changeList) {
            // TODO: incrementally update ranges. This is way too slow.
            return JSUtils.findAllMatchingFunctionsInText(editor.document.getText(), "*");
        }
    });
    
    // CSS provider (media queries--should we also do selectors?)
    register({
        canHandle: function (editor) {
            return (editor.getModeForSelection() === "css");
        },
        updateHeaders: function (editor, changeList) {
            // TODO: incrementally update ranges. This is way too slow.
            var mediaQueries = CSSUtils.parse(editor.document.getText()).mediaQueries,
                headers = [];
            mediaQueries.forEach(function (mq) {
                headers.push({
                    lineStart: mq.ruleStartLine,
                    lineEnd: mq.ruleEndLine
                });
            });
            return headers;
        }
    });
    
    // Initialize extension
    ExtensionUtils.loadStyleSheet(module, "styles.css");
    $header = $("<div id='brackets-scroll-header'></div>")
        .appendTo($("#editor-holder"))
        .hide();
    headerCM = new CodeMirror($header.get(0));
    $(".CodeMirror-scroll", $header).css("background", "transparent");
    $(".CodeMirror-lines", $header).css({
        paddingTop: 2,
        paddingBottom: 2
    });
    
    $(EditorManager).on("focusedEditorChange", setEditor);
    setEditor();
});
