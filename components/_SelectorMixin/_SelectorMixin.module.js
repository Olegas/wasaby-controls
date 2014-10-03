/**
 * Created by iv.cheremushkin on 14.08.2014.
 */

define('js!SBIS3.CONTROLS._SelectorMixin', [], function() {

   /**
    * Миксин, добавляющий поведение хранения выбранного элемента. Всегда только одного
    * @mixin SBIS3.CONTROLS._SelectorMixin
    */

   var _SelectorMixin = /**@lends SBIS3.CONTROLS._SelectorMixin.prototype  */{
      $protected: {
         _selectedItem : null,
         _options: {
            /**
             * @cfg {String} Идентификатор выбранного элемента
             */
            selectedItem : null
         }
      },

      $constructor: function() {
         this._publish('onChangeSelectedItem');
         if (this._options.selectedItem) {
            this._selectedItem = this._options.selectedItem;
         }
      },

      /**
       * Установить выбранный элемент
       * @param id
       */
      setSelectedItem : function(id) {
         this._selectedItem = id;
         this._drawSelectedItem(id);
         this._notifySelectedItem(id);
      },

      /**
       * Получить выбранные элементы
       */
      getSelectedItem : function() {
         return this._selectedItem;
      },

      _drawSelectedItem : function() {
         /*Method must be implemented*/
      },

      _notifySelectedItem : function(id) {
         //TODO: может тут указать, что метод надо переопредить чтобы текст передавать и пр.?
         this._notify('onChangeSelectedItem', id);
      }
   };

   return _SelectorMixin;

});