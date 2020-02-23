/*\
title: $:/plugins/zsxsoft/ace/edit-ace.js
type: application/javascript
module-type: widget

edit-ace widget

\*/
(function () {
  /* jslint node: true, browser: true */
  /* global $tw: false */
  'use strict'

  const editTextWidgetFactory = require('$:/core/modules/editor/factory.js').editTextWidgetFactory
  const ACEEngine = require('$:/plugins/zsxsoft/ace/engine.js').aceeditor

  exports['edit-ace'] = editTextWidgetFactory(ACEEngine, ACEEngine)
})()
