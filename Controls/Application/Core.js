/**
 * Created by dv.zuev on 01.02.2018.
 */
define('Controls/Application/Core',
   [
      'Core/Control',
      'wml!Controls/Application/Core',
      'Controls/Application/AppData',
      'Controls/Application/HeadDataContext',
      'Core/Themes/ThemesController',
      'native-css',
      'Core/css-resolve'
   ],
   function(Control,
      template,
      AppData,
      HeadDataContext,
      ThemesController,
      nativeCss,
      cssResolve) {
      'use strict';

      function parseTheme(path) {
         var splitted = path.split('theme?');
         var res;
         if (splitted.length > 1) {
            res = {
               name: splitted[1],
               hasTheme: true
            };
         } else {
            res = {
               name: path,
               hasTheme: false
            };
         }
         return res;
      }


      var AppCore = Control.extend({
         _template: template,
         ctxData: null,
         _beforeMount: function(cfg) {
            this._application = cfg.application;
         },
         _beforeUpdate: function(cfg) {
            if (this._applicationForChange) {
               this._application = this._applicationForChange;
               this._applicationForChange = null;
            } else {
               this._application = cfg.application;
            }
         },
         constructor: function(cfg) {
            try {
               /* TODO: set to presentation service */
               process.domain.req.compatible = false;
            } catch (e) {
            }

            // TODO Нужно для совместимости. Убрать после синхронизации с WS.
            // cfg.lite = true;
            AppCore.superclass.constructor.apply(this, arguments);
            this.ctxData = new AppData(cfg);
            this.headDataCtx = new HeadDataContext(cfg.theme || '', cfg.cssLinks, cfg.resourceRoot, cfg.lite);
         },
         _getChildContext: function() {
            return {
               AppData: this.ctxData,
               headData: this.headDataCtx
            };
         },
         coreTheme: '',
         setTheme: function(ev, theme) {
            this.coreTheme = theme;
         },
         changeApplicationHandler: function(e, app) {
            var result;
            if (this._application !== app) {
               this._applicationForChange = app;
               this._forceUpdate();
               result = true;
            } else {
               result = false;
            }
            return result;
         }
      });

      return AppCore;
   });
