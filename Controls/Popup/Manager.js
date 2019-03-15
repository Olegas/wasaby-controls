define('Controls/Popup/Manager',
   [
      'Core/Control',
      'wml!Controls/Popup/Manager/Manager',
      'Controls/Popup/Manager/ManagerController',
      'Core/helpers/Number/randomId',
      'Core/helpers/Function/runDelayed',
      'Types/collection',
      'Core/Deferred',
      'Env/Event',
      'Env/Env',
      'Vdom/Vdom'
   ],

   function(Control, template, ManagerController, randomId, runDelayed, collection, Deferred, EnvEvent, Env, Vdom) {
      'use strict';

      var _private = {
         activeElement: {},

         initializePopupItems: function() {
            _private.popupItems = new collection.List();
         },

         addElement: function(element) {
            _private.popupItems.add(element);
            if (element.isModal) {
               ManagerController.getContainer().setOverlay(_private.popupItems.getCount() - 1);
            }
         },

         remove: function(self, id) {
            var item = self.find(id);
            var removeDeferred = new Deferred();
            if (item) {
               _private.finishPendings(id, null, null, function() {
                  _private.removeElement.call(self, item, _private.getItemContainer(id), id).addCallback(function() {
                     removeDeferred.callback();
                  });
               });
            } else {
               removeDeferred.callback();
            }
            return removeDeferred;
         },

         removeElement: function(element, container, id) {
            var self = this;
            var removeDeferred = element.controller._elementDestroyed(element, container, id);
            _private.redrawItems();

            if (element.popupOptions.maximize) {
               self._hasMaximizePopup = false;
            }

            self._notify('managerPopupBeforeDestroyed', [element, _private.popupItems, container], { bubbling: true });
            return removeDeferred.addCallback(function afterRemovePopup() {
               _private.fireEventHandler(id, 'onClose');
               _private.popupItems.remove(element);

               // If the popup is not active, don't set the focus
               if (element.isActive) {
                  _private.activatePopup(element);
               }

               _private.updateOverlay();
               _private.redrawItems();
               self._notify('managerPopupDestroyed', [element, _private.popupItems], { bubbling: true });
            });
         },

         activatePopup: function(item) {
            if (item.controller.needRestoreFocus()) {
               // wait, until closing popup will be removed from DOM
               runDelayed(function activatePopup() {
                  // check is active control exist, it can be redrawn by vdom or removed from DOM while popup exist
                  // The node can be hidden through display: none
                  if (_private.needActivateControl(item.activeControlAfterDestroy)) {
                     if (item.activeControlAfterDestroy.activate) {
                        item.activeControlAfterDestroy.activate();
                     } else if (item.activeControlAfterDestroy.setActive) { // TODO: COMPATIBLE
                        item.activeControlAfterDestroy.setActive(true);
                     }
                  } else {
                     var maxId = _private.getMaxZIndexPopupIdForActivate();
                     if (maxId) {
                        var child = ManagerController.getContainer().getPopupById(maxId);

                        if (child) {
                           child.activate();
                        }
                     }
                  }
               });
            }
         },

         needActivateControl: function(control) {
            return control && !control._unmounted && control._container !== document.body;
         },

         getMaxZIndexPopupIdForActivate: function() {
            var items = _private.popupItems;
            for (var i = items.getCount() - 1; i > -1; i--) {
               if (items.at(i).popupOptions.autofocus !== false) {
                  return items.at(i).id;
               }
            }
            return null;
         },

         updateOverlay: function() {
            var indices = _private.popupItems.getIndicesByValue('isModal', true);
            ManagerController.getContainer().setOverlay(indices.length ? indices[indices.length - 1] : -1);
         },

         popupCreated: function(id) {
            var element = _private.find(id);
            if (element) {
               // Register new popup
               _private.fireEventHandler(id, 'onOpen');
               element.controller._elementCreated(element, _private.getItemContainer(id), id);
               this._notify('managerPopupCreated', [element, _private.popupItems], { bubbling: true });
               return true;
            }
            return false;
         },

         popupUpdated: function(id) {
            var element = _private.find(id);
            if (element) {
               var needUpdate = element.controller._elementUpdated(element, _private.getItemContainer(id)); // при создании попапа, зарегистрируем его
               this._notify('managerPopupUpdated', [element, _private.popupItems], { bubbling: true });
               return !!needUpdate;
            }
            return false;
         },

         popupMaximized: function(id, state) {
            var element = _private.find(id);
            if (element) {
               element.controller.elementMaximized(element, _private.getItemContainer(id), state);
               this._notify('managerPopupMaximized', [element, _private.popupItems], { bubbling: true });
               return true;
            }
            return false;
         },

         popupAfterUpdated: function(id) {
            var element = _private.find(id);
            if (element) {
               return element.controller._elementAfterUpdated(element, _private.getItemContainer(id)); // при создании попапа, зарегистрируем его
            }
            return false;
         },

         popupActivated: function(id) {
            var item = _private.find(id);
            if (item) {
               item.waitDeactivated = false;
               item.isActive = true;
            }
            _private.activeElement = {};
         },

         popupDeactivated: function(id) {
            var item = _private.find(id);
            if (item) {
               item.isActive = false;
               if (_private.needClosePopupByDeactivated(item)) {
                  if (!_private.isIgnoreActivationArea(_private.getActiveElement())) {
                     _private.finishPendings(id, function() {
                        if (!_private.activeElement[id]) {
                           _private.activeElement[id] = _private.getActiveElement();
                        }
                     }, function() {
                        // if pendings is exist, take focus back while pendings are finishing
                        _private.getPopupContainer().getPopupById(id).activate();
                     }, function() {
                        var itemContainer = _private.getItemContainer(id);
                        if (item.popupOptions.isCompoundTemplate) {
                           _private._getCompoundArea(itemContainer).close();
                        } else {
                           item.controller.popupDeactivated(item, itemContainer);
                        }
                     });
                  } else {
                     item.waitDeactivated = true;
                  }
               }
            }
            return false;
         },

         needClosePopupByDeactivated: function(item) {
            return item.popupOptions.closeOnOutsideClick && item.popupState !== item.controller.POPUP_STATE_INITIALIZING;
         },

         getActiveElement: function() {
            return document && document.activeElement;
         },

         getActiveControl: function() {
            return Vdom.DOMEnvironment._goUpByControlTree(_private.getActiveElement())[0];
         },

         popupDragStart: function(id, offset) {
            var element = _private.find(id);
            if (element) {
               element.controller.popupDragStart(element, _private.getItemContainer(id), offset);
               return true;
            }
            return false;
         },

         popupControlResize: function(id) {
            var element = _private.find(id);
            if (element) {
               return element.controller.popupResize(element, _private.getItemContainer(id));
            }
            return false;
         },

         popupDragEnd: function(id, offset) {
            var element = _private.find(id);
            if (element) {
               element.controller.popupDragEnd(element, offset);
               return true;
            }
            return false;
         },

         popupResult: function(id) {
            var args = Array.prototype.slice.call(arguments, 1);
            return _private.fireEventHandler.apply(this, [id, 'onResult'].concat(args));
         },

         popupClose: function(id) {
            _private.remove(this, id);
            return false;
         },

         popupDestroyed: function(id) {
            if (_private.activeElement[id]) {
               // its need to focus element on _afterUnmount, thereby _popupDeactivated not be when focus is occured.
               // but _afterUnmount is not exist, thereby its called setTimeout on _beforeUnmount of popup for wait needed state.
               setTimeout(function() {
                  // new popup can be activated and take focus during the timeout
                  // will be fixed by https://online.sbis.ru/opendoc.html?guid=95166dc7-7eae-4728-99e2-e65251dd3ee3
                  if (_private.activeElement[id]) {
                     _private.activeElement[id].focus();
                     delete _private.activeElement[id];
                  }
               }, 0);
            }
            return false;
         },

         popupAnimated: function(id) {
            var item = _private.findItemById(id);
            if (item) {
               return item.controller.elementAnimated(item, _private.getItemContainer(id));
            }
            return false;
         },

         fireEventHandler: function(id, event) {
            var item = _private.findItemById(id);
            var args = Array.prototype.slice.call(arguments, 2);
            if (item) {
               if (item.popupOptions._events) {
                  item.popupOptions._events[event](event, args);
               }
               if (item.popupOptions.eventHandlers && typeof item.popupOptions.eventHandlers[event] === 'function') {
                  item.popupOptions.eventHandlers[event].apply(item.popupOptions, args);
                  return true;
               }
            }
            return false;
         },

         getItemContainer: function(id) {
            var popupContainer = ManagerController.getContainer();
            var item = popupContainer && popupContainer._children[id];
            var container = item && item._container;

            // todo https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
            if (container && container.jquery) {
               container = container[0];
            }
            return container;
         },

         redrawItems: function() {
            ManagerController.getContainer().setPopupItems(_private.popupItems);
         },

         controllerVisibilityChangeHandler: function() {
            _private.popupItems.each(function(item) {
               if (item.controller.needRecalcOnKeyboardShow()) {
                  item.controller._elementUpdated(item, _private.getItemContainer(item.id));
               }
            });
            _private.redrawItems();
         },

         getPopupContainer: function() {
            return ManagerController.getContainer();
         },

         finishPendings: function(popupId, popupCallback, pendingCallback, pendingsFinishedCallback) {
            var registrator = _private.getPopupContainer().getPendingById(popupId);
            var item = _private.findItemById(popupId);
            if (item && registrator) {
               popupCallback && popupCallback();

               if (registrator) {
                  if (registrator._hasRegisteredPendings()) {
                     pendingCallback && pendingCallback();
                  }
                  var finishDef = registrator.finishPendingOperations();
                  finishDef.addCallbacks(function() {
                     pendingsFinishedCallback && pendingsFinishedCallback();
                  }, function(e) {
                     Env.IoC.resolve('ILogger').error('Controls/Popup/Manager/Container', 'Не получилось завершить пендинги: (name: ' + e.name + ', message: ' + e.message + ', details: ' + e.details + ')', e);
                     pendingsFinishedCallback && pendingsFinishedCallback();
                  });
               }
            } else {
               pendingsFinishedCallback && pendingsFinishedCallback();
            }
         },

         isIgnoreActivationArea: function(focusedContainer) {
            while (focusedContainer) {
               if (focusedContainer.classList && focusedContainer.classList.contains('controls-Popup__isolatedFocusingContext')) {
                  return true;
               }
               focusedContainer = focusedContainer.parentElement;
            }
            return false;
         },

         find: function(id) {
            var item = _private.findItemById(id);

            if (!item || item.popupState === item.controller.POPUP_STATE_DESTROYING || item.popupState === item.controller.POPUP_STATE_DESTROYED) {
               return null;
            }

            return item;
         },

         findItemById: function(id) {
            var index = _private.popupItems && _private.popupItems.getIndexByValue('id', id);
            if (index > -1) {
               return _private.popupItems.at(index);
            }
            return null;
         },

         // TODO Compatible
         // Старые панели прерывали свое закрытие без механизма пендингов, на событие onBeforeClose
         // Зовем метод close с шаблона. Если закрывать по механизму деактивации, то он уничтожит попап =>
         // у compoundArea вызовется сразу destroy. такую логику прервать нельзя
         _getCompoundArea: function(popupContainer) {
            return $('.controls-CompoundArea', popupContainer)[0].controlNodes[0].control;
         }
      };

      /**
       * Popups Manager
       * @class Controls/Popup/Manager
       * @private
       * @singleton
       * @category Popup
       * @author Красильников Андрей
       */

      var Manager = Control.extend({
         _template: template,
         _afterMount: function() {
            ManagerController.setManager(this);
            this._hasMaximizePopup = false;
            _private.initializePopupItems();
            if (Env.detection.isMobileIOS) {
               _private.controllerVisibilityChangeHandler = _private.controllerVisibilityChangeHandler.bind(_private);
               EnvEvent.Bus.globalChannel().subscribe('MobileInputFocus', _private.controllerVisibilityChangeHandler);
               EnvEvent.Bus.globalChannel().subscribe('MobileInputFocusOut', _private.controllerVisibilityChangeHandler);
            }
         },

         /**
          * Show
          * @function Controls/Popup/Manager#show
          * @param options popup configuration
          * @param controller popup controller
          */
         show: function(options, controller) {
            var item = this._createItemConfig(options, controller);
            controller.getDefaultConfig(item);
            _private.addElement.call(this, item);
            _private.redrawItems();
            return item.id;
         },

         updateOptionsAfterInitializing: function(id, options) {
            var item = this.find(id);
            if (item && item.popupState === item.controller.POPUP_STATE_INITIALIZING) {
               item.popupOptions = options;
               item.controller.getDefaultConfig(item);
            }
         },

         _createItemConfig: function(options, controller) {
            if (!this._hasMaximizePopup && options.maximize) {
               this._hasMaximizePopup = true;
            }
            return {
               id: randomId('popup-'),
               isModal: options.isModal,
               controller: controller,
               popupOptions: options,
               isActive: false,
               waitDeactivated: true,
               sizes: {},
               activeControlAfterDestroy: _private.getActiveControl(),
               activeNodeAfterDestroy: _private.getActiveElement(), // TODO: COMPATIBLE
               popupState: controller.POPUP_STATE_INITIALIZING,
               hasMaximizePopup: this._hasMaximizePopup
            };
         },

         _contentClick: function(event) {
            var deactivatedPopups = [];
            _private.popupItems.each(function(item) {
               // Закрываем только те окна, которые были открыты до mousedown'a
               // todo: https://online.sbis.ru/opendoc.html?guid=00a8e7a6-c4b7-4301-a4eb-700d2ef01e9f
               if (item && item.waitDeactivated && _private.popupItemsClone && _private.popupItemsClone.getIndexByValue('id', item.id) > -1) {
                  if (!_private.isIgnoreActivationArea(event.target)) {
                     deactivatedPopups.push(item.id);
                  }
               }
            });
            for (var i = 0; i < deactivatedPopups.length; i++) {
               _private.popupDeactivated(deactivatedPopups[i]);
            }
         },

         _mouseDownHandler: function() {
            if (_private.popupItems) {
               _private.popupItemsClone = _private.popupItems.clone();
            }
         },

         /**
          * Upgrade options of an existing popup
          * @function Controls/Popup/Manager#update
          * @param id popup id
          * @param options new options of popup
          */
         update: function(id, options) {
            var element = this.find(id);
            if (element) {
               var oldOptions = element.popupOptions;
               element.popupOptions = options;
               if (element.controller._elementUpdated(element, _private.getItemContainer(id))) {
                  _private.updateOverlay();
                  _private.redrawItems();

                  // wait, until popup will be update options
                  runDelayed(function() {
                     ManagerController.getContainer().activatePopup(id);
                  });
               } else {
                  element.popupOptions = oldOptions;
               }
               return id;
            }
            return null;
         },

         /**
          * Remove popup
          * @function Controls/Popup/Manager#remove
          * @param id popup id
          */
         remove: function(id) {
            return _private.remove(this, id);
         },

         /**
          * Find popup configuration
          * @function Controls/Popup/Manager#find
          * @param id popup id
          */
         find: function(id) {
            return _private.find(id);
         },

         /**
          * Reindex a set of popups, for example, after changing the configuration of one of them
          * @function Controls/Popup/Manager#reindex
          */
         reindex: function() {
            _private.popupItems._reindex();
         },

         _eventHandler: function(event, actionName) {
            var args = Array.prototype.slice.call(arguments, 2);
            var actionResult = _private[actionName].apply(this, args);
            if (actionResult === true) {
               _private.redrawItems();
            }
         },
         _beforeUnmount: function() {
            if (Env.detection.isMobileIOS) {
               EnvEvent.Bus.globalChannel().unsubscribe('MobileInputFocus', _private.controllerVisibilityChangeHandler);
               EnvEvent.Bus.globalChannel().unsubscribe('MobileInputFocusOut', _private.controllerVisibilityChangeHandler);
            }
         }
      });

      Manager.prototype._private = _private;
      return Manager;
   });
