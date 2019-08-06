import Control = require('Core/Control');
import template = require('wml!Controls/_lookupPopup/Container');
import ControllerContext = require('Controls/_lookupPopup/__ControllerContext');
import {ContextOptions} from 'Controls/context';
import chain = require('Types/chain');
import Utils = require('Types/util');
import {Controller as SourceController} from 'Controls/source';
import {selectionToRecord} from 'Controls/operations';
import Deferred = require('Core/Deferred');
import cInstance = require('Core/core-instance');
import {adapter} from 'Types/entity';
import {IData, IDecorator} from "Types/source";

/**
 * Контейнер принимает опцию selectedItems от Controls/lookupPopup:Controller и устанавливает опцию selectedKeys для дочернего списка.
 * Загружает список записей по списку первичных ключей из опции selectedKeys при завершении выбора
 * Должен использоваться внутри Controls/lookupPopup:Controller.
 * В одном Controls/lookupPopup:Controller можно использовать несколько контейнеров.
 *
 * Подробное описание и инструкцию по настройке смотрите в <a href='/doc/platform/developmentapl/interface-development/controls/layout-selector-stack/'>статье</a>.
 *
 * <a href="/materials/demo/demo-ws4-engine-selector-browser">Пример</a> использования контрола.
 *
 * @class Controls/_lookupPopup/Container
 * @extends Core/Control
 * @control
 * @mixes Controls/_interface/ISource
 * @public
 * @author Герасимов Александр Максимович
 */

/*
 * Container transfers selected items fromControls/lookupPopup:Controller to a specific list.
 * Loading data by selectedKeys on selection complete.
 * Must used inside Controls/lookupPopup:Controller.
 * In one Controls/lookupPopup:Controller can be used some Containers.
 *
 * More information you can read <a href='/doc/platform/developmentapl/interface-development/controls/layout-selector-stack/'>here</a>.
 *
 * <a href="/materials/demo/demo-ws4-engine-selector-browser">Here</a> you can see a demo.
 *
 * @class Controls/_lookupPopup/Container
 * @extends Core/Control
 * @control
 * @mixes Controls/_interface/ISource
 * @public
 * @author Герасимов Александр Максимович
 */


/**
 * @name Controls/_lookupPopup/Container#selectionFilter
 * @cfg {Function} Функция, которая фильтрует selectedItems переданные из Controls/lookupPopup:Controller для конкретного списка.
 * @remark По умолчанию опция selectionFilter установлена как функция, которая всегда возвращает true.
 * @example
 *
 * WML:
 * <pre>
 *    <Controls.lookupPopup:Container selectionFilter="{{_selectionFilter}}">
 *        ...
 *    </Controls.lookupPopup:Container>
 * </pre>
 *
 * JS:
 * <pre>
 *     _selectionFilter: function(item, index) {
 *        let filterResult = false;
 *
 *        if (item.get('Компания')) {
 *            filterResult = true;
 *        }
 *
 *        return filterResult;
 *     }
 * </pre>
 */

/*
 * @name Controls/_lookupPopup/Container#selectionFilter
 * @cfg {Function} Function that filters selectedItems from Controls/lookupPopup:Controller for a specific list.
 * @remark By default selectionFilter option is setted as function that always returns true.
 * @example
 *
 * WML:
 * <pre>
 *    <Controls.lookupPopup:Container selectionFilter="{{_selectionFilter}}">
 *        ...
 *    </Controls.lookupPopup:Container>
 * </pre>
 *
 * JS:
 * <pre>
 *     _selectionFilter: function(item, index) {
 *        let filterResult = false;
 *
 *        if (item.get('Компания')) {
 *            filterResult = true;
 *        }
 *
 *        return filterResult;
 *     }
 * </pre>
 */


/**
 * @name Controls/_lookupPopup/Container#selectionType
 * @cfg {String} Тип записей, которые можно выбрать.
 * @variant node только узлы доступны для выбора
 * @variant leaf только листья доступны для выбора
 * @variant all все типы записей доступны для выбора
 * @example
 * В данном примере для выбора доступны только листья.
 * <pre>
 *    <Controls.lookupPopup:ListContainer selectionType="leaf">
 *        ...
 *    </Controls.lookupPopup:ListContainer>
 * </pre>
 */

