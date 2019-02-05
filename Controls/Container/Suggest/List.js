/**
 * Created by am.gerasimov on 18.04.2018.
 */
define('Controls/Container/Suggest/List',
   [
      'Core/Control',
      'wml!Controls/Container/Suggest/List/List',
      'Core/core-clone',
      'Controls/Container/Suggest/Layout/_SuggestOptionsField'
   ],
   
   function(Control, template, clone, _SuggestOptionsField) {
      
      /**
       * Container for list inside Suggest.
       *
       * @class Controls/Container/Suggest/List
       * @extends Core/Control
       * @author Герасимов Александр
       * @control
       * @public
       */
      
      'use strict';

      var DIALOG_PAGE_SIZE = 25;
      
      var _private = {
         checkContext: function(self, context) {
            if (context && context.suggestOptionsField) {
               self._suggestListOptions = context.suggestOptionsField.options;
      
               if (self._suggestListOptions.dialogMode) {
                  var navigation = clone(self._suggestListOptions.navigation);
                  
                  /* to turn on infinityScroll */
                  navigation.view = 'infinity';
                  if (!navigation.viewConfig) {
                     navigation.viewConfig = {};
                  }
                  
                  /* to show paging */
                  navigation.viewConfig.pagingMode = true;
                  navigation.sourceConfig.pageSize = DIALOG_PAGE_SIZE;
                  self._navigation = navigation;
               } else {
                  self._navigation = self._suggestListOptions.navigation;
               }
            }
         },
   
         isTabChanged: function(options, tabKey) {
            var currentTabSelectedKey = options.tabsSelectedKey;
            return currentTabSelectedKey !== tabKey;
         },
   
         getTabKeyFromContext: function(context) {
            var tabKey = context && context.suggestOptionsField && context.suggestOptionsField.options.tabsSelectedKey;
            return tabKey !== undefined ? tabKey : null;
         },

         dispatchEvent: function(container, nativeEvent, customEvent) {
            customEvent.keyCode = nativeEvent.keyCode;
            container.dispatchEvent(customEvent);
         }
      };
      
      var List = Control.extend({
         
         _template: template,
         
         _beforeMount: function(options, context) {
            _private.checkContext(this, context);
         },
         
         _beforeUpdate: function(newOptions, context) {
            var tabKey = _private.getTabKeyFromContext(context);
            
            /* Need notify after getting tab from query */
            if (_private.isTabChanged(this._suggestListOptions, tabKey)) {
               this._tabsSelectedKeyChanged(null, tabKey);
            }
            
            _private.checkContext(this, context);
         },
   
         _tabsSelectedKeyChanged: function(event, key) {
            this._notify('tabsSelectedKeyChanged', [key]);
         },

         _inputKeydown: function(event, domEvent) {
            //TODO will refactor on the project https://online.sbis.ru/opendoc.html?guid=a2e1122b-ce07-4a61-9c04-dc9b6402af5d
            var list = this._children.list;

            //remove list._container[0] after https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
            var listContainer = list._container[0] || list._container;
            var customEvent = new Event('keydown');
            _private.dispatchEvent(listContainer, domEvent.nativeEvent, customEvent);
         }
      });
   
      List.contextTypes = function() {
         return {
            suggestOptionsField: _SuggestOptionsField
         };
      };
   
      List._private = _private;
      
      return List;
   });

