/**
 * Created by am.gerasimov on 05.07.2016.
 */
define('SBIS3.CONTROLS/Filter/Button/Link', ['SBIS3.CONTROLS/Link'], function(Link) {
       'use strict';

       /**
        * Компонент, отображающий ссылку. Умеет скрваться/отобрадаться в зависимости от опции {@link invertedVisible}
        * Используется на панели {@link SBIS3.CONTROLS/Filter/Button}:
        * @class SBIS3.CONTROLS/Filter/Button/Link
        * @extends SBIS3.CONTROLS/Link
        * @author Герасимов А.М.
        * @control
        * @public
        */

       var FilterLink = Link.extend(/** @lends SBIS3.CONTROLS/Filter/Button/Link.prototype */{
          $protected: {
             _options: {
                /**
                 * @cfg {boolean} Инвертированное значение опции visible.
                 * Если значение false - компонент отображается, если значение true - компонент скрыт.
                 * @see setInvertedVisible
                 * @see getInvertedVisible
                 */
                invertedVisible: false
             }
          },
          _modifyOptions: function() {
             var opts = FilterLink.superclass._modifyOptions.apply(this, arguments);
             opts.cssClassName += ' blue-dark-color';
             /* Если invertedVisible выставлена, то компонент должен быть скрыт */
             if(opts.invertedVisible) {
                opts.visible = false;
             }
             return opts;
          },

          setInvertedVisible: function(invertedVisible) {
             this._options.invertedVisible = invertedVisible;
             this.toggle(!invertedVisible);
             this._notifyOnSizeChanged(this);
             this._notifyOnPropertyChanged('invertedVisible');
          },

          getInvertedVisible: function() {
             return this._options.invertedVisible
          }
       });

       return FilterLink;
    });