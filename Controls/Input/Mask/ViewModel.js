define('Controls/Input/Mask/ViewModel',
   [
      'Controls/Input/Mask/FormatBuilder',
      'Controls/Input/Mask/InputProcessed',
      'Controls/Input/resources/InputRender/BaseViewModel'
   ],
   function(FormatBuilder, InputProcessed, BaseViewModel) {

      'use strict';

      /**
       * @class Controls/Input/Text/ViewModel
       * @private
       * @author Журавлев Максим Сергеевич
       */
      var ViewModel = BaseViewModel.extend({
         constructor: function(options) {
            this._options = {
               value: options.value
            };
            this._replacer = options.replacer;
            this._maskData = FormatBuilder.getFormat(options.mask, options.formatMaskChars, options.replacer);
         },

         /**
          * Обновить опции.
          * @param newOptions Новые опции(replacer, mask).
          */
         updateOptions: function(newOptions) {
            this._options.value = newOptions.value;
            this._replacer = newOptions.replacer;
            this._maskData = FormatBuilder.getFormat(newOptions.mask, newOptions.formatMaskChars, newOptions.replacer);
         },

         /**
          * Подготовить данные.
          * @param splitValue значение разбитое на части before, insert, after, delete.
          * @param inputType тип ввода.
          * @returns {{value: (String), position: (Integer)}}
          */
         handleInput: function(splitValue, inputType) {
            var result = InputProcessed.input(splitValue, inputType, this._replacer, this._maskData);

            this._options.value = result.value;

            return result;
         }
      });

      return ViewModel;
   }
);