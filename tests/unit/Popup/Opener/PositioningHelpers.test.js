define(
   [
      'Controls/Popup/Opener/PositioningHelpers'
   ],

   function (PositioningHelpers) {
      'use strict';
      describe('Controls/Popup/Opener/PositioningHelpers', function () {
         describe('Sticky', function () {
            var targetCoords = {
               top: 200,
               left: 300,
               width: 400,
               height: 400
            };
            it('sticky positioning', function() {
               var position = PositioningHelpers.sticky(targetCoords, {}, {}, 300, 300, 1920, 1040);
               assert.isTrue(position.top === 200);
               assert.isTrue(position.left === 300);
            });

            it('sticky positioning with offset', function() {
               var position = PositioningHelpers.sticky(targetCoords, {offset: 200}, {offset: 200}, 300, 300, 1920, 1040);
               assert.isTrue(position.top === 400);
               assert.isTrue(position.left === 500);
            });

            it('sticky positioning vertical align top', function() {
               var position = PositioningHelpers.sticky(targetCoords, {}, {side: 'top'}, 100, 100, 1920, 1040);
               assert.isTrue(position.top === 100);
               assert.isTrue(position.left === 300);
            });

            it('sticky positioning horizontal align right', function() {
               var position = PositioningHelpers.sticky(targetCoords, {side: 'right'}, {}, 300, 300, 1920, 1040);
               assert.isTrue(position.top === 200);
               assert.isTrue(position.left === 0);
            });

            it('sticky positioning vertical align top reversed', function() {
               var position = PositioningHelpers.sticky(targetCoords, {}, {side: 'top'}, 300, 300, 1920, 1040);
               assert.isTrue(position.top === 200);
               assert.isTrue(position.left === 300);
            });

            it('sticky positioning horizontal align right reversed', function() {
               var position = PositioningHelpers.sticky(targetCoords, {side: 'right'}, {}, 400, 300, 1920, 1040);
               assert.isTrue(position.top === 200);
               assert.isTrue(position.left === 300);
            });
         });

         describe('Dialog', function () {
            it('dialog positioning', function() {
               var position = PositioningHelpers.dialog(1920, 1080, 200, 300);
               assert.isTrue(position.top === 390);
               assert.isTrue(position.left === 860);
            });
         });

         describe('Stack', function () {
            it('first stack positioning', function() {
               var position = PositioningHelpers.stack(0, 100, 1000, 1920);
               assert.isTrue(position.width === 1000);
               assert.isTrue(position.top === 0);
               assert.isTrue(position.right === 0);
               assert.isTrue(position.bottom === 0);
            });
            it('current panel is broader then previous', function() {
               var position = PositioningHelpers.stack(1, 100, 1200, 1920, 1000, 0);
               assert.isTrue(position.width === 1200);
               assert.isTrue(position.top === 0);
               assert.isTrue(position.right === 0);
               assert.isTrue(position.bottom === 0);
            });
            it('previous width is equal current width', function() {
               var position = PositioningHelpers.stack(1, 100, 1000, 1920, 1000, 0);
               assert.isTrue(position.width === 1000);
               assert.isTrue(position.top === 0);
               assert.isTrue(position.right === 100);
               assert.isTrue(position.bottom === 0);
            });
            it('hidden stack positioning', function() {
               var position = PositioningHelpers.stack(2, 100, 1000, 1920, 1900, 0);
               assert.isTrue(position === null);
            });
         });

         describe('Notification', function () {
            it('first notification positioning', function() {
               var position = PositioningHelpers.notification();
               assert.isTrue(position.right === 16);
               assert.isTrue(position.bottom === 16);
            });
         });
      });
   }
);