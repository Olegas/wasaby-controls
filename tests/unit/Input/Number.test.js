define(
   [
      'Core/Control',
      'Controls/Input/Number/ViewModel'
   ],
   function(Control, NumberViewModel) {

      'use strict';

      describe('Controls.Input.Number', function() {
         var
            testCases = [
               {
                  testName: 'Invalid 12.0 => 12a.0',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '12',
                     insert: 'a',
                     after: '.0',
                     delete: ''
                  },
                  result: {
                     value: '12.0',
                     position: 2
                  },
                  inputType: 'insert'
               },
               {
                  testName: 'Invalid 12.3 => 12.3a',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '12.3',
                     insert: 'a',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '12.3',
                     position: 4
                  },
                  inputType: 'insert'
               },
               {
                  testName: 'Invalid 123.0 => -123',
                  controlConfig: {
                     onlyPositive: true
                  },
                  splitValue: {
                     before: '',
                     insert: '-',
                     after: '123',
                     delete: ''
                  },
                  result: {
                     value: '123.0',
                     position: 0
                  },
                  inputType: 'insert'
               },

               //Проверим что нельзя ввести больше указанного числа символов целой части
               {
                  testName: 'Max length integer part',
                  controlConfig: {
                     integersLength: 5
                  },
                  splitValue: {
                     before: '12 345',
                     insert: '6',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '12 345.6',
                     position: 7
                  },
                  inputType: 'insert'
               },

               //Проверим что нельзя ввести больше указанного числа символов дробной части
               {
                  testName: 'Max length decimal part',
                  controlConfig: {
                     precision: 5
                  },
                  splitValue: {
                     before: '0.12345',
                     insert: '6',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '0.12345',
                     position: 6
                  },
                  inputType: 'insert'
               },

               //Проверим что нельзя ввести точку, если precision: 0
               {
                  testName: 'No decimal part if precision is 0',
                  controlConfig: {
                     precision: 0
                  },
                  splitValue: {
                     before: '12',
                     insert: '.',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '12.0',
                     position: 2
                  },
                  inputType: 'insert'
               },

               //Проверим что при вводе точки в начало строки будет '0.'
               {
                  testName: 'Inserting a dot at the beginning of a line results in \'0.0\'',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '',
                     insert: '.',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '0.0',
                     position: 2
                  },
                  inputType: 'insert'
               },

               //При попытке удалить пробел происходит удаление символа левее него и сдвиг курсора влево
               {
                  testName: 'Delete space operation removes symbol before space and moves cursor left',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '123',
                     insert: '',
                     after: '456',
                     delete: ' '
                  },
                  result: {
                     value: '12 456',
                     position: 2
                  },
                  inputType: 'deleteBackward'
               },

               //Проверим что при вводе вместо точки запятой или буквы "б" или буквы "ю" - они будут заменены
               //Достаточно проверить что один символ из набора заменяется на точку. Проверка остальных символов будет излишней
               {
                  testName: 'Symbols ",", "б", "ю", "Б", "Ю" are replaced by dot',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '123',
                     insert: 'б',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '123.0',
                     position: 4
                  },
                  inputType: 'insert'
               },

               //Проверим что нельзя вставить вторую точку
               {
                  testName: 'Second dot is not allowed',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '123.456',
                     insert: '.',
                     after: '789',
                     delete: ''
                  },
                  result: {
                     value: '123.456789',
                     position: 7
                  },
                  inputType: 'insert'
               },

               //Проверка удаления пробела клавишей delete
               {
                  testName: 'Remove space using \'delete\' button',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '123',
                     insert: '',
                     after: '456',
                     delete: ' '
                  },
                  result: {
                     value: '12 356',
                     position: 4
                  },
                  inputType: 'deleteForward'
               },

               {
                  testName: 'Insert minus after zero',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '0',
                     insert: '-',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '-0.0',
                     position: 2
                  },
                  inputType: 'insert'
               },

               {
                  testName: 'Insert number after first "0" in line',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '0',
                     insert: '1',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '1.0',
                     position: 1
                  },
                  inputType: 'insert'
               },

               {
                  testName: 'Insert number after first "-0" in line',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '-0',
                     insert: '1',
                     after: '',
                     delete: ''
                  },
                  result: {
                     value: '-1.0',
                     position: 2
                  },
                  inputType: 'insert'
               },

               {
                  testName: 'Insert number in field with maxed integers (first in line)',
                  controlConfig: {
                     integersLength: 5
                  },
                  splitValue: {
                     before: '',
                     insert: '6',
                     after: '12 345.0',
                     delete: ''
                  },
                  result: {
                     value: '62 345.0',
                     position: 1
                  },
                  inputType: 'insert'
               },

               {
                  testName: 'Insert number in field with maxed integers (before space)',
                  controlConfig: {
                     integersLength: 4
                  },
                  splitValue: {
                     before: '',
                     insert: '5',
                     after: '1 234.0',
                     delete: ''
                  },
                  result: {
                     value: '5 234.0',
                     position: 1
                  },
                  inputType: 'insert'
               },

               {
                  testName: 'Delete dot forward followed by single zero',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '123',
                     insert: '',
                     after: '0',
                     delete: '.'
                  },
                  result: {
                     value: '123.0',
                     position: 4
                  },
                  inputType: 'deleteForward'
               },

               {
                  testName: 'Delete dot forward followed by some number',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '123',
                     insert: '',
                     after: '456',
                     delete: '.'
                  },
                  result: {
                     value: '123.56',
                     position: 4
                  },
                  inputType: 'deleteForward'
               },

               {
                  testName: 'Delete whole decimal part',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '123',
                     insert: '',
                     after: '4',
                     delete: '.'
                  },
                  result: {
                     value: '123.4',
                     position: 3
                  },
                  inputType: 'deleteBackward'
               },

               {
                  testName: 'Delete last symbol',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '',
                     insert: '',
                     after: '',
                     delete: '1'
                  },
                  result: {
                     value: '0',
                     position: 1
                  },
                  inputType: 'deleteBackward'
               },

               {
                  testName: 'Delete last symbol (negative number)',
                  controlConfig: {
                  },
                  splitValue: {
                     before: '-',
                     insert: '',
                     after: '',
                     delete: '1'
                  },
                  result: {
                     value: '0',
                     position: 1
                  },
                  inputType: 'deleteBackward'
               },

               {
                  testName: 'Delete decimal when showEmptyDecimals is enabled',
                  controlConfig: {
                     showEmptyDecimals: true
                  },
                  splitValue: {
                     before: '123.45',
                     insert: '',
                     after: '',
                     delete: '6'
                  },
                  result: {
                     value: '123.450',
                     position: 6
                  },
                  inputType: 'deleteBackward'
               }
            ];

         testCases.forEach(function(item) {
            it(item.testName, function () {
               var
                  numberViewModel = new NumberViewModel(item.controlConfig),
                  result = numberViewModel.handleInput(item.splitValue, item.inputType);

               assert.equal(result.value, item.result.value);
            });
         });

         it('getDisplayValue: only integers', function () {
            var
               numberViewModel = new NumberViewModel({
                  value: 123456
               }),
               result = numberViewModel.getDisplayValue();

            assert.equal(result, '123 456');
         });

         it('getDisplayValue: integers and decimals', function () {
            var
               numberViewModel = new NumberViewModel({
                  value: 123456.78
               }),
               result = numberViewModel.getDisplayValue();

            assert.equal(result, '123 456.78');
         });

         describe('getDisplayValue', function() {
            var getValueTests = [
               ['123456', '123 456'],
               ['-123456', '-123 456'],
               ['123.456', '123.456'],
               ['0', '0'],
               ['-', '-'],
               ['', '']
            ];

            getValueTests.forEach(function(test, i) {
               it('Test ' + i, function () {
                  var numberViewModel = new NumberViewModel({
                     value: test[0]
                  });
                  var result = numberViewModel.getDisplayValue();

                  assert.isTrue(result === test[1]);
               });
            });
         });

         it('\'0.\' wouldn\'t update if value is 0', function () {
            var
               numberViewModel = new NumberViewModel({}),
               result;

            numberViewModel.handleInput({
               before: '',
               insert: '.',
               after: '',
               delete: ' '
            });

            numberViewModel.updateOptions({
               value: 0
            });

            assert.equal(numberViewModel._options.value, '0.');
         });
      });
   }
);