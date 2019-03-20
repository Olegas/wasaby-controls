define('Controls/Popup/Previewer',
   [
      'Core/Control',
      'wml!Controls/Popup/Previewer/Previewer',
      'Core/helpers/Function/debounce',
      'Controls/Popup/Opener/Previewer',
      'Env/Env',

      'css!Controls/Popup/Previewer/Previewer'
   ],
   function(Control, template, debounce, PreviewerOpener, Env) {
      'use strict';

      /**
       * @class Controls/Popup/Previewer
       * @extends Core/Control
       * @public
       * @author Красильников А.С.
       *
       * @name Controls/Popup/Previewer#content
       * @cfg {Content} The content to which the logic of opening and closing the mini card is added.
       *
       * @name Controls/Popup/Previewer#template
       * @cfg {Content} Mini card contents.
       */

      /**
       * @name Controls/Popup/Previewer#trigger
       * @cfg {String} Event name trigger the opening or closing of the template.
       * @variant click Opening by click on the content. Closing by click not on the content or template.
       * @variant demand Closing by click not on the content or template.
       * @variant hover Opening by hover on the content. Closing by hover not on the content or template.
       * @variant hoverAndClick Opening by click or hover on the content. Closing by click or hover not on the content or template.
       * @default hoverAndClick
       */
      var _private = {
         getType: function(eventType) {
            if (eventType === 'mouseenter' || eventType === 'mouseleave') {
               return 'hover';
            }
            return 'click';
         },
         getCfg: function(self) {
            return {
               opener: self,
               target: self._container,
               template: 'Controls/Popup/Previewer/OpenerTemplate',
               corner: {
                  vertical: 'bottom',
                  horizontal: 'right'
               },
               isCompoundTemplate: self._options.isCompoundTemplate,
               eventHandlers: {
                  onResult: self._resultHandler
               },
               templateOptions: {
                  template: self._options.templateName || self._options.template,
                  templateOptions: self._options.templateOptions
               },
               closeChildWindows: self._options.closeChildWindows
            };
         },
         open: function(self, event, type) {
            if (!self._isPopupOpened()) {
               if (self._isNewEnvironment()) { // TODO: COMPATIBLE
                  self._close(event); // close opened popup to avoid jerking the content for repositioning
                  self._notify('openPreviewer', [_private.getCfg(self), type], { bubbling: true });
               } else {
                  self._children.openerPreviewer.open(_private.getCfg(self), type);
               }
            }
         },
         close: function(self, type) {
            if (self._isNewEnvironment()) { // TODO: COMPATIBLE
               self._notify('closePreviewer', [type], { bubbling: true });
            } else {
               self._children.openerPreviewer.close(type);
            }
         }
      };

      var Previewer = Control.extend({
         _template: template,

         _isNewEnvironment: PreviewerOpener.isNewEnvironment,

         _beforeMount: function(options) {
            this._resultHandler = this._resultHandler.bind(this);
            this._debouncedAction = debounce(this._debouncedAction, 10);
            this._enableClose = true;
            if (options.templateName) {
               Env.IoC.resolve('ILogger').warn('InfoBox', 'Используется устаревшая опция templateName, используйте опцию template');
            }
         },

         /**
          * @param type
          * @variant hover
          * @variant click
          */
         open: function(type) {
            _private.open(this, {}, type);
         },

         /**
          * @param type
          * @variant hover
          * @variant click
          */
         close: function(type) {
            _private.close(this, type);
         },

         _open: function(event) {
            var type = _private.getType(event.type);

            _private.open(this, event, type);
         },

         _close: function(event) {
            var type = _private.getType(event.type);

            _private.close(this, type);
         },

         _isPopupOpened: function() {
            if (this._isNewEnvironment()) { // TODO: COMPATIBLE
               return this._notify('isPreviewerOpened', [], { bubbling: true });
            }
            return this._children.openerPreviewer.isOpened();
         },

         // Pointer action on hover with content and popup are executed sequentially.
         // Collect in package and process the latest challenge
         _debouncedAction: function(method, args) {
            this[method].apply(this, args);
         },

         _cancel: function(event, action) {
            if (this._isNewEnvironment()) { // TODO: COMPATIBLE
               this._notify('cancelPreviewer', [action], { bubbling: true });
            } else {
               this._children.openerPreviewer.cancel(action);
            }
         },

         _contentMousedownHandler: function(event) {
            if (this._options.trigger === 'click' || this._options.trigger === 'hoverAndClick') {
               /**
                * When trigger is set to 'hover', preview shouldn't be shown when user clicks on content.
                */
               if (!this._isPopupOpened()) {
                  this._debouncedAction('_open', [event]);
               }
            }

            event.preventDefault();
            event.stopPropagation();
         },

         _contentMouseenterHandler: function(event) {
            if (!this._isPopupOpened()) {
               this._debouncedAction('_open', [event]);
            }
            this._cancel(event, 'closing');
         },

         _contentMouseleaveHandler: function(event) {
            this._debouncedAction('_close', [event]);
         },

         _previewerClickHandler: function(event) {
            /**
             * Cancel the ascent of the click. Thus cancel the parent reaction.
             */
            event.stopPropagation();
         },

         _resultHandler: function(event) {
            switch (event.type) {
               case 'menuclosed':
                  this._enableClose = true;
                  event.stopPropagation();
                  break;
               case 'menuopened':
                  this._enableClose = false;
                  event.stopPropagation();
                  break;
               case 'mouseenter':
                  this._debouncedAction('_cancel', [event, 'closing']);
                  break;
               case 'mouseleave':
                  if (this._enableClose && (this._options.trigger === 'hover' || this._options.trigger === 'hoverAndClick')) {
                     this._debouncedAction('_close', [event]);
                  }
                  break;
               case 'mousedown':
                  event.stopPropagation();
                  break;
            }
         }
      });

      Previewer.getDefaultOptions = function() {
         return {
            trigger: 'hoverAndClick'
         };
      };

      return Previewer;
   });
