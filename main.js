/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, CodeMirror */

define(function (require, exports, module) {
    "use strict";
    
    var EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    
    var $header, headerCM, editor, visible = false;
    
    function handleScroll() {
        // TODO: have different providers for different file types
        
        // setTimeout?
        // find the topmost visible line
        // if header is visible and topmost visible line is the end of the range, scroll header out
        // else if header is invisible and topmost visible line is a header, show and position the header
        
        // TODO: should header be opaque?
    }
    
    function handleDocumentChange() {
        // TODO: stupid, expensive--should only update if the visible text is edited
        // (which generally shouldn't happen)
        if (visible) {
            headerCM.setText(editor.document.getText());
        }
    }
    
    function hide() {
        $header.hide();
        visible = false;
    }
    
    function show() {
        $header.show();
        visible = true;
    }
    
    function setEditor() {
        if (editor) {
            $(editor).off("scroll", handleScroll);
            $(editor.document).off("change", handleDocumentChange);
        }
        hide();
        $header.remove();
        editor = EditorManager.getFocusedEditor();
        if (editor) {
            $header.appendTo(editor.getRootElement());
            $(editor).on("scroll", handleScroll);
            headerCM.setText(editor.document.getText());
            $(editor.document).on("change", handleDocumentChange);
        }
    }
    
    // Initialize extension
    ExtensionUtils.loadStyleSheet(module, "styles.css");
    $header = $("<div id='header'></div>");
    headerCM = new CodeMirror($header.get(0));
    
    $(EditorManager).on("focusedEditorChange", setEditor);
});
