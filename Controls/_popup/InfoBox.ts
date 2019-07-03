import Control = require('Core/Control');
import template = require('wml!Controls/_popup/InfoBox/InfoBox');
import InfoBoxOpener from './Opener/InfoBox';
import {TouchContextField} from 'Controls/context';
import getZIndex = require('Controls/Utils/getZIndex');
import Env = require('Env/Env');
import entity = require('Types/entity');


      /**
       * Component that opens a popup that is positioned relative to a specified element. {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/openers/infobox/ see more}.
       *
       * <a href="/materials/demo-ws4-infobox">Demo-example</a>.
       * @class Controls/_popup/InfoBox
       *
       * @public
       * @author Красильников А.С.
       * @demo Controls-demo/InfoBox/InfoBoxPG
       *
       * @css @spacing_Infobox-between-content-border-top Spacing between content and border-top .
       * @css @spacing_Infobox-between-content-border-right Spacing between content and border-right.
       * @css @spacing_Infobox-between-content-border-bottom Spacing between content and border-bottom.
       * @css @spacing_Infobox-between-content-border-left Spacing between content and border-left.
       *
       * @css @max-width_Infobox Max-width of Infobox.
       * @css @size_Infobox-arrow Size of Infobox arrow.
       * @css @horizontal-offset_Infobox-arrow Spacing between arrow and border-left.
       * @css @vertical-offset_Infobox-arrow  Spacing between arrow and border-top.
       * @css @spacing_Infobox-between-top-close-button Spacing between close-button and border-top.
       * @css @spacing_Infobox-between-right-close-button Spacing between close-button and border-right.
       *
       * @css @color_Infobox-close-button Color of close-button.
       * @css @color_Infobox-close-button_hover Color of close-button in hovered state.
       *
       * @css @background-color_Infobox_default Default background color.
       *
       * @css @border-color_Infobox_default Default border color.
       * @css @border-color_Infobox_danger Border color when option style is set to danger.
       * @css @border-color_Infobox_info Border color when option style is set to info.
       * @css @border-color_Infobox_warning Border color when option style is set to warning.
       * @css @border-color_Infobox_success Border color when option style is set to success.
       * @css @border-color_Infobox_secondary Border color when option style is set to secondary.
       * @css @border-width_Infobox Thickness of border.
       *
       * @css @color_Infobox-shadow_default Default color of shadow.
       * @css @box-shadow_Infobox Size of shadow.
       */

      /**
       * @name Controls/_popup/InfoBox#targetSide
       * @cfg {String} Side positioning of the target relative to infobox.
       * Popup displayed on the top of the target.
       * @variant top Popup displayed on the top of the target.
       * @variant bottom Popup displayed on the bottom of the target.
       * @variant left Popup displayed on the left of the target.
       * @variant right Popup displayed on the right of the target.
       * @default top
       */

      /**
       * @name Controls/_popup/InfoBox#alignment
       * @cfg {String} Alignment of the infobox relative to target
       * Popup aligned by start of the target.
       * @variant start Popup aligned by start of the target.
       * @variant center Popup aligned by center of the target.
       * @variant end Popup aligned by end of the target.
       * @default start
       */

      /**
       * @name Controls/_popup/InfoBox#hideDelay
       * @cfg {Number} Delay before closing after mouse leaves. (measured in milliseconds)
       * @default 300
       */

      /**
       * @name Controls/_popup/InfoBox#showDelay
       * @cfg {Number} Delay before opening after mouse enters.(measured in milliseconds)
       * @default 300
       */

      /**
       * @name Controls/_popup/InfoBox#content
       * @cfg {function|String} The content to which the logic of opening and closing the template is added.
       */

      /**
       * @name Controls/_popup/InfoBox#template
       * @cfg {function|String} Popup template.
       */

      /**
       * @name Controls/_popup/InfoBox#templateOptions
       * @cfg {Object} Popup template options.
       */

      /**
       * @name Controls/_popup/InfoBox#trigger
       * @cfg {String} Event name trigger the opening or closing of the template.
       * @variant click Opening by click on the content. Closing by click not on the content or template.
       * @variant hover Opening by hover on the content. Closing by hover not on the content or template.
       * Opening is ignored on touch devices.
       * @variant hover|touch Opening by hover or touch on the content. Closing by hover not on the content or template.
       * @variant demand  Developer opens and closes InfoBox manually. Also it will be closed by click not on the content or template.
       * @default hover
       */

      /**
       * @name Controls/_popup/InfoBox#floatCloseButton
       * @cfg {Boolean} Whether the content should wrap around the cross closure.
       * @default false
       */

      /**
       * @name Controls/_popup/InfoBox#style
       * @cfg {String} Infobox display style.
       * @variant default
       * @variant danger
       * @variant warning
       * @variant info
       * @variant secondary
       * @variant success
       * @variant primary
       */


      var _private = {
         getCfg: function(self) {
            return {
               opener: self,
               target: self._container,
               template: self._options.template,
               position: self._options.position,
               targetSide: self._options.targetSide,
               alignment: self._options.alignment,
               style: self._options.style,
                //InfoBox close by outside click only if trigger is set to 'demand' or 'click'.
               closeOnOutsideClick: self._options.trigger === 'click' || self._options.trigger === 'demand',
               floatCloseButton: self._options.floatCloseButton,
               eventHandlers: {
                  onResult: self._resultHandler,
                  onClose: self._closeHandler
               },
               templateOptions: self._options.templateOptions
            };
         },
         resetTimeOut: function(self) {
            clearTimeout(self._openId);
            clearTimeout(self._closeId);
            self._openId = null;
            self._closeId = null;
         }
      };

      var InfoBox = Control.extend({
         _template: template,

         _isNewEnvironment: InfoBoxOpener.isNewEnvironment,

         _openId: null,

         _closeId: null,

         _beforeMount: function(options) {
            this._resultHandler = this._resultHandler.bind(this);
            this._closeHandler = this._closeHandler.bind(this);
            if (options.float) {
               Env.IoC.resolve('ILogger').error('InfoBox', 'Используется устаревшя опция float, используйте floatCloseButton');
            }
            if (options.templateName) {
               Env.IoC.resolve('ILogger').error('InfoBox', 'Используется устаревшая опция templateName, используйте опцию template');
            }
         },

         /**
          * TODO: https://online.sbis.ru/opendoc.html?guid=ed987a67-0d73-4cf6-a55b-306462643982
          * Кто должен закрывать инфобокс после разрушения компонента нужно будет обсудить.
          * Если компонент обрабатывающий openInfoBox и closeInfoBox, то данный код будет удален по ошибке выше.
          */
         _beforeUnmount: function() {
            if (this._opened) {
               this._close();
            }
            _private.resetTimeOut(this);
         },

         _open: function() {
            var config = _private.getCfg(this);

            if (this._isNewEnvironment()) {
               this._notify('openInfoBox', [config], { bubbling: true });
            } else {
               // To place zIndex in the old environment
               config.zIndex = getZIndex(this._children.infoBoxOpener);
               this._children.infoBoxOpener.open(config);
            }

            _private.resetTimeOut(this);
            this._opened = true;
            this._forceUpdate();
         },

         _close: function() {
            if (this._isNewEnvironment()) {
               this._notify('closeInfoBox', [], { bubbling: true });
            } else {
               //todo: will be fixed by https://online.sbis.ru/opendoc.html?guid=e6be2dd9-a47f-424c-a86c-bd6b48b98602
               if(!this._destroyed) {
                  this._children.infoBoxOpener.close()
               }
            }
            _private.resetTimeOut(this);
            this._opened = false;
         },

         _contentMousedownHandler: function(event) {
            if (this._options.trigger === 'click') {
               if (!this._opened) {
                  this._open(event);
               }
               event.stopPropagation();
            }
         },

         _contentMouseenterHandler: function() {
            if (this._options.trigger === 'hover' || this._options.trigger === 'hover|touch') {
               /**
                * On touch devices there is no real hover, although the events are triggered. Therefore, the opening is not necessary.
                */
               if (!this._context.isTouch.isTouch) {
                  this._startOpeningPopup();
               }
            }
         },

         _contentTouchStartHandler: function() {
            if (this._options.trigger === 'hover|touch') {
               this._startOpeningPopup();
            }
         },

         _startOpeningPopup: function() {
            var self = this;
            //TODO: will be fixed by https://online.sbis.ru/opendoc.html?guid=809254e8-e179-443b-b8b7-f4a37e05f7d8
            _private.resetTimeOut(this);

            this._openId = setTimeout(function() {
               self._open();
               self._forceUpdate();
            }, self._options.showDelay);
         },

         _contentMouseleaveHandler: function() {
            if (this._options.trigger === 'hover' || this._options.trigger === 'hover|touch') {
               clearTimeout(this._openId);
               this._closeId = setTimeout(() => {
                  this._close();
                  this._forceUpdate();
               }, this._options.hideDelay);
            }

         },

         /**
          * Open InfoBox
          * @function Controls/_popup/InfoBox#open
          * @param {PopupOptions[]} popupOptions InfoBox popup options.
          */
         open: function() {
            this._open();
         },

         /**
          * close InfoBox
          * @function Controls/_popup/InfoBox#close
          */
         close: function() {
            this._close();
         },

         _resultHandler: function(event) {
            switch (event.type) {
               case 'mouseenter':
                  clearTimeout(this._closeId);
                  this._closeId = null;
                  break;
               case 'mouseleave':
                  if (this._options.trigger === 'hover' || this._options.trigger === 'hover|touch') {
                     this._contentMouseleaveHandler();
                  }
                  break;
               case 'mousedown':
                  event.stopPropagation();
                  break;
               case 'close':
                  // todo Для совместимости
                  // Удалить, как будет сделана задача https://online.sbis.ru/opendoc.html?guid=dedf534a-3498-4b93-b09c-0f36f7c91ab5
                  this._opened = false;
            }
         },

         _closeHandler: function() {
            this._opened = false;
         },

         _scrollHandler: function() {
            this._close();
         }
      });

      InfoBox.contextTypes = function() {
         return {
            isTouch: TouchContextField
         };
      };
      InfoBox.getOptionTypes = function() {
         return {
            trigger: entity.descriptor(String).oneOf([
               'hover',
               'click',
               'hover|touch',
               'demand'
            ])
         };
      };


InfoBox.getDefaultOptions = function() {
         return {
            targetSide: 'top',
            alignment: 'start',
            style: 'default',
            showDelay: 300,
            hideDelay: 300,
            trigger: 'hover'
         };
      };
      InfoBox._private = _private;

      export = InfoBox;

      /**
       * @typedef {Object} PopupOptions
       * @description Infobox configuration.
       * @property {function|String} content The content to which the logic of opening and closing the template is added.
       * @property {function|String} template Template inside popup
       * @property {Object} templateOptions Template options inside popup.
       * @property {String} trigger Event name trigger the opening or closing of the template.
       * @property {String} position Point positioning of the target relative to infobox.
       * @property {Boolean} floatCloseButton Whether the content should wrap around the cross closure.
       * @property {String} style Infobox display style.
       * @property {Number} showDelay Delay before opening.
       * @property {Number} showDelay Delay before closing.
       */


