/**
 * Created by iv.cheremushkin on 14.08.2014.
 */

define('js!SBIS3.CONTROLS.ListView',
   [
      'js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CORE.CompoundActiveFixMixin',
      'js!SBIS3.CONTROLS.DSMixin',
      'js!SBIS3.CONTROLS.MultiSelectable',
      'js!SBIS3.CONTROLS.Selectable',
      'js!SBIS3.CONTROLS.DataBindMixin',
      'js!SBIS3.CONTROLS.DecorableMixin',
      'js!SBIS3.CONTROLS.ItemActionsGroup',
      'html!SBIS3.CONTROLS.ListView',
      'js!SBIS3.CONTROLS.CommonHandlers',
      'js!SBIS3.CONTROLS.MoveHandlers',
      'js!SBIS3.CONTROLS.Pager',
      'is!browser?html!SBIS3.CONTROLS.ListView/resources/ListViewGroupBy',
      'is!browser?html!SBIS3.CONTROLS.ListView/resources/emptyData',
      'is!browser?js!SBIS3.CONTROLS.ListView/resources/SwipeHandlers'
   ],
   function (CompoundControl, CompoundActiveFixMixin, DSMixin, MultiSelectable, Selectable, DataBindMixin, DecorableMixin, ItemActionsGroup, dotTplFn, CommonHandlers, MoveHandlers, Pager, groupByTpl, emptyDataTpl) {

      'use strict';

      var
         ITEMS_ACTIONS_HEIGHT = 20;

      /**
       * Контрол, отображающий внутри себя набор однотипных сущностей.
       * Умеет отображать данные списком по определенному шаблону, а так же фильтровать и сортировать.
       * @class SBIS3.CONTROLS.ListView
       * @extends $ws.proto.Control
       * @author Крайнов Дмитрий Олегович
       * @mixes SBIS3.CONTROLS.DSMixin
       * @mixes SBIS3.CONTROLS.MultiSelectable
       * @mixes SBIS3.CONTROLS.Selectable
       * @mixes SBIS3.CONTROLS.DecorableMixin
       * @mixes SBIS3.CONTROLS.DataBindMixin
       * @control
       * @public
       * @cssModifier controls-ListView__withoutMarker Убирать маркер активной строки.
       * @cssModifier controls-ListView__showCheckBoxes Чекбоксы показываются не по ховеру, а сразу все.
       * @cssModifier controls-ListView__hideCheckBoxes Скрыть все чекбоксы.
       */

      /*TODO CommonHandlers MoveHandlers тут в наследовании не нужны*/
      var ListView = CompoundControl.extend([CompoundActiveFixMixin, DSMixin, MultiSelectable, Selectable, DataBindMixin, DecorableMixin, CommonHandlers, MoveHandlers], /** @lends SBIS3.CONTROLS.ListView.prototype */ {
         _dotTplFn: dotTplFn,
         /**
          * @event onChangeHoveredItem При переводе курсора мыши на другую запись
          * @remark
          * Событие срабатывает при смене записи под курсором мыши.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} hoveredItem Объект
          * @param {Number|String} hoveredItem.key ключ элемента представления данных
          * @param {jQuery|false} hoveredItem.container элемент представления данных
          * @param {Object} hoveredItem.position координаты контейнера элемента
          * @param {Number} hoveredItem.top отступ сверху
          * @param {Number} hoveredItem.left отступ слева
          * @param {Object} hoveredItem.size размеры контейнера элемента
          * @param {Number} hoveredItem.height высота
          * @param {Number} hoveredItem.width ширина
          * @example
          * <pre>
          *     DataGridView.subscribe('onChangeHoveredItem', function(hoveredItem) {
           *        var actions = DataGridView.getItemsActions(),
           *        instances = actions.getItemsInstances();
           *
           *        for (var i in instances) {
           *           if (instances.hasOwnProperty(i)) {
           *              //Будем скрывать кнопку удаления для всех строк
           *              instances[i][i === 'delete' ? 'show' : 'hide']();
           *           }
           *        }
           *     });
          * </pre>
          * @see itemsActions
          * @see setItemsActions
          * @see getItemsActions
          */
         /**
          * @event onDataMerge Перед добавлением загруженных записей в основной dataSet
          * @remark
          * Событие срабатывает при подгрузке по скроллу, при подгрузке в ветку дерева.
          * Т.е. при любой вспеомогательной загрузке данных.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} dataSet - dataSet с загруженными данными
          * @example
          * <pre>
          *     DataGridView.subscribe('onDataMerge', function(event, dataSet) {
          *        //Если в загруженном датасете есть данные, отрисуем их количество
          *        var count = dataSet.getCount();
          *        if (count){
          *           self.drawItemsCounter(count);
          *        }
          *     });
          * </pre>
          */

         $protected: {
            _floatCheckBox: null,
            _dotItemTpl: null,
            _itemsContainer: null,
            _actsContainer: null,
            _hoveredItem: {
               target: null,
               key: null,
               position: null,
               size: null
            },
            _loadingIndicator: undefined,
            _hasScrollMore: true,
            _infiniteScrollOffset: null,
            _allowInfiniteScroll: true,
            _scrollIndicatorHeight: 32,
            _isLoadBeforeScrollAppears : true,
            _infiniteScrollContainer: [],
            _pageChangeDeferred : undefined,
            _pager : undefined,
            _previousGroupBy : undefined,

            _keysWeHandle: [
               $ws._const.key.up,
               $ws._const.key.down,
               $ws._const.key.space,
               $ws._const.key.enter,
               $ws._const.key.right,
               $ws._const.key.left
            ],
            _itemActionsGroup: null,
            _emptyData: undefined,
            _options: {
               /**
                * @faq Почему нет флажков при включенной опции {@link SBIS3.CONTROLS.ListView#multiselect multiselect}?
                * Для отрисовки флажков необходимо в шаблоне отображания элемента прописать их место:
                * <pre>
                *     <div class="listViewItem" style="height: 30px;">\
                *        <span class="controls-ListView__itemCheckBox"></span>\
                *        {{=it.item.get("title")}}\
                *     </div>
                * </pre>
                * @bind SBIS3.CONTROLS.ListView#itemTemplate
                * @bind SBIS3.CONTROLS.ListView#multiselect
                */
               /**
                * @cfg {String} Шаблон отображения каждого элемента коллекции
                * @remark
                * !Важно: опция обязательна к заполнению!
                * @example
                * <pre>
                *     <div class="listViewItem" style="height: 30px;">\
                *        {{=it.item.get("title")}}\
                *     </div>
                * </pre>
                * @see multiselect
                */
               itemTemplate: '',
               /**
                * @typedef {Array} ItemsActions
                * @property {String} name Имя кнопки.
                * @property {String} icon Путь до иконки.
                * @property {String} caption Текст на кнопке.
                * @property {String} tooltip Всплывающая подсказка.
                * @property {Boolean} isMainAction Отображать ли кнопку на строке или только выпадающем в меню.
                * На строке кнопки отображаются в том же порядке, в каком они перечислены.
                * На строке может быть только три кнопки, полный список будет в меню.
                * @property {Function} onActivated Действие кнопки.
                * @editor icon ImageEditor
                * @translatable caption
                */
               /**
                * @cfg {ItemsActions[]} Набор действий над элементами, отображающийся в виде иконок
                * @remark
                * Можно использовать для массовых операций.
                * @example
                * <pre>
                *     <options name="itemsActions" type="array">
                *        <options>
                *           <option name="name">btn1</option>
                *           <option name="icon">sprite:icon-16 icon-Delete icon-primary</option>
                *           <option name="isMainAction">false</option>
                *           <option name="tooltip">Удалить</option>
                *           <option name="onActivated" type="function">js!SBIS3.CONTROLS.Demo.MyListView:prototype.myOnActivatedHandler</option>
                *        </options>
                *        <options>
                *            <option name="name">btn2</option>
                *            <option name="icon">sprite:icon-16 icon-Trade icon-primary</option>
                *            <option name="tooltip">Изменить</option>
                *            <option name="isMainAction">true</option>
                *            <option name="onActivated" type="function">js!SBIS3.CONTROLS.Demo.MyListView:prototype.myOnActivatedHandler</option>
                *         </options>
                *     </options>
                * </pre>
                * @see setItemsActions
                */
               itemsActions: [{
                  name: 'delete',
                  icon: 'sprite:icon-16 icon-Erase icon-error',
                  tooltip: 'Удалить',
                  title: 'Удалить',
                  isMainAction: true,
                  onActivated: function (item) {
                     this.deleteRecords(item.data('id'));
                  }
               },{
                  name: 'move',
                  icon: 'sprite:icon-16 icon-Move icon-primary action-hover',
                  tooltip: 'Перенести',
                  title: 'Перенести',
                  isMainAction: false,
                  onActivated: function (item) {
                     this.selectedMoveTo(item.data('id'));
                  }
               }],
               /**
                * @cfg {Boolean} Разрешено или нет перемещение элементов "Drag-and-Drop"
                * @example
                * <pre>
                *     <option name="itemsDragNDrop">true</option>
                * </pre>
                */
               itemsDragNDrop: false,
               /**
                * @cfg {Function} Обработчик клика на элемент
                * @example
                * <option name="elemClickHandler">MyElemClickHandler</option>
                * @see setElemClickHandler
                */
               elemClickHandler: null,
               /**
                * @cfg {Boolean} Разрешить выбор нескольких строк
                * @remark
                * Позволяет выбрать несколько строк для одновременного взаимодействия с ними.
                * @example
                * <pre>
                *    <option name="multiselect">false</option>
                * </pre>
                * @see itemTemplate
                */
               multiselect: false,
               /**
                * @cfg {Boolean} Подгружать ли данные по скроллу
                * @example
                * <pre>
                *    <option name="infiniteScroll">true</option>
                * </pre>
                * @see isInfiniteScroll
                * @see setInfiniteScroll
                */
               infiniteScroll: false,
               /**
                * @cfg {Boolean} Игнорировать значение в localStorage (т.е. смотреть на опцию pageSize)
                * @remark Важно! На страницах нашего приложения есть функционал сохранения выбранного количества записей на всех реестрах.
                * Это значит, что если на одном реестре пользователь выбрал “отображать по 50 записей”, то по умолчанию в других реестрах тоже
                * будет отображаться 50 записей. Чтобы отключить функционал “следования выбору пользователя” на
                * конкретном табличном представлении есть опция ignoreLocalPageSize
                * (аналог css-класса ws-browser-ignore-local-page-size в старых табличных представления),
                * которую нужно поставить в true (по умолчанию она = false)
                * @example
                * <pre>
                *    <option name="ignoreLocalPageSize">true</option>
                * </pre>
                * @see pageSize
                */
               ignoreLocalPageSize: false,
               /**
                * @cfg {Boolean} Режим постраничной навигации
                * @remark
                * При частичной постраничной навигации заранее неизвестно общее количество страниц, режим пейджинга будет определн по параметру n из dataSource
                * Если пришел boolean, значит частичная постраничная навигация
                * @example
                * <pre>
                *     <option name="showPaging">true</option>
                * </pre>
                * @see setPage
                * @see getPage
                */
               showPaging: false
            }
         },

         $constructor: function () {
            //TODO временно смотрим на TopParent, чтобы понять, где скролл. С внедрением ScrallWatcher этот функционал уберем
            var topParent = this.getTopParent(),
                  self = this;
            this._publish('onChangeHoveredItem', 'onItemActions', 'onItemClick', 'onDataMerge');
            this._container
               .mousemove(this._mouseMoveHandler.bind(this))
               .mouseleave(this._mouseLeaveHandler.bind(this));
            this._onWindowScrollHandler = this._onWindowScroll.bind(this);
            if (this.isInfiniteScroll()) {
               this._createLoadingIndicator();
               //В зависимости от настроек высоты подписываемся либо на скролл у окна, либо у контейнера
               if (!this._isHeightGrowable()) {
                  this.getContainer().bind('scroll.wsInfiniteScroll', this._onContainerScroll.bind(this));
               } else {
                  $(window).bind('scroll.wsInfiniteScroll', this._onWindowScrollHandler);
               }
               if ($ws.helpers.instanceOfModule(topParent, 'SBIS3.CORE.FloatArea')) {
                  //Если браузер лежит на всплывающей панели и имеет автовысоту, то скролл появляется у контейнера всплывашки (.parent())
                  topParent.subscribe('onScroll', this._onFAScroll.bind(this));
               }
            }
            $ws.single.CommandDispatcher.declareCommand(this, 'ActivateItem', this._activateItem);
            $ws.single.CommandDispatcher.declareCommand(this, 'AddItem', this._addItem);
            $ws.single.CommandDispatcher.declareCommand(this, 'editItem', this._editItem);
         },

         init: function () {
            var localPageSize = $ws.helpers.getLocalStorageValue('ws-page-size');
            this._options.pageSize = !this._options.ignoreLocalPageSize && localPageSize ? localPageSize : this._options.pageSize;
            if (typeof this._options.pageSize === 'string') {
               this._options.pageSize = this._options.pageSize * 1;
            }
            this.setGroupBy(this._options.groupBy, false);
            this._drawEmptyData();
            ListView.superclass.init.call(this);
            this.reload();
            this._touchSupport = $ws._const.compatibility.touch;
            if (this._touchSupport){
            	this._getItemActionsContainer().addClass('controls-ItemsActions__touch-actions');
            	this._container.bind('swipe', this._swipeHandler.bind(this));
               this._container.bind('tap', this._tapHandler.bind(this));
               this._container.bind('touchmove',this._mouseMoveHandler.bind(this));
            }
         },
         _keyboardHover: function (e) {
            var items = $('.controls-ListView__item', this._getItemsContainer()).not('.ws-hidden'),
               selectedKey = this.getSelectedKey(),
               selectedItem = $('[data-id="' + selectedKey + '"]', this._getItemsContainer()),
               nextItem = (selectedKey) ? items.eq(items.index(selectedItem) + 1) : items.eq(0),
               previousItem = (selectedKey) ? items.eq(items.index(selectedItem) - 1) : items.last();


            switch (e.which) {
               case $ws._const.key.up:
                  previousItem.length ? this.setSelectedKey(previousItem.data('id')) : this.setSelectedKey(selectedKey);
                  break;
               case $ws._const.key.down:
                  nextItem.length ? this.setSelectedKey(nextItem.data('id')) : this.setSelectedKey(selectedKey);
                  break;
               case $ws._const.key.enter:
                  this._elemClickHandler(selectedKey, this._dataSet.getRecordByKey(selectedKey), selectedItem);
                  break;
               case $ws._const.key.space:
                  this.toggleItemsSelection([selectedKey]);
                  nextItem.length ? this.setSelectedKey(nextItem.data('id')) : this.setSelectedKey(selectedKey);
                  break;
            }
            return false;
         },
         _checkTargetContainer: function (target) {
            return this._options.showPaging && this._pager && $.contains(this._pager.getContainer()[0], target[0]);
         },
         _isViewElement: function (elem) {
            return $.contains(this._getItemsContainer()[0], elem[0]);
         },
         _onClickHandler: function(e) {
            ListView.superclass._onClickHandler.apply(this, arguments);
            var $target = $(e.target),
               target = this._findItemByElement($target),
               id;

            if (target.length && this._isViewElement(target)) {
               id = target.data('id');
               this._elemClickHandler(id, this._dataSet.getRecordByKey(id), e.target);
            }
            if (this._options.multiselect && $target.length && $target.hasClass('controls-DataGridView__th__checkBox')){
               $target.hasClass('controls-DataGridView__th__checkBox__checked') ? this.setSelectedKeys([]) :this.setSelectedItemsAll();
               $target.toggleClass('controls-DataGridView__th__checkBox__checked');
            }
         },
         /**
          * Обрабатывает перемещения мышки на элемент представления
          * @param e
          * @private
          */
         _mouseMoveHandler: function (e) {
            var $target = $(e.target),
               containerCords,
               targetCords,
               target,
               targetKey;


            //TODO Переписать без костыльных проверок
            if (this._checkTargetContainer($target)) {
               this._mouseLeaveHandler();
               return;
            }
            target = this._findItemByElement($target);
            if (target.length && this._isViewElement(target)) {
               targetKey = target.data('id');
               if (targetKey !== undefined && this._hoveredItem.key !== targetKey) {
                  containerCords = this._container[0].getBoundingClientRect();
                  targetCords = target[0].getBoundingClientRect();
                  this._hoveredItem.container && this._hoveredItem.container.removeClass('controls-ListView__hoveredItem');
                  target.addClass('controls-ListView__hoveredItem');
                  this._hoveredItem = this._getElementData(target);
                  this._notify('onChangeHoveredItem', this._hoveredItem);
                  this._onChangeHoveredItem(this._hoveredItem);
               }
            } else if (!this._isHoverControl($target)) {
               this._mouseLeaveHandler();
            }
         },

         _getElementData: function(target) {
            if (target.length){
   				target = this._findItemByElement(target);
           		var containerCords = this._container[0].getBoundingClientRect(),
                  targetCords = target[0].getBoundingClientRect();

               return {
                   key: target.data('id'),
                   container: target,
                   position: {
                       top: targetCords.top - containerCords.top,
                       left: targetCords.left - containerCords.left
                   },
                   size: {
                       height: target[0].offsetHeight,
                       width: target[0].offsetWidth
                   }
               }
            }
         },

         /**
          * Проверяет, относится ли переданный элемент,
          * к контролам которые отображаются по ховеру.
          * @param {jQuery} $target
          * @returns {boolean}
          * @private
          */
         _isHoverControl: function ($target) {
            var itemActionsContainer = this._itemActionsGroup && this._itemActionsGroup.getContainer();
            return itemActionsContainer &&
               ( itemActionsContainer[0] === $target[0] ||
                  $.contains(itemActionsContainer[0], $target[0]) ||
                  this._itemActionsGroup.isItemActionsMenuVisible() );
         },
         /**
          * Обрабатывает уведение мышки с элемента представления
          * @private
          */
         _mouseLeaveHandler: function () {
            if (this._hoveredItem.container === null) {
               return;
            }
            this._hoveredItem.container && this._hoveredItem.container.removeClass('controls-ListView__hoveredItem');
            this._hoveredItem = {
               container: null,
               key: null,
               position: null,
               size: null
            };
            this._notify('onChangeHoveredItem', this._hoveredItem);
            this._onChangeHoveredItem(this._hoveredItem);
         },
         /**
          * Обработчик на смену выделенного элемента представления
          * @private
          */
         _onChangeHoveredItem: function (target) {
            if (this._options.itemsActions.length) {
         		if (target.container && !this._touchSupport){
                  this._showItemActions(target);
               } else {
                  this._hideItemActions();
               }
            }
         },

         /**
          * Установить что отображается при отсутствии записей.
          * @param html Содержимое блока.
          * @example
          * <pre>
          *     DataGridView.setEmptyHTML('Нет записей');
          * </pre>
          * @see emptyHTML
          */
         setEmptyHTML: function (html) {
            ListView.superclass.setEmptyHTML.apply(this, arguments);
            if(this._emptyData.length) {
               html ? this._emptyData.empty().html(html) : this._emptyData.remove();
            } else if(html) {
               this._drawEmptyData();
            }
         },
         _drawEmptyData: function() {
            var html = this._options.emptyHTML;
            this._emptyData = html && $(emptyDataTpl({emptyHTML: html})).appendTo(this._container);
         },
         _getItemTemplate: function () {
            return this._options.itemTemplate;
         },

         _getItemsContainer: function () {
            return $(".controls-ListView__itemsContainer", this._container.get(0))
         },

         /* +++++++++++++++++++++++++++ */

         _elemClickHandler: function (id, data, target) {
            var $target = $(target),
               elClickHandler = this._options.elemClickHandler;

            this.setSelectedKey(id);
            if (this._options.multiselect) {
               //TODO: оставить только js класс
               if ($target.hasClass('js-controls-ListView__itemCheckBox') || $target.hasClass('controls-ListView__itemCheckBox')) {
                  this.toggleItemsSelection([$target.closest('.controls-ListView__item').attr('data-id')]);
               }
               else {
                  this._notify('onItemClick', id, data, target);
                  this._elemClickHandlerInternal(data, id, target);
                  elClickHandler && elClickHandler.call(this, id, data, target);
               }
            }
            else {
               this.setSelectedKeys([id]);
               this._notify('onItemClick', id, data, target);
               this._elemClickHandlerInternal(data, id, target);
               elClickHandler && elClickHandler.call(this, id, data, target);
            }
         },

         _elemClickHandlerInternal: function (data, id, target) {
            this._activateItem(id);
         },

         _drawSelectedItems: function (idArray) {
            $(".controls-ListView__item", this._container).removeClass('controls-ListView__item__multiSelected');
            for (var i = 0; i < idArray.length; i++) {
               $(".controls-ListView__item[data-id='" + idArray[i] + "']", this._container).addClass('controls-ListView__item__multiSelected');
            }
         },

         _drawSelectedItem: function (id) {
            $(".controls-ListView__item", this._container).removeClass('controls-ListView__item__selected');
            $(".controls-ListView__item[data-id='" + id + "']", this._container).addClass('controls-ListView__item__selected');
         },
         /**
          * Перезагружает набор записей представления данных с последующим обновлением отображения.
          * @example
          * <pre>
          *    var btn = new Button({
           *         element: "buttonReload",
           *         caption: 'reload offset: 450'
           *    }).subscribe('onActivated', function(event, id){
           *           //При нажатии на кнопку перезагрузим DataGridView  с 450ой записи
           *           DataGridViewBL.reload(DataGridViewBL._filter, DataGridViewBL._sorting, 450, DataGridViewBL._limit);
           *    });
          * </pre>
          */
         reload: function () {
            this._reloadInfiniteScrollParams();
            this._previousGroupBy = undefined;
            this._hideItemActions();
            return ListView.superclass.reload.apply(this, arguments);
         },
         _reloadInfiniteScrollParams : function(){
            if (this.isInfiniteScroll() || this._isAllowInfiniteScroll()) {
               //this._loadingIndicator = undefined;
               this._hasScrollMore = true;
               this._infiniteScrollOffset = this._offset;
               //После релоада придется заново догружать данные до появлени скролла
               this._isLoadBeforeScrollAppears = true;
            }
         },
         /**
          * Метод установки/замены обработчика клика по строке.
          * @param method Имя новой функции обработчика клика по строке.
          * @example
          * <pre>
          *     var myElemClickHandler = function(id, data, target){
           *        console.log(id, data, target)
           *     }
          *     DataGridView.setElemClickHandler(myElemClickHandler);
          * </pre>
          * @see elemClickHandler
          */
         setElemClickHandler: function (method) {
            this._options.elemClickHandler = method;
         },

         //********************************//
         //   БЛОК ОПЕРАЦИЙ НАД ЗАПИСЬЮ    //
         //*******************************//

         _swipeHandler: function(e){
            if (e.direction == 'left'){
               var target = this._findItemByElement($(e.target)),
                  item = this._getElementData(target);
               this._onChangeHoveredItem(item);
               if (this._options.itemsActions.length) {
         			item.container ? this._showItemActions(item) : this._hideItemActions();
               }
               this._hoveredItem = item;
            }
         },

         _tapHandler: function(e){
            var target = this._findItemByElement($(e.target));
            this.setSelectedKey(target.data('id'));
         },

         _findItemByElement: function(target){
            if(!target.length) {
               return [];
            }

            var elem = target.closest('.controls-ListView__item', this._getItemsContainer());

            // TODO Подумать, как решить данную проблему. Не надёжно хранить информацию в доме
            // TODO  В качестве возможного решения: сохранять ссылку на дом элемент
            /* Поиск элемента коллекции с учётом вложенных контролов,
               обязательно проверяем, что мы нашли, возможно это элемент вложенного контрола,
               тогда поднимемся на уровень выше и опять поищем */
            return elem[0] && this.getDataSet().getRecordByKey(elem[0].getAttribute('data-id')) ? elem : this._findItemByElement(elem.parent());
         },
         /**
          * Показывает оперцаии над записью для элемента
          * @private
          */
         _showItemActions: function (item) {
            //Создадим операции над записью, если их нет
            this.getItemsActions();

            //Если показывается меню, то не надо позиционировать операции над записью
            if (this._itemActionsGroup.isItemActionsMenuVisible()) {
               return;
            }
            this._itemActionsGroup.applyItemActions();
            this._itemActionsGroup.showItemActions(item, this._getItemActionsPosition(item));
         },
         _hideItemActions: function () {
            if (this._itemActionsGroup && !this._itemActionsGroup.isItemActionsMenuVisible()) {
               this._itemActionsGroup.hideItemActions();
            }
         },
         _getItemActionsPosition: function (item) {
         	var cfg = {
         		top : item.position.top + ((item.size.height > ITEMS_ACTIONS_HEIGHT) ? item.size.height - ITEMS_ACTIONS_HEIGHT : 0 ),
               right : this._container[0].offsetWidth - (item.position.left + item.size.width)
         	};
         	if (this._touchSupport){
               cfg.top = item.position.top;
            }
            return cfg;
         },
         /**
          * Создаёт операции над записью
          * @private
          */
         _drawItemActions: function () {
            var actionsContainer = this._container.find('> .controls-ListView__itemActions-container');
            return new ItemActionsGroup({
               items: this._options.itemsActions,
               element: this._getItemActionsContainer(),
               keyField: 'name',
               parent: this
            });
         },
         /**
          * Возвращает контейнер для операций над записью
          * @returns {*}
          * @private
          */
         _getItemActionsContainer: function() {
            var actionsContainer = this._container.find('> .controls-ListView__itemActions-container');

            return actionsContainer.length ? actionsContainer : $('<div class="controls-ListView__itemActions-container"/>').appendTo(this._container);
         },
         /**
          * Инициализирует операции над записью
          * @private
          */
         _initItemsActions: function () {
            this._itemActionsGroup = this._drawItemActions();
         },
         /**
          * Метод получения операций над записью.
          * @returns {Array} Массив операций над записью.
          * @example
          * <pre>
          *     DataGridView.subscribe('onChangeHoveredItem', function(hoveredItem) {
          *        var actions = DataGridView.getItemsActions(),
          *        instances = actions.getItemsInstances();
          *
          *        for (var i in instances) {
          *           if (instances.hasOwnProperty(i)) {
          *              //Будем скрывать кнопку удаления для всех строк
          *              instances[i][i === 'delete' ? 'show' : 'hide']();
          *           }
          *        }
          *     });
          * </pre>
          * @see itemsActions
          * @see setItemActions
          */
         getItemsActions: function () {
            if (!this._itemActionsGroup && this._options.itemsActions.length) {
               this._initItemsActions();
            }
            return this._itemActionsGroup;
         },
         /**
          * Метод установки или замены кнопок операций над записью, заданных в опции {@link itemsActions}
          * @remark
          * В метод нужно передать массив обьектов.
          * @param {Array} items Объект формата {name: ..., icon: ..., caption: ..., onActivated: ..., isMainOption: ...}
          * @param {String} items.name Имя кнопки операции над записью.
          * @param {String} items.icon Иконка кнопки.
          * @param {String} items.caption Текст на кнопке.
          * @param {String} items.onActivated Обработчик клика по кнопке.
          * @param {String} items.tooltip Всплывающая подсказка.
          * @param {String} items.title Текст кнопки в выпадающем меню.
          * @param {String} items.isMainOption На строке ли кнопка (или в меню).
          * @example
          * <pre>
          *     DataGridView.setItemsActions([{
          *        name: 'delete',
          *        icon: 'sprite:icon-16 icon-Erase icon-error',
          *        title: 'Удалить',
          *        isMainAction: true,
          *        onActivated: function(item) {
          *           this.deleteRecords(item.data('id'));
          *        }
          *     },
          *     {
          *        name: 'addRecord',
          *        icon: 'sprite:icon-16 icon-Add icon-error',
          *        title: 'Добавить',
          *        isMainAction: true,
          *        onActivated: function(item) {
          *           this.showRecordDialog();
          *        }
          *     }]
          * <pre>
          * @see itemsActions
          * @see getItemsActions
          * @see getHoveredItem
          */
         setItemsActions: function (items) {
            this._options.itemsActions = items;
            this._itemActionsGroup ? this._itemActionsGroup.setItems(items) : this._initItemsActions();
         },
         //**********************************//
         //КОНЕЦ БЛОКА ОПЕРАЦИЙ НАД ЗАПИСЬЮ //
         //*********************************//

         _drawItemsCallback: function () {
            var hoveredItem = this._hoveredItem.container;

            if (this.isInfiniteScroll()) {
               this._loadBeforeScrollAppears();
            }
            this._drawSelectedItems(this._options.selectedKeys);
            this._drawSelectedItem(this._options.selectedKey);

            /* Если после перерисовки выделенный элемент удалился из DOM дерава,
               то событие mouseLeave не сработает, поэтому вызовем руками метод */
            if(hoveredItem && !$.contains(this._getItemsContainer()[0], hoveredItem[0])) {
               this._mouseLeaveHandler();
            }

            this._notifyOnSizeChanged(true);
         },
         //-----------------------------------infiniteScroll------------------------
         //TODO Сделать подгрузку вверх
         //TODO (?) избавиться от _allowInfiniteScroll - пусть все будет завязано на опцию infiniteScroll
         /**
          * Используется ли подгрузка по скроллу.
          * @returns {Boolean} Возможные значения:
          * <ol>
          *    <li>true - используется подгрузка по скроллу;</li>
          *    <li>false - не используется.</li>
          * </ol>
          * @example
          * Переключим режим управления скроллом:
          * <pre>
          *     listView.setInfiniteScroll(!listView.isInfiniteScroll());
          * </pre>
          * @see infiniteScroll
          * @see setInfiniteScroll
          */
         isInfiniteScroll: function () {
            return this._options.infiniteScroll && this._allowInfiniteScroll;
         },
         /**
          *  Общая проверка и загрузка данных для всех событий по скроллу
          */
         _loadChecked: function (result) {
            if (result) {
               this._nextLoad();
            }
         },
         _onWindowScroll: function (event) {
            this._loadChecked(this._isBottomOfPage());
         },
         _onFAScroll: function(event, scrollOptions) {
            this._loadChecked(scrollOptions.clientHeight + scrollOptions.scrollTop >= scrollOptions.scrollHeight - $ws._const.Browser.minHeight);
         },
         _onContainerScroll: function () {
            this._loadChecked(this._loadingIndicator.offset().top - this.getContainer().offset().top < this.getContainer().height());
         },
         /**
          * Проверка на автовысоту у ListView. Аналог из TableView
          * @returns {*}
          * @private
          */
         _isHeightGrowable: function() {
            //В новых компонентах никто пока не смотрит на verticalAlignment
            return this._options.autoHeight;/*&& this._verticalAlignment !== 'Stretch';*/
         },
         _nextLoad: function () {
            var self = this,
               loadAllowed  = this._isAllowInfiniteScroll(),
               records;
            //Если в догруженных данных в датасете пришел n = false, то больше не грузим.
            if (loadAllowed && this._hasNextPage(this._dataSet.getMetaData().more, this._infiniteScrollOffset) && this._hasScrollMore && !this._isLoading()) {
               this._showLoadingIndicator();
               this._loader = this._dataSource.query(this._filter, this._sorting, this._infiniteScrollOffset + this._limit, this._limit).addCallback(function (dataSet) {
                  //ВНИМАНИЕ! Здесь стрелять onDataLoad нельзя! Либо нужно определить событие, которое будет
                  //стрелять только в reload, ибо между полной перезагрузкой и догрузкой данных есть разница!
                  self._loader = null;
                  /*Леша Мальцев добавил скрытие индикатора, но на контейнерах с фиксированной высотой это чревато неправильным определением  offset от индикатора
                  * Т.е. можем не определить, что доскроллили до низа страницы. индикатор должен юыть виден, пока не загрузим все данные
                  */
                  if (self._isHeightGrowable()) {
                     self._hideLoadingIndicator();
                  }
                  //нам до отрисовки для пейджинга уже нужно знать, остались еще записи или нет
                  if (self._hasNextPage(dataSet.getMetaData().more, self._infiniteScrollOffset)) {
                     self._infiniteScrollOffset += self._limit;
                  } else {
                     self._hasScrollMore = false;
                     self._hideLoadingIndicator();
                  }
                  self._notify('onDataMerge', dataSet);
                  //Если данные пришли, нарисуем
                  if (dataSet.getCount()) {
                     records = dataSet._getRecords();
                     self._dataSet.merge(dataSet, {remove: false});
                     self._drawItems(records);
                     self._dataLoadedCallback();
                  }

               }).addErrback(function (error) {
                  //Здесь при .cancel приходит ошибка вида DeferredCanceledError
                  return error;
               });
            }
         },
         _isAllowInfiniteScroll : function(){
            return this._allowInfiniteScroll;
         },
         _isBottomOfPage: function () {
            var docBody = document.body,
               docElem = document.documentElement,
               clientHeight = Math.min(docBody.clientHeight, docElem.clientHeight),
               scrollTop = Math.max(docBody.scrollTop, docElem.scrollTop),
               scrollHeight = Math.max(docBody.scrollHeight, docElem.scrollHeight);
            return (clientHeight + scrollTop >= scrollHeight - this._scrollIndicatorHeight);//Учитываем отступ снизу на высоту картинки индикатора загрузки
         },
         _loadBeforeScrollAppears: function(){
            /*
            *   TODO убрать зависимость от опции autoHeight, перенести в scrollWatcher возможность отслежитвания скролла по переданному классу
            *   и все, что связано c GrowableHeight
            *   Так же убрать overflow:auto - прикладные разработчики сами будут его навешивать на нужный им див
            */
            /**
             * Если у нас автовысота, то подгружать данные надо пока размер контейнера не привысит размеры экрана (контейнера window)
             * Если же высота фиксированная, то подгружать данные в этой функции будем пока высота контейнера(ту, что фиксированно задали) не станет меньше высоты таблицы(table),
             * т.е. пока не появится скролл внутри контейнера
             */
            var  windowHeight = $(window).height(),
                isOnFloatArea = $ws.helpers.instanceOfModule(this.getTopParent(), 'SBIS3.CORE.FloatArea'),
                checkHeights = this._isHeightGrowable() ?
                  (!($('body').get(0).scrollHeight > windowHeight + this._scrollIndicatorHeight) && !isOnFloatArea) || (this._container.height() < windowHeight) :
                  this._container.height() >= this._container.find('.js-controls-View__scrollable').height();
            //Если на странице появился скролл и мы достигли дна скролла
            if (this._isLoadBeforeScrollAppears && checkHeights){
               this._nextLoad();
            } else {
               this._isLoadBeforeScrollAppears = false;
            }
         },
         _showLoadingIndicator: function () {
            if (!this._loadingIndicator) {
               this._createLoadingIndicator();
            }
            this._loadingIndicator.removeClass('ws-hidden');
         },
         /**
          * Удаляет индикатор загрузки
          * @private
          */
         _hideLoadingIndicator: function () {
            if (this._loadingIndicator && !this._loader) {
               this._loadingIndicator.addClass('ws-hidden');
            }
         },
         _createLoadingIndicator : function () {
            this._loadingIndicator = this._container.find('.controls-ListView-scrollIndicator');
            this._scrollIndicatorHeight = this._loadingIndicator.height();
         },
         /**
          * Метод изменения возможности подгрузки по скроллу.
          * @remark
          * Метод изменяет значение, заданное в опции {@link infiniteScroll}.
          * @param {Boolean} allow Разрешить (true) или запретить (false) подгрузку по скроллу.
          * @param {Boolean} [noLoad] Сразу ли загружать (true - не загружать сразу).
          * @example
          * Переключим режим управления скроллом:
          * <pre>
          *     listView.setInfiniteScroll(!listView.isInfiniteScroll())
          * </pre>
          * @see infiniteScroll
          * @see isInfiniteScroll
          */
         setInfiniteScroll: function (allow, noLoad) {
            this._allowInfiniteScroll = allow;
            if (allow && !noLoad) {
               this._nextLoad();
               return;
            }
            //НА саом деле если во время infiniteScroll произошла ошибка загрузки, я о ней не смогу узнать, но при выключении нужно убрать индикатор
            if (!allow && this._loadingIndicator && this._loadingIndicator.is(':visible')){
               this._cancelLoading();
            }
            //Убираем текст Еще 10, если включили бесконечную подгрузку
            this.getContainer().find('.controls-TreePager-container').toggleClass('ws-hidden', allow);
            this._hideLoadingIndicator();
         },
         /**
          * Геттер для получения текущего выделенного элемента
          * @returns {{key: null | number, container: (null | jQuery)}}
          * @example
          * <pre>
          *     editButton.bind('click', functions: (e) {
          *        var hoveredItem = this.getHoveredItem();
          *        if(hoveredItem.container) {
          *           myBigToolTip.showAt(hoveredItem.position);
          *        }
          *     })
          * </pre>
          * @see itemsActions
          * @see getItemActions
          */
         getHoveredItem: function () {
            return this._hoveredItem;
         },
         _dataLoadedCallback: function () {
            if (this._options.showPaging) {
               this._processPaging();
               this._updateOffset();
            }
            if (this.isInfiniteScroll()) {
               if (!this._hasNextPage(this._dataSet.getMetaData().more)) {
                  this._hideLoadingIndicator();
               }
            }

         },
         _toggleIndicator: function(show){
            this._showedLoading = show;
            var self = this;
            if (show) {
               setTimeout(function(){
                  if (self._showedLoading) {
                     self._container.find('.controls-AjaxLoader').toggleClass('ws-hidden', false);
                  }
               }, 750);
            }
            else {
               self._container.find('.controls-AjaxLoader').toggleClass('ws-hidden', true);
            }
         },
         _toggleEmptyData: function(show) {
            if(this._emptyData) {
               this._emptyData.toggleClass('ws-hidden', !show);
            }
         },
         //------------------------Paging---------------------
         _processPaging: function() {
            this._processPagingStandart();
         },
         _processPagingStandart: function () {
            if (!this._pager) {
               var more = this._dataSet.getMetaData().more,
                  hasNextPage = this._hasNextPage(more),
                  pagingOptions = {
                     recordsPerPage: this._options.pageSize || more,
                     currentPage: 1,
                     recordsCount: more,
                     pagesLeftRight: 3,
                     onlyLeftSide: typeof more === 'boolean', // (this._options.display.usePaging === 'parts')
                     rightArrow: hasNextPage
                  },
                  pagerContainer = this.getContainer().find('.controls-Pager-container').append('<div/>'),
                  self = this;

               this._pager = new Pager({
                  pageSize: this._options.pageSize,
                  opener: this,
                  ignoreLocalPageSize: this._options.ignoreLocalPageSize,
                  element: pagerContainer.find('div'),
                  allowChangeEnable: false, //Запрещаем менять состояние, т.к. он нужен активный всегда
                  pagingOptions: pagingOptions,
                  handlers: {
                     'onPageChange': function (event, pageNum, deferred) {
                        self._setPageSave(pageNum);
                        self.setPage(pageNum - 1);
                        self._pageChangeDeferred = deferred;
                     }
                  }
               });
            }
            this._updatePaging();
         },
         /**
          * Метод обработки интеграции с пейджингом
          */
         _updatePaging: function () {
            var more = this._dataSet.getMetaData().more,
               nextPage = this.isInfiniteScroll() ? this._hasScrollMore : this._hasNextPage(more),
               numSelected = 0;
            if (this._pager) {
               //Если данных в папке нет, не рисуем Pager
               this._pager.getContainer().toggleClass('ws-hidden', !this._dataSet.getCount());
               var pageNum = this._pager.getPaging().getPage();
               if (this._pageChangeDeferred) { // только когда меняли страницу
                  this._pageChangeDeferred.callback([this.getPage() + 1, nextPage, nextPage]);//смотреть в DataSet мб ?
                  this._pageChangeDeferred = undefined;
               }
               //Если на странице больше нет записей - то устанавливаем предыдущую (если это возможно)
               if (this._dataSet.getCount() === 0 && pageNum > 1) {
                  this._pager.getPaging().setPage(1); //чтобы не перезагружать поставим 1ую. было : pageNum - 1
               }
               this._pager.getPaging().update(this.getPage(this.isInfiniteScroll() ? this._infiniteScrollOffset + this._options.pageSize : this._offset) + 1, more, nextPage);
               if (this._options.multiselect) {
                  numSelected = this.getSelectedKeys().length;
               }
               this._pager.updateAmount(this._dataSet.getCount(), nextPage, numSelected);
            }
         },
         /**
          * Установить страницу по её номеру.
          * @remark
          * Метод установки номера страницы, с которой нужно открыть представление данных.
          * Работает при использовании постраничной навигации.
          * @param pageNumber Номер страницы.
          * @example
          * <pre>
          *    if(DataGridView.getPage() > 0)
          *       DataGridView.setPage(0);
          * </pre>
          * @see getPage
          * @see paging
          */
         setPage: function (pageNumber, noLoad) {
            pageNumber = parseInt(pageNumber, 10);
            var offset = this._offset;
            if (this._options.showPaging) {
               this._offset = this._options.pageSize * pageNumber;
               if (!noLoad && this._offset !== offset) {
                  this.reload();
               }
            }
         },

         /**
          * Получить номер текущей страницы.
          * @remark
          * Метод получения номера текущей страницы представления данных.
          * Работает при использовании постраничной навигации.
          * @example
          * <pre>
          *    if(DataGridView.getPage() > 0)
          *       DataGridView.setPage(0);
          * </pre>
          * @see paging
          * @see setPage
          * @param {Number} [offset] - если передать, то номер страницы рассчитается от него
          */
         getPage: function (offset) {
            var offset = offset || this._offset;
            return Math.ceil(offset / this._options.pageSize);
         },
         _updateOffset: function () {
            var more = this._dataSet.getMetaData().more,
               nextPage = this._hasNextPage(more);
            if (this.getPage() === -1) {
               this._offset = more - this._options.pageSize;
            }
         },
         //------------------------GroupBy---------------------
         _groupByDefaultMethod: function (record) {
            var curField = record.get(this._options.groupBy.field),
               result = curField !== this._previousGroupBy;
            this._previousGroupBy = curField;
            return result;
         },
         _getGroupTpl: function () {
            return this._options.groupBy.template || groupByTpl;
         },
         _groupByDefaultRender: function (item, container) {
            return container;
         },
         setDataSource: function () {
            if (this._pager) {
               this._pager.destroy();
               this._pager = undefined;
            }
            ListView.superclass.setDataSource.apply(this, arguments);
         },

         _activateItem : function(id) {
            var
               item = this._dataSet.getRecordByKey(id);
            this._notify('onItemActivate', id, item);
         },
         _addItem : function() {
           //TODO если есть редактирование по месту запусть его
            this._notify('onAddItem');
         },
         _editItem: function(key) {
            this.setSelectedKey(key);
         },
         destroy: function () {
            if (this.isInfiniteScroll()) {
               if (this._isHeightGrowable()) {
                  this.getContainer().unbind('.wsInfiniteScroll');
               } else {
                  $(window).unbind('scroll.wsInfiniteScroll', this._onWindowScrollHandler);
               }
            }
            if (this._pager) {
               this._pager.destroy();
            }
            ListView.superclass.destroy.call(this);
         }
      });

      return ListView;

   });
