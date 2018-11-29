define('Controls/Container/Suggest/__BaseLayer',
   [
      'Core/Control',
      'Controls/Container/Search/SearchContextField',
      'Controls/Container/Filter/FilterContextField',
   ],
   
   function(Control, SearchContextField, FilterContextField) {
      
      'use strict';
      
      var __LayerBase = Control.extend({
         
         _beforeMount: function(options) {
            this._filterLayoutField = new FilterContextField({filter: options.filter});
            this._searchLayoutField = new SearchContextField(options.searchValue);
         },
         
         _beforeUpdate: function(newOptions) {
            if (this._options.searchValue !== newOptions.searchValue) {
               this._searchLayoutField.searchValue = newOptions.searchValue;
               this._searchLayoutField.updateConsumers();
            }
            if (this._options.filter !== newOptions.filter) {
               this._filterLayoutField.filter = newOptions.filter;
               this._filterLayoutField.updateConsumers();
            }
         },
   
         _getChildContext: function() {
            return {
               filterLayoutField: this._filterLayoutField,
               searchLayoutField: this._searchLayoutField
            };
         }
      });
      
      return __LayerBase;
   });