/*
 * @name Controls/_lookupPopup/Container#selectionType
 * @cfg {String} Type of records that can be selected.
 * @variant node only nodes are available for selection
 * @variant leaf only leafs are available for selection
 * @variant all all types of records are available for selection
 * @example
 * In this example only leafs are available for selection.
 * <pre>
 *    <Controls.lookupPopup:ListContainer selectionType="leaf">
 *        ...
 *    </Controls.lookupPopup:ListContainer>
 * </pre>
 */



      var SELECTION_TYPES = ['all', 'leaf', 'node'];

      var _private = {
         getFilteredItems: function(items, filterFunc) {
            return chain.factory(items).filter(filterFunc).value();
         },

         getKeysByItems: function(items, keyProperty) {
            return chain.factory(items).reduce(function(result, item) {
               result.push(item.get(keyProperty));
               return result;
            }, []);
         },

         getFilterFunction: function(func) {
            return func ? func : function() {
               return true;
            };
         },

         getSelectedKeys: function(options, context) {
            var items = _private.getFilteredItems(context.selectorControllerContext.selectedItems, _private.getFilterFunction(options.selectionFilter));
            return _private.getKeysByItems(items, context.dataOptions.keyProperty);
         },

         getSourceController: function(source) {
            return new SourceController({
               source: source
            });
         },

         getEmptyItems: function(currentItems) {
            /* make clone and clear to save items format */
            var emptyItems = currentItems.clone();
            emptyItems.clear();
            return emptyItems;
         },

         getValidSelectionType: function(selectionType) {
            let type;

            if (SELECTION_TYPES.indexOf(selectionType) !== -1) {
               type = selectionType;
            } else {
               type = 'all'
            }

            return type;
         },

         getSourceAdapter: function(source:IData):adapter.IAdapter {
            let adapter:adapter.IAdapter;

            if (cInstance.instanceOfMixin(source, 'Types/_source/IDecorator')) {
               adapter = (<IData>(source as IDecorator).getOriginal()).getAdapter();
            } else {
               adapter = source.getAdapter();
            }

            return adapter;
         },

         prepareFilter: function(filter:object, selection, searchParam:string|undefined):object {
            filter = Utils.object.clone(filter);

             // FIXME https://online.sbis.ru/opendoc.html?guid=e8bcc060-586f-4ca1-a1f9-1021749f99c2
             // TODO KINDO
             // При отметке всех записей в фильтре проставляется selection в виде:
             // marked: [null]
             // excluded: [null]
             // Если что-то поискать, отметить всё через панель массовых операций, и нажать "Выбрать"
             // то в фильтр необходимо посылать searchParam и selection, иначе выборка будет включать все записи,
             // даже которые не попали под фильтрацию при поиске.
             // Если просто отмечают записи чекбоксами (не через панель массовых операций),
             // то searchParam из фильтра надо удалять, т.к. записи могут отметить например в разных разделах,
             // и запрос с searchParam в фильтре вернёт не все записи, которые есть в selection'e.
            if (searchParam && selection.get('marked')[0] !== null) {
               delete filter[searchParam];
            }
            filter.selection = selection;
            return filter;
         },

         prepareResult: function(result, selectedKeys, keyProperty, selectCompleteInitiator) {
            return {
               resultSelection: result,
               initialSelection: selectedKeys,
               keyProperty: keyProperty,
               selectCompleteInitiator: selectCompleteInitiator
            };
         }
      };

      var Container = Control.extend({

         _template: template,
         _selectedKeys: null,
         _selection: null,
         _excludedKeys: null,
         _selectCompleteInitiator: false,

         _beforeMount: function(options, context) {
            this._selectedKeys = _private.getSelectedKeys(options, context);
            this._excludedKeys = [];
            this._initialSelectedKeys = this._selectedKeys.slice();
         },

         _beforeUpdate: function(newOptions, context) {
            var currentSelectedItems = this.context.get('selectorControllerContext').selectedItems;
            var newSelectedItems = context.selectorControllerContext.selectedItems;

            if (currentSelectedItems !== newSelectedItems) {
               this._selectedKeys = _private.getSelectedKeys(newOptions, context);
            }
         },

         _selectComplete: function():void {
            const self = this;
            const dataOptions = this.context.get('dataOptions');
            const keyProperty = dataOptions.keyProperty;
            const items = dataOptions.items;

            let loadDef;
            let indicatorId;

            if (this._selectedKeys.length || this._excludedKeys.length) {
               const source = dataOptions.source;
               const adapter = _private.getSourceAdapter(source);
               const sourceController = _private.getSourceController(source);
               const selection = {
                  selected: this._selectedKeys,
                  excluded: this._excludedKeys
               };
               const multiSelect = this._options.multiSelect;
               const selectedItem = items.getRecordById(this._selectedKeys[0]);

               if (!multiSelect && selectedItem) {
                  let selectedItems = _private.getEmptyItems(items);

                  selectedItems.add(selectedItem);
                  loadDef = Deferred.success(selectedItems);
               } else {
                  indicatorId = this._notify('showIndicator', [], {bubbling: true});
                  loadDef = sourceController.load(
                     _private.prepareFilter(
                        dataOptions.filter,
                        selectionToRecord(selection, adapter, _private.getValidSelectionType(this._options.selectionType)),
                        self._options.searchParam
                     )
                  );
               }
            } else {
               loadDef = Deferred.success(_private.getEmptyItems(items));
            }

            loadDef.addCallback(function(result) {
               if (indicatorId) {
                  self._notify('hideIndicator', [indicatorId], {bubbling: true});
               }

               return _private.prepareResult(result, self._initialSelectedKeys, keyProperty, self._selectCompleteInitiator);
            });

            this._notify('selectionLoad', [loadDef], {bubbling: true});
         },

         _selectedKeysChanged: function(event, selectedKeys, added, removed) {
            this._notify('selectedKeysChanged', [selectedKeys, added, removed], {bubbling: true});
         },

         _excludedKeysChanged: function(event, excludedKey, added, removed) {
            this._notify('excludedKeysChanged', [excludedKey, added, removed], {bubbling: true});
         },

         _selectCompleteHandler: function() {
            this._selectCompleteInitiator = true;
         }
      });

      Container.contextTypes = function() {
         return {
            selectorControllerContext: ControllerContext,
            dataOptions: ContextOptions
         };
      };

      Container._private = _private;

      export = Container;

