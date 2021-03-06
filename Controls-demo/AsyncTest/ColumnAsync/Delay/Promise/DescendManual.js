define('Controls-demo/AsyncTest/ColumnAsync/Delay/Promise/DescendManual',
   [
      'Core/Control',
      'wml!Controls-demo/AsyncTest/ColumnAsync/Delay/Promise/DescendManual',
      'css!Controls-demo/AsyncTest/AsyncTestDemo',
   ], function (Control, template) {
      'use strict';

      var delayDescendManualModule = Control.extend({
         _template: template,
         _isOpen: false,

         _beforeMount: function (options) {
            return new Promise(function (resolve) {
               setTimeout(function () {
                  resolve();
               }, options.delay);
            });
         },

         _setOpen: function() {
            this._isOpen = !this._isOpen;
            this._forceUpdate();
         },
      });

      return delayDescendManualModule;
   });
