define('Controls-demo/PropertyGrid/EnumTemplate',
   [
      'Core/Control',
      'wml!Controls-demo/PropertyGrid/EnumTemplate',
      'WS.Data/Source/Memory',
      'css!Controls-demo/Input/resources/VdomInputs',
      'css!Controls-demo/Input/Suggest/Suggest'
   ],
   function(Control, template, Memory) {
      'use strict';
      var stringTmpl = Control.extend({
         _template: template,
         _source: null,
         _beforeMount: function(opt) {
            this._source = Object.keys(opt.enum).map(function(key, index) {
               return {
                  id: index,
                  value: opt.enum[key],
                  title: key,
                  comment: opt.enum[key],
                  type: (opt.displayType ? 'source' : '')
               };
            });
         },
         _selectedItemHandler: function(event, tmp) {
            if (this._source[tmp]) {
               if (this._source[tmp].type === 'source') {
                  this._notify('valueChanged',  [this._source[tmp].comment]);
               } else {
                  this._notify('valueChanged',  [this._source[tmp].title]);
               }
            } else {
               this._notify('valueChanged', undefined);
            }
         },
         _comboBoxSource: function() {
            return new Memory({
               idProperty: 'id',
               data: this._source
            });
         }
      });


      return stringTmpl;
   });
