/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, CodeMirror */

define(function (require, exports, module) {
    "use strict";
    
    var EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    
    var $header, headerCM, editor, ranges = [], visible = false;
    
    function update() {
        // find the topmost visible line
        // if header is visible
        //      if topmost visible line is the end of the current range or not in a range, scroll header out
        //      if topmost visible line is in a range that's not the header's range, update header (with anim?)
        // if header is invisible 
        //      if topmost visible line is a header or in a range, show the header at position 0 and update its text
        
        // TODO: should header be opaque?
        
        // ***
    }
    
    function handleDocumentChange() {
        // update ranges based on change (brute force scan every time for now)
        // TODO: have different providers for different file types
        // ***
        
        update();
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
