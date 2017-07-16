/**
 * Created by nv.belotelov on 14.07.2017.
 */
define('js!WSTest/Focus/Scenario/11', [
   'Core/constants',
   'js!WSTest/Focus/TestFocusHelpers'
], function (cConstants,
             fHelpers) {
   'use strict';
   return function scenario11(testControl) {//TODO Фокус на textbox0
      fHelpers.setChildActive(testControl, 'TextBox0', true);
      fHelpers.childHasFocus(testControl, 'TextBox0');
      fHelpers.childIsActive(testControl, 'TextBox0');

      fHelpers.setChildActive(testControl, "TextBox1", true);
      // fHelpers.checkFocusOnBody();
   };
});