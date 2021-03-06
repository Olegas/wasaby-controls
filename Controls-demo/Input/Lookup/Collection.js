define('Controls-demo/Input/Lookup/Collection',
   [
      'Core/Control',
      'wml!Controls-demo/Input/Lookup/Collection',
      'Types/collection',
      'Types/source',
      'Types/entity',

      'css!Controls-demo/Input/Lookup/Collection'
   ],
   function(Control, template, collection) {

      'use strict';
      var Collection = Control.extend({
         _template: template,
         _sourceMulti: null,
         _sourceSingle: null,
         _beforeMount: function() {
            this._sourceMulti = new collection.RecordSet({
               keyProperty: 'id',
               rawData: [
                  {
                     id: 0,
                     title: 'Sasha'
                  },
                  {
                     id: 1,
                     title: 'Andrey'
                  },
                  {
                     id: 2,
                     title: 'Dmitry'
                  },
                  {
                     id: 3,
                     title: 'Aleksey'
                  },
                  {
                     id: 4,
                     title: 'Maxim'
                  }
               ]
            });
            this._sourceSingle = new collection.RecordSet({
               keyProperty: 'id',
               rawData: [
                  {
                     id: 0,
                     title: 'Sasha'
                  }
               ]
            });

         },
      });

      return Collection;
   });
