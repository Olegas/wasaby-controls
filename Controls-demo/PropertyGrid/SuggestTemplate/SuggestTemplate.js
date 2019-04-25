define('Controls-demo/PropertyGrid/SuggestTemplate/SuggestTemplate',
   [
      'Core/Control',
      'wml!Controls-demo/PropertyGrid/SuggestTemplate/SuggestTemplate',
      'Types/source',
      'Types/collection',
      'wml!Controls-demo/Input/Suggest/resources/SuggestTemplate',
      'css!Controls-demo/Input/resources/VdomInputs',
      'css!Controls-demo/Input/Suggest/Suggest'
   ],
   function(Control, template, source, collection) {
      'use strict';

      var sugTmpl = Control.extend({
         _template: template,
         _viewValue: '',
         _source: null,

         _beforeMount: function(options) {
            this._source = new source.Memory({
               idProperty: 'id',
               data: options.items
            });
            this.rs = new collection.RecordSet({
               idProperty: 'id',
               rawData: options.items
            });

            if (options.value) {
               this.selectedKey = options.items.find(function(item) {
                  return item.title === options.value;
               }).id;
            }
         },
         selectedKeyChanged: function(event, key) {
            this._notify('choose', [this.rs.getRecordById(key)]);
         }
      });

      return sugTmpl;
   });
