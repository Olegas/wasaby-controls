define('Controls/JsLinks/JsLinks',
   [
      'Core/Control',
      'Core/Deferred',
      'tmpl!Controls/JsLinks/JsLinks',
      'Controls/Async/HeadDataContext'
   ],

   function (Base, Deferred, template, HeadDataContext) {
      'use strict';

      var Page = Base.extend({
         _template: template,
         _beforeMount: function(options, context, receivedState) {
            if (receivedState) {
               this.jsLinks = receivedState;
               return;
            }
            var def = context.headData.waitForAllAsync();
            var self = this;
            var innerDef = new Deferred();
            self.jsLinks = [];
            def.addCallback(function onLoad(res) {
               self.jsLinks = self.jsLinks.concat(res.jsLinks);
               innerDef.callback(self.jsLinks);
            });
            return innerDef;
         }
      });
      Page.contextTypes = function() {
         return {
            headData: HeadDataContext
         };
      };
      return Page;
   }
);
