/**
 * Created by dv.zuev on 25.12.2017.
 */
define('Controls/Application',
   [
      'Core/Control',
      'wml!Controls/Application/Page',
      'Core/Deferred',
      'Core/BodyClasses',
      'Env/Env',
      'Controls/Application/AppData',
      'Controls/scroll',
      'Core/LinkResolver/LinkResolver',
      'Application/Env',
      'Core/Themes/ThemesController',
      'css!theme?Controls/Application/Application'
   ],

   /**
    * Root component for WS applications. Creates basic html page.
    *
    * @class Controls/Application
    * @extends Core/Control
    *
    * @mixes Controls/Application/BlockLayout/Styles
    *
    * @control
    * @public
    * @author Зуев Д.В.
    */

   /**
    * @name Controls/Application#staticDomains
    * @cfg {Number} The list of domains for distributing static resources. These domains will be used to create paths
    * for static resources and distribute downloading for several static domains.
    * There will be another way to propagate this data after this problem:
    * https://online.sbis.ru/opendoc.html?guid=d4b76528-b3a0-4b9d-bbe8-72996d4272b2
    */

   /**
    * @name Controls/Application#head
    * @cfg {Content} Additional content of HEAD tag. Can accept more than one root node
    */

   /**
    * @name Controls/Application#content
    * @cfg {Content} Content of BODY tag
    */

   /**
    * @name Controls/Application#scripts
    * @cfg {Content} Scripts, that will be pasted after content. Can accept more than one root node
    */

   /**
    * @name Controls/Application#appRoot
    * @cfg {String} Path to application root url
    */

   /**
    * @name Controls/Application#resourceRoot
    * @cfg {String} Path to resource root url
    */

   /**
    * @name Controls/Application#wsRoot
    * @cfg {String} Path to ws root url
    */

   /**
    * @name Controls/Application#beforeScripts
    * @cfg {Boolean} If it's true, scripts from options scripts will be pasted before other scripts generated by application
    * otherwise it will be pasted after.
    */

   /**
    * @name Controls/Application#viewport
    * @cfg {String} Content attribute of meta tag with name "viewport"
    */

   /**
    * @name Controls/Application#bodyClass
    * @cfg {String} String with classes, that will be pasted in body's class attribute
    */

   /**
    * @name Controls/Application#title
    * @cfg {String} title of the tab
    */

   /**
    * @name Controls/Application#templateConfig
    * @cfg {Object} All fields from this object will be passed to content's options
    */

   /**
    * @name Controls/Application#compat
    * @cfg {Boolean} If it's true, compatible layer will be loaded
    */

   /**
    * @name Controls/Application#builder
    * @cfg {Boolean} Allows to create static html with builder
    */

   /**
    * @name Controls/Application#builderCompatible
    * @cfg {Boolean} Will load compatible layer. Works only if builder option is true.
    */

   /**
    * @name Controls/Application#width
    * @cfg {String} Used by Controls.popup:Manager
    *
    * @css @font-size_App__body Font size of page body. This size inherits to other elements in page.
    */

   function(Base,
      template,
      Deferred,
      BodyClasses,
      Env,
      AppData,
      scroll,
      LinkResolver,
      AppEnv,
      ThemesController) {
      'use strict';

      var _private;

      _private = {

         /**
          * Перекладываем опции или recivedState на инстанс
          * @param self
          * @param cfg
          * @param routesConfig
          */
         initState: function(self, cfg) {
            self.templateConfig = cfg.templateConfig;
            self.compat = cfg.compat || false;
         },
         calculateBodyClasses: function() {
            // Эти классы вешаются в двух местах. Разница в том, что BodyClasses всегда возвращает один и тот же класс,
            // а TouchDetector реагирует на изменение состояния.
            // Поэтому в Application оставим только класс от TouchDetector

            var bodyClasses = BodyClasses().replace('ws-is-touch', '').replace('ws-is-no-touch', '');

            return bodyClasses;
         }
      };
      var Page = Base.extend({
         _template: template,

         /**
          * @type {String} Property controls whether or not touch devices use momentum-based scrolling for inner scrollable areas.
          * @private
          */
         _scrollingClass: 'controls-Scroll_webkitOverflowScrollingTouch',

         _getChildContext: function() {
            return {
               ScrollData: this._scrollData
            };
         },

         _scrollPage: function(ev) {
            this._children.scrollDetect.start(ev);
         },

         _resizePage: function(ev) {
            this._children.resizeDetect.start(ev);
         },
         _mousedownPage: function(ev) {
            this._children.mousedownDetect.start(ev);
         },
         _mousemovePage: function(ev) {
            this._children.mousemoveDetect.start(ev);
         },
         _mouseupPage: function(ev) {
            this._children.mouseupDetect.start(ev);
         },
         _touchmovePage: function(ev) {
            this._children.touchmoveDetect.start(ev);
         },
         _touchendPage: function(ev) {
            this._children.touchendDetect.start(ev);
         },
         _touchclass: function() {
            // Данный метод вызывается из вёрстки, и при первой отрисовке еще нет _children (это нормально)
            // поэтому сами детектим touch с помощью compatibility
            return this._children.touchDetector
               ? this._children.touchDetector.getClass()
               : Env.compatibility.touch
                  ? 'ws-is-touch'
                  : 'ws-is-no-touch';
         },

         /**
          * Код должен быть вынесен в отдельных контроллер в виде хока в 610.
          * https://online.sbis.ru/opendoc.html?guid=2dbbc7f1-2e81-4a76-89ef-4a30af713fec
          */
         _popupCreatedHandler: function() {
            this._isPopupShow = true;

            this._changeOverflowClass();
         },

         _popupDestroyedHandler: function(event, element, popupItems) {
            if (popupItems.getCount() === 0) {
               this._isPopupShow = false;
            }

            this._changeOverflowClass();
         },

         _suggestStateChangedHandler: function(event, state) {
            this._isSuggestShow = state;

            this._changeOverflowClass();
         },

         /** ************************************************** */

         _changeOverflowClass: function() {
            if (Env.detection.isMobileIOS) {
               if (this._isPopupShow || this._isSuggestShow) {
                  this._scrollingClass = 'controls-Scroll_webkitOverflowScrollingAuto';
               } else {
                  this._scrollingClass = 'controls-Scroll_webkitOverflowScrollingTouch';
               }
            } else {
               this._scrollingClass = '';
            }
         },

         _beforeMount: function(cfg) {
            this.BodyClasses = _private.calculateBodyClasses;
            this._scrollData = new scroll._scrollContext({pagingVisible: cfg.pagingVisible});
         },

         _afterMount: function() {
            if (!Env.detection.isMobilePlatform) {
               this.activate();
            }
         },

         _beforeUpdate: function(cfg) {
            if (this._scrollData.pagingVisible !== cfg.pagingVisible) {
               this._scrollData.pagingVisible = cfg.pagingVisible;
               this._scrollData.updateConsumers();
            }
         },

         _afterUpdate: function(oldOptions) {
            var elements = document.getElementsByClassName('head-title-tag');
            if (elements.length === 1) {
               // Chrome на ios при вызове History.replaceState, устанавливает в title текущий http адрес.
               // Если после загрузки установить title, который уже был, то он не обновится, и в заголовке вкладки
               // останется http адрес. Поэтому сначала сбросим title, а затем положим туда нужное значение.
               if (Env.detection.isMobileIOS && Env.detection.chrome && oldOptions.title === this._options.title) {
                  elements[0].textContent = '';
               }
               elements[0].textContent = this._options.title;
            }
         },

         _keyPressHandler: function(event) {
            if (this._isPopupShow) {
               if (Env.constants.browser.safari) {
                  // Need to prevent default behaviour if popup is opened
                  // because safari escapes fullscreen mode on 'ESC' pressed
                  // TODO https://online.sbis.ru/opendoc.html?guid=5d3fdab0-6a25-41a1-8018-a68a034e14d9
                  if (event.nativeEvent && event.nativeEvent.keyCode === 27) {
                     event.preventDefault();
                  }
               }
            }
         }
      });

      Page.getDefaultOptions = function() {
         return {
            title: '',
            pagingVisible: false
         };
      };

      return Page;
   });
