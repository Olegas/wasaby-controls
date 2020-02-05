import Control = require('Core/Control');
import tmplNotify = require('Controls/Utils/tmplNotify');
import template = require('wml!Controls/_explorer/PathController/PathWrapper');
import {ItemsUtil} from 'Controls/list';
import GridIsEqualUtil = require('Controls/_grid/utils/GridIsEqualUtil');
import HeadingPathBack = require('wml!Controls/_explorer/PathController/HeadingPathBack');

   var _private = {
      needCrumbs: function(header, items, rootVisible) {
         return !!items && ((!header && items.length > 0) || items.length > 1) || !!rootVisible;
      }
   };

   var PathController = Control.extend({
      _template: template,
      _needCrumbs: false,
      _items: null,

      _beforeMount: function(options) {
         return options.itemsPromise.addCallback((items) => {
            this._items = items;
            this._needCrumbs = _private.needCrumbs(options.header, items, options.rootVisible);
         });
      },

      _beforeUpdate: function(newOptions) {
         if (this._items !== newOptions.items ||
             this._options.rootVisible !== newOptions.rootVisible ||
             !GridIsEqualUtil.isEqualWithSkip(this._options.header, newOptions.header, { template: true })) {
            this._items = newOptions.items;
            this._needCrumbs = _private.needCrumbs(newOptions.header,  this._items, newOptions.rootVisible);
         }
      },

      _notifyHandler: tmplNotify

   });
   PathController._private = _private;
   export = PathController;
