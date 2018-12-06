define('Controls/Validate/Input',
   [
      'Controls/Validate/Controller',
      'wml!Controls/Validate/Input',
      'Core/helpers/isNewEnvironment'
   ],
   function(
      Controller,
      template,
      isNewEnvironment
   ) {
      'use strict';

      return Controller.extend({
         _template: template,
         _beforeMount: function() {
            this._isNewEnvironment = isNewEnvironment();
         },
         _deactivatedHandler: function() {
            this._shouldValidate = true;
            this._forceUpdate();
         },
         _cleanValid: function() {
            if (this._validationResult) {
               this.setValidationResult(null);
            }
         },
         _afterUpdate: function() {
            if (this._shouldValidate) {
               this._shouldValidate = false;
               this.validate();
            }
         }
      });
   });
