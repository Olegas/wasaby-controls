define([
   'Core/core-merge',
   'Controls/Input/DateTime/Model'
], function(
   cMerge,
   DateTimeModel
) {
   'use strict';

   let options = {
      mask: 'DD.MM.YYYY',
      value: new Date(2018, 0, 1),
      replacer: ' ',
   };

   describe('Controls/Input/DateTime/Model', function() {
      describe('constructor', function() {
         it('should initialize internal fields', function() {
            let model = new DateTimeModel(options);

            assert.strictEqual(model._mask, options.mask);
            assert.strictEqual(model.value, options.value);
            assert.strictEqual(model._lastValue, options.value);
            assert.strictEqual(model.textValue, '01.01.2018');
         });
      });

      describe('.update', function() {

         it('should update value fields if value changed', function() {
            let model = new DateTimeModel(options),
               newDate = new Date(2019, 1, 2);

            model.update(cMerge({ value: newDate }, options, { preferSource: true }));

            assert.strictEqual(model.value, newDate);
            assert.strictEqual(model._lastValue, newDate);
            assert.strictEqual(model.textValue, '02.02.2019');
         });

      });

      describe('.value', function() {

         it('should update native and text value', function() {
            let model = new DateTimeModel(options),
               newDate = new Date(2019, 1, 2);

            model.value = newDate;

            assert.strictEqual(model.value, newDate);
            assert.strictEqual(model._lastValue, newDate);
            assert.strictEqual(model.textValue, '02.02.2019');
         });

      });

      describe('.textValue', function() {

         it('should update native and text value', function() {
            let model = new DateTimeModel(options),
               newTextValue = '02.02.2019',
               newDate = new Date(2019, 1, 2);

            model.textValue = newTextValue;

            assert.strictEqual(model.value.getTime(), newDate.getTime());
            assert.strictEqual(model._lastValue.getTime(), newDate.getTime());
            assert.strictEqual(model.textValue, newTextValue);
         });

         it('should set Invalid Date if text value not full', function() {
            let model = new DateTimeModel(options),
               newTextValue = '02.0 .2019';

            model.textValue = newTextValue;

            // assert.isNone(model.value.getTime());
            assert.strictEqual(model._lastValue.getTime(), options.value.getTime());
            assert.strictEqual(model.textValue, newTextValue);
         });

      });

      describe('.autocomplete', function() {

         it('should update native and text value', function() {
            let model = new DateTimeModel(options),
               newTextValue = '02.02.2019',
               newDate = new Date(2019, 1, 2);

            model.autocomplete(newTextValue);

            assert.strictEqual(model.value.getTime(), newDate.getTime());
            assert.strictEqual(model._lastValue.getTime(), newDate.getTime());
            assert.strictEqual(model.textValue, newTextValue);
         });

      });

   });
});
