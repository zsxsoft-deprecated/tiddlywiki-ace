/*\
title: $:/plugins/zsxsoft/ace/engine.js
type: application/javascript
module-type: widget

making the ace editor a widget

\*/

(function () {
  /* jslint node: true, browser: true */
  /* global $tw: false */
  'use strict'

  var HEIGHT_VALUE_TITLE = '$:/config/TextEditor/EditorHeight/Height'

  if ($tw.browser) {
    require('$:/plugins/zsxsoft/ace/lib/ace.js')
  }

  var log = new $tw.utils.Logger('aceplugin')

  //
  // overwrite log.log
  //
  log.doLog = true
  log._log = log.log

  log.log = function () {
    if (log.doLog) {
      log._log.apply(this, arguments)
    }
  }

  var AceEditor = function (options) {
    // Save our options
    var self = this
    options = options || {}
    this.widget = options.widget
    this.parentNode = options.parentNode
    this.nextSibling = options.nextSibling
    // Create the wrapper DIV
    this.domNode = this.widget.document.createElement('div')
    if (this.widget.editClass) {
      this.domNode.className = this.widget.editClass
    }
    this.domNode.style.display = 'inline-block'
    this.parentNode.insertBefore(this.domNode, this.nextSibling)
    this.widget.domNodes.push(this.domNode)

    this.editor = ace.edit(this.domNode)
    this.editor.setOptions({
      minLines: 10,
      maxLines: Infinity,
      autoScrollEditorIntoView: true
    })

    console.log(options.type)
    this.editor.getSession().setMode(options.type)
    this.editor.setValue(options.value, 1)

    const searchBox = "$:/config/ace/searchBox"
    console.log(searchBox)

    if (searchBox) {
      require('$:/plugins/zsxsoft/ace/lib/ext-searchbox.js')
    }

    this.editor.on('change', function () {
      self.widget.saveChanges(self.getText())
    })
    this.editor.on('drop', function (cm, event) {
      event.stopPropagation() // Otherwise TW's dropzone widget sees the drop event
      return false
    })
    this.editor.on('keydown', function (cm, event) {
      return self.widget.handleKeydownEvent.call(self.widget, event)
    })
  }

  /*
  Set the text of the engine if it doesn't currently have focus
  */
  AceEditor.prototype.setText = function (text, type) {
    this.editor.getSession().setMode(type)
    if (!this.editor.isFocused() && !this.domNode.parentNode.contains(document.activeElement)) {
      this.editor.setValue(text, 1)
    }
  }

  /*
  Get the text of the engine
  */
  AceEditor.prototype.getText = function () {
    var session = this.editor.getSession()
    return session.getValue()
  }

  /*
  Fix the height of textarea to fit content
  */
  AceEditor.prototype.fixHeight = function () {
    console.log('height')
    if (this.widget.editAutoHeight) {
      var newHeight =
                    Math.max(10, this.editor.getSession().getScreenLength()) *
                    this.editor.renderer.lineHeight +
                    this.editor.renderer.scrollBar.getWidth()

      this.domNode.style.height = newHeight + 'px'
    } else {
      var fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE, '400px'), 10)
      fixedHeight = Math.max(fixedHeight, 20)
      this.domNode.style.height = fixedHeight + 'px'
    }
  }

  /*
    Focus the engine node
   */
  AceEditor.prototype.focus = function () {
    this.editor.focus()
  }

  /*
    Create a blank structure representing a text operation
  */
  AceEditor.prototype.createTextOperation = function () {
    console.log('createTextOperation')
    var anchorPos = this.editor.session.doc.positionToIndex(this.editor.getSelection().getSelectionAnchor())
    var headPos = this.editor.session.doc.positionToIndex(this.editor.getSelection().getSelectionLead())
    var operation = {
      text: this.editor.getValue(),
      selStart: Math.min(anchorPos, headPos),
      selEnd: Math.max(anchorPos, headPos),
      cutStart: null,
      cutEnd: null,
      replacement: null,
      newSelStart: null,
      newSelEnd: null
    }
    operation.selection = operation.text.substring(operation.selStart, operation.selEnd)
    return operation
  }

  /*
  Execute a text operation
  */
  AceEditor.prototype.executeTextOperation = function (operation) {
    // Perform the required changes to the text area and the underlying tiddler
    let newText = operation.text
    const Range = this.editor.getSelectionRange().__proto__.constructor // eslint-disable-line no-proto
    if (operation.replacement !== null) {
      let start = this.editor.session.doc.indexToPosition(operation.cutStart)
      let end = this.editor.session.doc.indexToPosition(operation.cutEnd)
      this.editor.session.replace(new Range(start.row, start.column, end.row, end.column), operation.replacement)

      start = this.editor.session.doc.indexToPosition(operation.newSelStart)
      end = this.editor.session.doc.indexToPosition(operation.newSelEnd)
      this.editor.getSelection().setRange(new Range(start.row, start.column, end.row, end.column))
      newText = operation.text.substring(0, operation.cutStart) + operation.replacement + operation.text.substring(operation.cutEnd)
    }
    return newText
  }

  //
  // exports
  //

  // the widget
  exports.aceeditor = AceEditor

})()
