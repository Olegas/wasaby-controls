define('js!SBIS3.CONTROLS.FilterPanelChooser', [
   'Core/core-functions',
   'Core/CommandDispatcher',
   'Core/helpers/collection-helpers',
   'Core/core-instance',
   'Core/helpers/functional-helpers',
    'js!SBIS3.CORE.CompoundControl',
    'js!SBIS3.CONTROLS.IFilterItem',
    'tmpl!SBIS3.CONTROLS.FilterPanelChooser',
    'tmpl!SBIS3.CONTROLS.FilterPanelChooser/resources/itemTpl',
    'js!SBIS3.CONTROLS.Action.SelectorAction',
    'js!WS.Data/Source/Memory',
    'js!SBIS3.CONTROLS.ArraySimpleValuesUtil',
    'js!SBIS3.CONTROLS.ListView',
    'js!SBIS3.CONTROLS.Link',
    'js!SBIS3.CONTROLS.FilterPanelBoolean',
    'i18n!SBIS3.CONTROLS.FilterPanelChooser'
], function(cFunctions, CommandDispatcher, colHelpers, cInstance, fHelpers, CompoundControl, IFilterItem, dotTplFn, itemTpl, SelectorAction, Memory, ArraySimpleUtil) {

    var MAX_ITEMS_COUNT = 7,
        contains = function(arr1, arr2) {
           for (var i = 0; i < arr2.length; i++) {
               if (!ArraySimpleUtil.hasInArray(arr1, arr2[i])) {
                   return false;
               }
           }
           return true;
        },
        createDataSource = function(items, keyField) {
            return new Memory({
                data: items,
                idProperty: keyField
            });
        };
    'use strict';

    /**
     * @author Крайнов Дмитрий Олегович
     * @class SBIS3.CONTROLS.FilterPanelChooser
     * @extends SBIS3.CONTROLS.CompoundControl
     */

    var FilterPanelChooser = CompoundControl.extend([IFilterItem], /** @lends SBIS3.CONTROLS.CompoundControl.prototype */ {
        _dotTplFn: dotTplFn,
        $protected: {
            _options: {
                _itemTpl: itemTpl,
                items: undefined,
                filter: [],
                favorites: [],
                favoritesCount: undefined,
                captionFullList: 'Все',
                //list, dictionary, favorites
                viewMode: 'list',
                keyField: 'id',
                countField: 'count',
                displayField: 'title',
                /**
                 * @typedef {String} selectionTypeDef Режим выбора.
                 * @variant node выбираются только узлы
                 * @variant leaf выбираются только листья
                 * @variant all выбираются все записи
                 * @typedef {Object} dictionaryOptions
                 * @property {String} template Компонент, на основе которого организован справочник.
                 * @property {selectionTypeDef} selectionType
                 * @property {Object} componentOptions
                 * Группа опций, которые передаются в секцию _options компонента из опции template. На его основе строится справочник.
                 * Значения переданных опций можно использовать в дочерних компонентах справочника через инструкции шаблонизатора.
                 **/
                /**
                 * @cfg {dictionaryOptions} Устанавливает настройки справочника.
                 **/
                dictionaryOptions: {}
            },
            //Происходил выбор из справочника
            _isSelected: false
        },

        $constructor: function() {
            CommandDispatcher.declareCommand(this, 'showAll', this._showAll.bind(this));
            CommandDispatcher.declareCommand(this, 'showDictionary', this._showDictionary.bind(this))
        },

        init: function() {
            var
                listView,
                sorting = {};
            FilterPanelChooser.superclass.init.apply(this, arguments);
            listView = this._getListView();
            listView._checkClickByTap = false;
            listView.subscribe('onItemClick', this._elemClickHandler.bind(this));
            listView.subscribe('onSelectedItemsChange', this._selectedItemsChangeHandler.bind(this));
            //TODO: декларативно не задать, потому что не поддерживается динамическое имя опции объекта
            sorting[this._options.countField] = 'DESC';
            listView.setSorting(sorting);
            if (this._options.viewMode === 'favorites') {
                this._getFavoritesCheckBox().subscribe('onCheckedChange', this._onFavoritesCheckedChange.bind(this));
            }
            this._updateFavoritesCheckBox();

            //TODO: придрот. обработчик клика по надписи 'Избранное'
            $('.js-controls-CheckBox__caption', this._container).bind('click', this._clickFavoritesHandler.bind(this));
        },

        _modifyOptions: function() {
            var opts = FilterPanelChooser.superclass._modifyOptions.apply(this, arguments);
            opts.dataSource = createDataSource(opts.items, opts.keyField);
            opts._itemsCount = opts.items.length;
            return opts;
        },

        getFilter: function() {
            return this._options.filter;
        },

        setFilter: function(keys) {
            this._setFilter(keys);
            this._getListView().setSelectedKeys(keys);
            this._updateFavoritesCheckBox();
        },

        _setFilter: function(filter) {
            this._options.filter = filter;
            this._notifyOnPropertyChanged('filter');
        },

        _clickFavoritesHandler: function(e) {
            this._showDictionary({componentOptions: { isFavorites: true }});
            e.stopPropagation();
        },

        _elemClickHandler: function(e, id) {
            this._getListView().toggleItemsSelection([id]);
            this._updateFilter();
        },

        _onFavoritesCheckedChange: function() {
            this._updateFilter();
        },

        _updateFilter: function() {
            var
                favorites = this._options.favorites,
                filter = cFunctions.clone(this._getListView().getSelectedKeys());
            if (this._options.viewMode === 'favorites' && this._getFavoritesCheckBox().isChecked()) {
                for (var i = 0; i < favorites.length; i++) {
                    if (!ArraySimpleUtil.hasInArray(filter, favorites[i])) {
                        filter.push(favorites[i]);
                    }
                }
            }
            this._setFilter(filter);
        },

        _selectedItemsChangeHandler: function(event, idArray, changed) {
            var
                item,
                items,
                source;
            if (this._isSelected) {
                items = this._getListView().getItems();
                source = this._getListView().getDataSource();
                colHelpers.forEach(changed.removed, function(id) {
                    item = items.getRecordById(id);
                    if (item) {
                        items.remove(items.getRecordById(id));
                        source.destroy(id);
                    }
                }, this);
            }
        },

        _showAll: function() {
            this._getListView().setPageSize(Infinity);
            this._getAllButton().hide();
        },

        _showDictionary: function(meta) {
            meta = cFunctions.merge(cFunctions.clone(this._options.dictionaryOptions), meta || {});
            meta.selectedItems = this._getListView().getSelectedItems();
            this._getSelector().execute(meta);
        },

        _updateAllButton: function() {
            var count = this._options._itemsCount;
            if (count > 3) {
                this._getAllButton().setCaption('Ещё' + ' ' + (count - 3));
            }
            this._getAllButton().toggle(count > 3);
        },

        _updateFavoritesCheckBox: function() {
            if (this._options.viewMode === 'favorites') {
                this._getFavoritesCheckBox().setChecked(contains(this._options.filter, this._options.favorites));
            }
        },

        _onExecutedHandler: function(event, meta, result) {
            var
                items = [],
                selectedKeys = [];
            if (cInstance.instanceOfModule(result, 'WS.Data/Collection/List')) {
                result.each(function(item) {
                    items.push(item.toObject());
                });
                this._options._itemsCount = result.getCount();
                this._getListView().setPageSize(3, true);
                this._getListView().setDataSource(createDataSource(items, this._options.keyField));
                for (var i = 0; i < items.length; i++) {
                    selectedKeys.push(items[i][this._options.keyField]);
                }
                this._getListView().setSelectedKeys(selectedKeys);
                this._updateFilter();
                this._updateAllButton();
                this._isSelected = true;
            }
        },

        _getAllButton: controlGetter.call(this, 'controls-FilterPanelChooser__allButton', '_getAllButton'),
        _getListView: controlGetter.call(this, 'controls-FilterPanelChooser__ListView', '_getListView'),
        _getFavoritesCheckBox: controlGetter.call(this, 'controls-FilterPanelChooser__favoritesCheckBox', '_getFavoritesCheckBox'),
        _getSelector: fHelpers.memoize(function() {
            return new SelectorAction({
                mode: 'floatArea',
                handlers: {
                    onExecuted: this._onExecutedHandler.bind(this)
                }
            });
        }, '_getSelector')

    });

    function controlGetter (controlName, fnName) {
        return fHelpers.memoize(function() {
            return this.getChildControlByName(controlName);
        }, fnName)
    }

    return FilterPanelChooser;

});
