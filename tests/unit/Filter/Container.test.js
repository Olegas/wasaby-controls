define(['Controls/Filter/Controller'], function(Filter){
   
   describe('Controls.Filter.Controller', function () {
      
      it('_itemsChanged', function () {
         var filterLayout = new Filter();
         var items = [{
            id: 'testKey',
            value: 'testValue',
            resetValue: ''
         }];
         var filterChangedNotifyed = false;
         filterLayout._notify = function() {
            filterChangedNotifyed = true;
         };
         filterLayout._itemsChanged(null, items);
         assert.deepEqual(filterLayout._filter, {testKey: 'testValue'});
         assert.isTrue(filterChangedNotifyed);
      });
      
      it('_private.getItemsByOption::array', function () {
         var opt = [{
            id: 'testId',
            value: '',
            resetValue: ''
         }];
         
         var items = Filter._private.getItemsByOption(opt);
         
         assert.deepEqual(items, opt);
      });
      
      it('_private.getItemsByOption::function', function () {
         var opt = [{
            id: 'testId',
            value: '',
            resetValue: ''
         }];
         
         var returnOptFunc = function() {
            return [{
               id: 'testId',
               value: '',
               resetValue: ''
            }];
         };
         
         var items = Filter._private.getItemsByOption(returnOptFunc);
         assert.deepEqual(items, opt);
      });
      
      it('_private.getItemsByOption::array with history', function () {
         var opt = [{
            id: 'testId',
            value: '',
            resetValue: ''
         }];
         var history = [{
            id: 'testId',
            value: 'testValue',
            resetValue: ''
         }];
         var items = Filter._private.getItemsByOption(opt, history);
         assert.deepEqual(items, history);
      });
      
      it('_private.getItemsByOption::function with history', function () {
         var returnOptFunc = function(history) {
            return [{
               id: 'testId',
               value: history[0].value,
               resetValue: ''
            }];
         };
         var history = [{
            id: 'testId',
            value: 'testValue',
            resetValue: ''
         }];
         var items = Filter._private.getItemsByOption(returnOptFunc, history);
         assert.deepEqual(items, history);
      });
      
      it('_private.getFilterByItems(filterButtonItems)', function () {
         var fbItems = [{
            id: 'testId',
            value: '',
            resetValue: ''
         }, {
            id: 'testId2',
            value: 'testValue',
            resetValue: ''
         }];
         
         var filter = Filter._private.getFilterByItems(fbItems);
         assert.deepEqual(filter, {testId2: 'testValue'});
      });
      
      it('_private.getFilterByItems(fastFilterItems)', function () {
         var fastFilterItems = [{
            id: 'testId',
            value: '',
            resetValue: ''
         }, {
            id: 'testId2',
            value: 'testValue',
            resetValue: ''
         }];
         var filter = Filter._private.getFilterByItems(null, fastFilterItems);
         assert.deepEqual(filter, {testId2: 'testValue'});
      });
      
      it('_private.getFilterByItems(filterButtonItems, fastFilterItems)', function () {
         var fastFilterItems = [{
            id: 'testId',
            value: '',
            resetValue: ''
         }, {
            id: 'testId2',
            value: 'testValue',
            resetValue: ''
         }];
         
         var fbItems = [{
            id: 'testId2',
            value: '',
            resetValue: ''
         }, {
            id: 'testId3',
            value: 'testValue',
            resetValue: ''
         }];
         
         var filter = Filter._private.getFilterByItems(fbItems, fastFilterItems);
         assert.deepEqual(filter, {testId2: 'testValue', testId3: 'testValue'});
      });
      
      it('_private.mergeFilterItems', function () {
         var items = [{
            id: 'testId',
            value: '',
            textValue: '',
            resetValue: ''
         }, {
            id: 'testId2',
            value: 'testValue',
            textValue: '',
            resetValue: ''
         },
            {
               id: 'testId3',
               value: 'testValue2',
               textValue: 'textTextValue',
               resetValue: ''
            }];
         
         var history = [{
            id: 'testId',
            value: 'testValue',
            resetValue: '',
            textValue: 'textTextValue'
         }, {
            id: 'testId2',
            value: 'testValue1',
            resetValue: '',
            textValue: ''
         }];
         
         var result = [{
            id: 'testId',
            value: 'testValue',
            textValue: 'textTextValue',
            resetValue: ''
         }, {
            id: 'testId2',
            value: 'testValue1',
            textValue: '',
            resetValue: ''
         },
            {
               id: 'testId3',
               value: 'testValue2',
               textValue: 'textTextValue',
               resetValue: ''
            }];
         
         Filter._private.mergeFilterItems(items, history);
         assert.deepEqual(result, items);
      });
   
      it('_filterChanged', function() {
         var filterLayout = new Filter();
         var filterChangedNotifyed = false;
         var resultFilter = {test: 'test'};
         filterLayout._notify = function() {
            filterChangedNotifyed = true;
         };
         
         filterLayout._filterChanged(null, {test: 'test'});
         
         assert.deepEqual(filterLayout._filter, resultFilter);
         assert.isTrue(filterChangedNotifyed);
      });
      
   });
   
});