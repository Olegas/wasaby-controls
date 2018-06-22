define('Controls-demo/List/Grid/Grid', [
   'Core/Control',
   'Controls-demo/List/Grid/GridData',
   'tmpl!Controls-demo/List/Grid/Grid',
   'WS.Data/Source/Memory',
   'tmpl!Controls-demo/List/Grid/DemoItem',
   'tmpl!Controls-demo/List/Grid/DemoBalancePrice',
   'tmpl!Controls-demo/List/Grid/DemoCostPrice',
   'tmpl!Controls-demo/List/Grid/DemoHeaderCostPrice',

   'tmpl!Controls-demo/List/Grid/DemoTasksPhoto',
   'tmpl!Controls-demo/List/Grid/DemoTasksDescr',
   'tmpl!Controls-demo/List/Grid/DemoTasksReceived',
   'Controls/Render/Money/Money',
   'css!Controls-demo/List/Grid/Grid',
   'Controls/Container/Scroll',
   'Controls/Grid',
   'Controls/Render/Money/Money',
   'tmpl!Controls-demo/List/Grid/DemoGroupTemplate'
], function (BaseControl, GridData, template, MemorySource) {

   'use strict';

   var showType = {

      //show only in Menu
      MENU: 0,

      //show in Menu and Toolbar
      MENU_TOOLBAR: 1,

      //show only in Toolbar
      TOOLBAR: 2
   };

   var _firstItemActionsArray = [
      {
         id: 5,
         title: 'прочитано',
         showType: showType.TOOLBAR,
         handler: function() {
            console.log('action read Click');
         }
      },
      {
         id: 1,
         icon: 'icon-primary icon-PhoneNull',
         title: 'phone',
         handler: function(item) {
            console.log('action phone Click ', item);
         }
      },
      {
         id: 2,
         icon: 'icon-primary icon-EmptyMessage',
         title: 'message',
         handler: function() {
            alert('Message Click');
         }
      },
      {
         id: 3,
         icon: 'icon-primary icon-Profile',
         title: 'profile',
         showType: showType.MENU_TOOLBAR,
         handler: function() {
            console.log('action profile Click');
         }
      },
      {
         id: 4,
         icon: 'icon-Erase icon-error',
         title: 'delete pls',
         showType: showType.TOOLBAR,
         handler: function() {
            console.log('action delete Click');
         }
      }
   ];

   var

      ModuleClass = BaseControl.extend({
         _template: template,

         _showAction: function(action, item) {
            if (item.get('id') === '471329') {
               if (action.id === 2 || action.id === 3) {
                  return false;
               } else {
                  return true;
               }

            }
            if (action.id === 5) {
               return false;
            }
            if (item.get('id') === '448390') {
               return false;
            }

            return true;
         },
         _onActionClick: function(event, action, item) {
            console.log(arguments);
         },
         _itemActions: _firstItemActionsArray,

         _dataLoadCallback: function(items) {
            items.setMetaData({
               groupResults: {
                  withoutPrice: '0 руб. 00 коп.',
                  between0and100: '818 руб. 86 коп.',
                  between100and200: '2858 руб. 86 коп.',
                  between200and300: '3148 руб. 86 коп.',
                  between300and400: '1818 руб. 86 коп.',
                  more400: '10500 руб. 35 коп.'
               }
            });
         },

         _viewSource: new MemorySource({
            idProperty: 'id',
            data: GridData.catalog
         }),

         gridData: GridData,
         _itemsGroupMethod: function(item) {
            if (item.get('costPrice') === null) {
               return 'withoutPrice';
            }
            if (item.get('costPrice') < 100) {
               return 'between0and100';
            }
            if (item.get('costPrice') > 100 && item.get('costPrice') < 200) {
               return 'between100and200';
            }
            if (item.get('costPrice') > 200 && item.get('costPrice') < 300) {
               return 'between200and300';
            }
            if (item.get('costPrice') > 300 && item.get('costPrice') < 400) {
               return 'between300and400';
            }
            if (item.get('costPrice') > 400) {
               return 'more400';
            }
         },
         gridColumns: [
            {
               displayProperty: 'name',
               width: '1fr'
            },
            {
               displayProperty: 'price',
               width: 'auto',
               align: 'right',
               template: 'tmpl!Controls-demo/List/Grid/DemoCostPrice'
            },
            {
               displayProperty: 'balance',
               width: 'auto',
               align: 'right',
               template: 'tmpl!Controls-demo/List/Grid/DemoBalancePrice'
            },
            {
               displayProperty: 'reserve',
               width: 'auto',
               align: 'right'
            },
            {
               displayProperty: 'costPrice',
               width: 'auto',
               align: 'right',
               template: 'tmpl!Controls-demo/List/Grid/DemoCostPrice'
            },
            {
               displayProperty: 'balanceCostSumm',
               width: 'auto',
               align: 'right',
               template: 'tmpl!Controls-demo/List/Grid/DemoCostPrice'
            }
         ],
         gridHeader: [
            {
               title: ''
            },
            {
               title: 'Цена',
               align: 'right'
            },
            {
               title: 'Остаток',
               align: 'right'
            },
            {
               title: 'Резерв',
               align: 'right'
            },
            {
               title: 'Себест.',
               align: 'right',
               template: 'tmpl!Controls-demo/List/Grid/DemoHeaderCostPrice'
            },
            {
               title: 'Сумма остатка',
               align: 'right'
            }
         ],

         tasksColumns: [
            {
               template: 'tmpl!Controls-demo/List/Grid/DemoTasksPhoto',
               width: 'auto'
            },
            {
               template: 'tmpl!Controls-demo/List/Grid/DemoTasksDescr',
               width: '1fr'
            },
            {
               template: 'tmpl!Controls-demo/List/Grid/DemoTasksReceived',
               width: 'auto'
            }
         ]
      });

   return ModuleClass;
});