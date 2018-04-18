define('Controls/Toggle/Radio', [
   'Core/Control',
   'Controls/Controllers/SourceController',
   'tmpl!Controls/Toggle/Radio/Radio',
   'WS.Data/Type/descriptor',
   'css!Controls/Toggle/Radio/Radio'
], function(Control, SourceController, template, types) {

   var _private = {
      initItems: function(source, self) {
         self._sourceController = new SourceController({
            source: source
         });
         return self._sourceController.load().addCallback(function(items) {
            return items;
         });
      }
   };

   var Radio = Control.extend({
      _template: template,

      _beforeMount: function(options) {
         if (options.source) {
            return _private.initItems(options.source, this).addCallback(function(items) {
               this._items = items;
            }.bind(this));
         }
      },

      selectKeyChanged: function(e, item, keyProperty) {
         this._notify('selectKeyChange', item.get(keyProperty));
      }
   });

   Radio._private = _private;

   return Radio;
});
