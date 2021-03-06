define([
   'Controls/_lookup/MultipleInput/LookupView',
   'Types/entity',
   'Types/collection'
], function(LookupView, entity, collection) {
   function getItems(countItems) {
      for (var items = []; countItems; countItems--) {
         items.push(new entity.Model({
            rawData: {id: countItems},
            keyProperty: 'id'
         }));
      }

      return new collection.List({
         items: items
      });
   }

   describe('Controls/_lookup/MultipleInput/LookupView', function() {
      it('getAvailableWidthCollection', function() {
         var
            placeholderWidth = 35,
            fieldWrapperWidth = 145,
            lookupView = new LookupView();

         // Избавимся от работы с версткой
         LookupView._private.getPlaceholderWidth = function() {
            return placeholderWidth;
         };
         lookupView._getFieldWrapperWidth = function() {
            return  fieldWrapperWidth;
         };

         assert.equal(LookupView._private.getAvailableWidthCollection(lookupView, {
            items: getItems(3),
            maxVisibleItems: 3
         }), fieldWrapperWidth);
         assert.equal(LookupView._private.getAvailableWidthCollection(lookupView, {
            items: getItems(2),
            maxVisibleItems: 3
         }), fieldWrapperWidth - placeholderWidth);
      });

      it('_calculatingSizes', function() {
         var
            availableWidthCollection = 200,
            lookupView = new LookupView();

         LookupView._private.getAvailableWidthCollection = function() {
            return availableWidthCollection
         };
         lookupView._calculatingSizes({
            maxVisibleItems: 5,
            items: getItems(2)
         });
         assert.equal(lookupView._maxVisibleItems, 2);
         assert.equal(lookupView._availableWidthCollection, availableWidthCollection);
      });

      it('_isInputVisible', function() {
         var lookupView = new LookupView();

         lookupView._options.items = getItems(5);
         lookupView._options.maxVisibleItems = 5;
         assert.isFalse(lookupView._isInputVisible(lookupView._options));

         lookupView._options.maxVisibleItems = 6;
         assert.isTrue(lookupView._isInputVisible(lookupView._options));

         lookupView._options.readOnly = true;
         assert.isFalse(!!lookupView._isInputVisible(lookupView._options));
      });

      it('_isNeedCalculatingSizes', function() {
         var lookupView = new LookupView();

         assert.isFalse(lookupView._isNeedCalculatingSizes({
            items: getItems(0)
         }));

         assert.isTrue(lookupView._isNeedCalculatingSizes({
            items: getItems(5)
         }));

         assert.isFalse(lookupView._isNeedCalculatingSizes({
            items: getItems(5),
            readOnly: true
         }));
      });
   });
});
