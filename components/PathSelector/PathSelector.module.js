define('js!SBIS3.CONTROLS.PathSelector', [
   'js!SBIS3.CORE.CompoundControl',
   'js!SBIS3.CONTROLS.DSMixin',
   'js!SBIS3.CONTROLS.PickerMixin',
   'html!SBIS3.CONTROLS.PathSelector',
   'html!SBIS3.CONTROLS.PathSelector/resources/pointTpl'
], function(CompoundControl, DSMixin, PickerMixin, dotTpl, pointTpl) {
   'use strict';

   if (typeof window !== 'undefined') {
      var eventsChannel = $ws.single.EventBus.channel('PathSelectorChannel');

      $(window).bind('resize', function() {
         eventsChannel.notify('onWindowResize');
      });
   }

   var PathSelector = CompoundControl.extend([DSMixin, PickerMixin], {
      $protected: {
         _dotTplFn: dotTpl,
         _resizeTimeout: null,
         _rootHandler: undefined,
         _dropdownWidth: null,
         _options: {
            linkedView: null,
            keyField: 'id',
            displayField: 'title',
            pickerClassName: 'controls-Menu__Popup controls-PathSelector'
         }
      },

      $constructor: function() {
         this._publish('onPointClick');
         if (this._options.linkedView) {
            this._subscribeOnSetRoot();
         }

         $ws.single.EventBus.channel('WindowChangeChannel').subscribe('onWindowResize', this._resizeHandler, this);
         //инициализируем dataSet
         this.setItems(this._options.items || []);
      },

      _resizeHandler: function() {
         clearTimeout(this._resizeTimeout);
         var self = this;
         this._resizeTimeout = setTimeout(function() {
            self._redraw();
         }, 100);
      },

      _onClickHandler: function(e) {
         PathSelector.superclass._onClickHandler.apply(this, arguments);
         var target = $(e.target),
            point = target.closest('.js-controls-PathSelector__point');
         if (point.hasClass('controls-PathSelector__dots')) {
            if (this._picker) {
               this._picker.setTarget(point);
            }
            this.togglePicker();
            if (this._picker.isVisible()) {
               this._redrawDropdown();
            }
         } else if (point.length) {
            this._onPointClick(point.data(this._options.keyField));
         }
      },

      /**
       * Обработчик клика на пункт пути
       * id - id по которому нужно перейти
       * Удалет все пункты до того на который кликнули
       * Если кликнули на первый пункт то удаляем его и переходим на уровень выше
       */
      _onPointClick: function(id) {
         var result = this._notify('onPointClick'),
            length = this._dataSet.getCount(),
            last = this._dataSet.at(length - 1), newId = id;
         //Нажатие на последний пункт должно вести туда же куда не предпоследний
         if (length > 1 && id == last.get(this._options.keyField)) {
            newId = this._dataSet.at(length - 2).get(this._options.keyField);
         }
         for (var i = length - 1; i >= 0; i--) {
            var record = this._dataSet.at(i);
            if (record.getKey() !== last.getKey() && record.getKey() == id) break;
            this._dataSet.removeRecord(record.getKey());
            //TODO: убрать следующие 4 строчки когда будет нормальное удаление рекордов при sync'е StaticSource'а
            delete this._dataSet._byId[record.getKey()];
            delete this._dataSet._byId[record._cid];
            this._dataSet._rawData.splice(i, 1);
            this._dataSet._indexId.splice(i, 1);
            if (record.getKey() == id) break;
         }
         if (result !== false){
            this._options.linkedView.setCurrentRoot(newId);
         } else {
            this._options.linkedView.setCurrentRoot(id);
         }
      },

      _rootChangeHandler: function(dataSet, keys, curRoot) {
         if (curRoot === null){
            var homeIcon = {};
            homeIcon[this._options.keyField] = null;
            homeIcon[this._options.displayField] = '';
            homeIcon.icon = 'icon-16 icon-Home2 icon-primary action-hover';
            this._dataSet.push(homeIcon);
         } 
         keys = keys instanceof Array ? keys : [keys];
         for (var i = keys.length - 1; i >= 0; i--) {
            var record = dataSet.getRecordByKey(keys[i]);
            if (record){
               this._dataSet.push(record);
            }
            if (keys[i] === null) {
               this.setItems([]);
            }
         }
         this._redraw();
      },

      //TODO: придрот что бы фэйковый див не ломал :first-child стили
      _moveFocusToFakeDiv: function() {},

      _subscribeOnSetRoot: function() {
         var self = this;
         this._rootHandler = function(event, dataSet, id, curRoot) {
            self._rootChangeHandler(dataSet, id, curRoot);
         };
         this._options.linkedView.subscribe('onSetRoot', this._rootHandler, this);
      },

      _setPickerConfig: function() {
         return {
            target: $('.controls-PathSelector__dots', this._container),
            corner: 'bl',
            verticalAlign: {
               side: 'top'
            },
            horizontalAlign: {
               side: 'left'
            },
            closeByExternalClick: true,
            targetPart: true
         };
      },

      _setPickerContent: function() {
         var self = this;
         this._redrawDropdown();
         this._picker._container.bind('mouseup', function(e) {
            self._onClickHandler(e);
         });
      },

      setLinkedView: function(view) {
         if (this._options.linkedView) {
            this._options.linkedView.unsubscribe('onSetRoot', this._rootHandler);
         }
         this._options.linkedView = view;
         this._subscribeOnSetRoot();
      },

      _redrawDropdown: function() {
         var self = this;
         if (this._picker) {
            var width = this._picker._container.width();
            this._picker._container.empty();
            this._dataSet.each(function(record) {
               if (record.get(self._options.keyField)){
                  var point = $('<div class="controls-MenuItem js-controls-PathSelector__point"></div>').html(record.get(self._options.displayField))
                     .data(self._options.keyField, record.get(self._options.keyField));
                  self._picker._container.append(point);
                  var previousContainer = point.prev('.js-controls-PathSelector__point', self._picker._container),
                     previousWrappersCount = $('.controls-PathSelector__hierWrapper', previousContainer).length;
                  if (previousContainer.length) {
                     for (var i = 0; i <= previousWrappersCount; i++) {
                        point.prepend('<div class="controls-PathSelector__hierWrapper"></div>');
                     }
                  }
               }
            });
            if (width !== this._dropdownWidth) {
               this._picker.recalcPosition(true);
               this._dropdownWidth = width;
            }
         }
      },

      _redraw: function() {
         PathSelector.superclass._redraw.call(this);
         $('.controls-PathSelector__dots', this._container).remove();
         var points = $('.controls-PathSelector__point', this._container),
            i = points.length - 2,
            targetContainer = this._getTargetContainer();
         //30px - ширина блока с троеточием
         //Добавляем троеточие если пункты не убираются в контейнер
         if (targetContainer.width() + 30 >= this._container.width()) {
            var dots = $(pointTpl({
               title: '...',
               dots: true,
               get: function(field) {return this[field];}
            }));
            $(points[i]).before(dots);
         }
         if (this._picker) {
            this.hidePicker();
         }
         //скрываем пункты левее троеточия пока не уберемся в контейнер
         for (i; i > 1; i--) {
            if (targetContainer.width() < this._container.width() || i == 1) {
               break;
            }
            points[i - 1].className += ' ws-hidden';
         }
      },

      _getItemTemplate: function() {
         return pointTpl;
      },

      _getTargetContainer: function() {
         return $('.controls-PathSelector__itemsContainer', this._container);
      },

      _addItemAttributes: function(container, item) {
         container.data(this._options.keyField, item.get(this._options.keyField));
         PathSelector.superclass._addItemAttributes.apply(this, arguments);
      },

      _appendItemTemplate: function(item, targetContainer, itemBuildedTpl) {
         targetContainer.prepend(itemBuildedTpl);
      },

      destroy: function() {
         PathSelector.superclass.destroy.call(this);
         if (this._options.linkedView) {
            this._options.linkedView.unsubscribe('onSetRoot', this._rootHandler);
         }
         $ws.single.EventBus.channel('WindowChangeChannel').unsubscribe('onWindowResize', this._resizeHandler, this);
      }
   });

   return PathSelector;
});