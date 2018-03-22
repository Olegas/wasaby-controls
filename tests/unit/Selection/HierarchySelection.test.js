/* global define, beforeEach, afterEach, describe, context, it, assert, $ws */
define(
   ['SBIS3.CONTROLS/ListView/resources/MassSelectionController/resources/HierarchySelection',
    'WS.Data/Collection/RecordSet',
    'WS.Data/Display/Tree'
   ],
   function (Selection, RecordSet, Projection) {
      'use strict';

      var data = new RecordSet({
         rawData: [
            { id: 1,    'title': '1',            'parent@': true, parent: null },
            { id: 11,   'title': '1 -> 1',       'parent@': null, parent: 1 },
            { id: 12,   'title': '1 -> 2',       'parent@': null, parent: 1 },
            { id: 13,   'title': '1 -> 3',       'parent@': null, parent: 1 },
            { id: 131,  'title': '1 -> 3 -> 1',  'parent@': null, parent: 13 },
            { id: 132,  'title': '1 -> 3 -> 2',  'parent@': null, parent: 13 },
            { id: 133,  'title': '1 -> 3 -> 3',  'parent@': null, parent: 13 },
            { id: 2,    'title': '2',            'parent@': null, parent: null },
            { id: 3,    'title': '3',            'parent@': null, parent: null }
         ],
         idProperty: 'id'
      });

      var selection = new Selection({
         root: null
      });

      selection.setProjection(new Projection({
         collection: data,
         idProperty: 'id',
         parentProperty: 'parent',
         nodeProperty: 'parent@',
         root: null,
         rootEnumerable: false
      }));


      describe('SBIS3.CONTROLS/ListView/resources/MassSelectionController/resources/HierarchySelection', function () {
         beforeEach(function() {
            selection.unselectAll();
         });
         it('addAll', function () {
            selection.selectAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [null]);
            assert.deepEqual(sel.excluded, []);
         });
         it('removeAll', function () {
            selection.unselectAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, []);
            assert.deepEqual(sel.excluded, []);
         });
         it('add and removeAll', function () {
            selection.select([1]);
            selection.unselectAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, []);
            assert.deepEqual(sel.excluded, []);
         });
         it('add leaf first lvl', function () {
            selection.select([2]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [2]);
            assert.deepEqual(sel.excluded, []);
         });
         it('add folder first lvl', function () {
            selection.select([1]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [1]);
            assert.deepEqual(sel.excluded, []);
         });
         it('add leaf second lvl', function () {
            selection.select([11]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [11]);
            assert.deepEqual(sel.excluded, []);
         });
         it('add folder second lvl', function () {
            selection.select([13]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [13]);
            assert.deepEqual(sel.excluded, []);
         });
         it('remove leaf first lvl', function () {
            selection.select([2]);
            selection.unselect([2]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, []);
            assert.deepEqual(sel.excluded, []);
         });
         it('remove folder first lvl', function () {
            selection.select([1]);
            selection.unselect([1]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, []);
            assert.deepEqual(sel.excluded, []);
         });
         it('remove leaf second lvl', function () {
            selection.select([11]);
            selection.unselect([11]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, []);
            assert.deepEqual(sel.excluded, []);
         });
         it('add folder and remove leaf', function () {
            selection.select([1]);
            selection.unselect([12]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [1]);
            assert.deepEqual(sel.excluded, [12]);
         });
         it('add folder and delete two leafs', function () {
            selection.select([1]);
            selection.unselect([11]);
            selection.unselect([12]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [1]);
            assert.deepEqual(sel.excluded, [11, 12]);
         });
         it('add folder and delete all leafs', function () {
            selection.select([1]);
            selection.unselect([11, 12, 13]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, []);
            //assert.deepEqual(sel.excluded, []);
         });
         it('add all leafs', function () {
            selection.select([11, 12, 13]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [11, 12, 13]);
            assert.deepEqual(sel.excluded, []);
         });
         it('add folder delete child folder and add leaf', function () {
            selection.select([1]);
            selection.unselect([13]);
            selection.select([131]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [1, 131]);
            assert.deepEqual(sel.excluded, [13]);
         });
         it('toggleAll', function () {
            selection.toggleAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [null]);
            assert.deepEqual(sel.excluded, []);
         });
         it('toggleAll and toggleAll', function () {
            selection.toggleAll();
            selection.toggleAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, []);
            assert.deepEqual(sel.excluded, []);
         });
         it('add, toggleAll and toggleAll', function () {
            selection.select([1]);
            selection.toggleAll();
            selection.toggleAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [1]);
            assert.deepEqual(sel.excluded, []);
         });
         it('add and toggleAll', function () {
            selection.select([2]);
            selection.toggleAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [null]);
            assert.deepEqual(sel.excluded, [2]);
         });
         it('add, toggleAll and remove', function () {
            selection.select([2]);
            selection.toggleAll();
            selection.unselect([3]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [null]);
            assert.deepEqual(sel.excluded, [2, 3]);
         });
         it('add in folder and toggleAll', function () {
            selection.select([11, 12]);
            selection.toggleAll();
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [null]);
            assert.deepEqual(sel.excluded, [11, 12]);
         });
         it('folder selected after toggle child', function () {
            selection.select([1]);
            selection.unselect([11]);
            selection.select([11]);
            var sel = selection.getSelection();
            assert.deepEqual(sel.marked, [1]);
            assert.deepEqual(sel.excluded, []);
         });
      });
   });