import extend = require('Core/core-extend');
      

      /**
       * Базовый класс, от которого наследуется объект перемещения.
       * Объект можно любым образом кастомизировать, записав туда любые необходимые данные.
       * Подробнее читайте <a href="/doc/platform/developmentapl/interface-development/controls/tools/drag-n-drop/">здесь</a>.
       * @class Controls/_dragnDrop/Entity
       * @public
       * @author Авраменко А.С.
       * @category DragNDrop
       */

      /*
       * The base class for the inheritors of the drag'n'drop entity.
       * You can customize an entity in any way by passing any data to the options.
       * More information you can read <a href="/doc/platform/developmentapl/interface-development/controls/drag-n-drop/">here</a>.
       * @class Controls/_dragnDrop/Entity
       * @public
       * @author Авраменко А.С.
       * @category DragNDrop
       */

      var Entity = extend({
         constructor: function(options) {
            this._options = options;
         },
         getOptions: function() {
            return this._options;
         }
      });

      export = Entity;
   
