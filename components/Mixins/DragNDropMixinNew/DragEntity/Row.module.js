/*global define, $ws, $*/
define('js!SBIS3.CONTROLS.DragEntity.Row', [
   'js!SBIS3.CONTROLS.DragEntity.Entity',
   'js!WS.Data/Di'
], function (Entity, Di) {
   'use strict';
   /**
    * Объект dragndrop списочного контрола. Объекты этого класса либо его наследники создаются  listview когда начинают
    * перетаскивать элемент.
    *
    * @class SBIS3.CONTROLS.DragEntity.Row
    * @control
    * @public
    * @author Крайнов Дмитрий Олегович
    * @example
    * Рассмотрим пример как создать свою сущность
    * <pre>
    *    defined('js!SBIS3.Demo.DragEntity.Task', ['js!SBIS3.CONTROLS.DragEntity.Row', 'js!WS.Data/Di'], function(Row){
    *       var Task = Row.extend({
    *          $protected: {
    *             _options: {
    *                user: undefined
    *             }
    *          }
    *          getUser: function(){
    *             return this._options.user
    *          }
    *       });
    *       //если не нужно прокидывать долнительные опции то регистрируем вот так
    *       Di.register('demo.task', Task);
    *
    *    })
    *
    *    //где то в другом модуле регистрируем фабрику.
    *    ...
    *    var context = this.getLinkedContext();
    *    Di.register('demo.taskfactory', function(options){
    *        options.user = context.getValue('user');
    *        return new Task(options);
    *    });
    *    ...
    * </pre>
    * внедряем фабрику в ListView через xhtml
    * <pre>
    *    ...
    *    <component data-component="SBIS3.CONTROLS.ListView" name="listView">
    *       ...
    *       <option name="dragEntity">demo.taskfactory</option>
    *       ...
    *    </component>
    *    ...
    * </pre>
    * @see SBIS3.CONTROLS.ListView#dragEntity
    * @see SBIS3.CONTROLS.ListView#DragEntityOptions
    * @see SBIS3.CONTROLS.DragObject
    */
   var Row = Entity.extend(/**@lends SBIS3.CONTROLS.DragEntity.Row.prototype*/{
      _moduleName: 'SBIS3.CONTROLS.DragEntity.Row',
      /**
       * @typedef {String} DragPosition Показывает куда вставлять перетаскиваемые элементы
       * @variant on Внутрь текущей записи
       * @variant after После текущей записи
       * @variant before Перед текущей записью
       */
      $protected: {
         _options: {
            /**
             * @cfg {WS.Data/Entity/Model} Модель по которой строится строка
             */
            model: undefined,
            /**
             * @cfg {DragPosition} Позиция куда добавлять элемент
             */
            position: undefined,
            /**
             * @cfg {JQuery} строка
             */
            domElement: undefined
         }
      },
      /**
       * Возвращает модель строки
       * @returns {WS.Data/Entity/Model}
       */
      getModel: function () {
         return this._options.model;
      },
      /**
       * Устанавливает модель строки
       * @param {WS.Data/Entity/Mode} model
       */
      setModel: function (model) {
         this._options.model = model;
      },
      /**
       * Возвращает позицию элемента
       * @returns {DragPosition}
       * @see position
       */
      getPosition: function () {
         return this._options.position;
      },
      /**
       * Устанавливает позицию элемента
       * @param {DragPosition} position
       * @see position
       */
      setPosition: function (position) {
         this._options.position = position;
      },
      /**
       * Возвращает JQuery элемент сроки
       * @returns {JQuery}
       */
      getDomElement: function () {
         return this._options.domElement;
      },
      /**
       * Устанавливает JQuery элемент сроки
       * @param {JQuery} element
       */
      setDomElement: function (element) {
         this._options.domElement = element;
      }
   });
   Di.register('dragentity.row', Row);
   return Row;
});