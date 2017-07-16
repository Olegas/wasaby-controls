/**
 * Created by nv.belotelov on 14.07.2017.
 */
define('js!WSTest/Focus/Scenario/6', [
   'Core/constants',
   'js!WSTest/Focus/TestFocusHelpers'
], function (cConstants,
             fHelpers) {
   'use strict';
   return function scenario6(testControl) {
      fHelpers.fireClick(testControl);
      fHelpers.childHasFocus(testControl, 'TextBox1');
   };
});