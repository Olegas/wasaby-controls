define('Controls/Popup/Opener/Notification/Strategy',
   [
      'Controls/Popup/Opener/BaseStrategy'
   ],
   function (BaseStrategy) {

      /**
       * Стратегия позиционирования нотификационного окна.
       * @class Controls/Popup/Opener/Notification/Strategy
       * @control
       * @public
       * @category Popup
       * @extends Controls/Control
       */
      var Strategy = BaseStrategy.extend({
         elementCreated: function (cfg) {
            cfg.position = this.getPosition();
         },

         /**
          * TODO Возвращает позицию push-уведомления
          * @function Controls/Popup/Opener/Notification/Strategy#getPosition
          */
         getPosition: function () {
            return {
               right: 16,
               bottom: 16
            };
         }
      });

      return new Strategy();
   }
);