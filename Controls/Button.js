define('Controls/Button', [
   'Core/Control',
   'Controls/Button/Classes',
   'tmpl!Controls/Button/Button',
   'css!Controls/Button/Button'
], function(Control, Classes, template) {
   'use strict';

   /**
    * Button
    * @class Controls/Button
    * @extends Controls/Control
    * @mixes Controls/Button/interface/IHref
    * @mixes Controls/Button/interface/ICaption
    * @mixes Controls/Button/interface/IClick
    * @mixes Controls/Button/interface/IIcon
    * @mixes Controls/interface/ITooltip
    * @control
    * @public
    * @category Button
    */

   /**
    * @name Controls/Button#style
    * @cfg {String} Display style of button.
    * @variant iconButtonBordered Button display as icon with border.
    * @variant linkMain Button display as main link style.
    * @variant linkMain2 Button display as first nonaccent link style.
    * @variant linkMain3 Button display as second nonaccent link style.
    * @variant linkAdditional Button display as third nonaccent link style.
    * @variant linkAdditional2 Button display as first accent link style.
    * @variant linkAdditional3 Button display as second accent link style.
    * @variant linkAdditional4 Button display as third accent link style.
    * @variant linkAdditional5 Button display as fourth accent link style.
    * @variant buttonPrimary Button display as primary contour button style.
    * @variant buttonDefault Button display as default contour button style.
    * @variant buttonAdd Button display as button with icon add style.
    */

   /**
    * @name Controls/Button#size
    * @cfg {String} Size of Button.
    * @variant s Button has s size.
    * @variant m Button has m size.
    * @variant l Button has l size.
    * @variant xl Button has xl size.
    */

   /**
    * @name Controls/Button#caption
    * @cfg {String} Caption of Button.
    */

   /**
    * @name Controls/Button#icon
    * @cfg {String} Icon of Button. 
    */
   var _private = {
      cssStyleGeneration: function(self, options) {
         var currentButtonClass = Classes.getCurrentButtonClass(options.style);

         self._style = currentButtonClass.style;
         self._type = currentButtonClass.type;
         self._typeWithSize = currentButtonClass.type + '_size-' + options.size;
         self._styleWithIconStyle = currentButtonClass.style + '_iconStyle-' + options.iconStyle;
      }
   };

   var Button = Control.extend({
      _template: template,

      constructor: function(options) {
         Button.superclass.constructor.apply(this, arguments);
         _private.cssStyleGeneration(this, options);
      },

      _beforeUpdate: function(newOptions) {
         _private.cssStyleGeneration(this, newOptions);
      },

      _clickHandler: function(e) {
         if (!this.isEnabled()) {
            e.stopPropagation();
         }
      }
   });

   Button.getDefaultOptions = function() {
      return {
         style: 'buttonDefault',
         size: 'm',
         iconStyle: 'default'
      };
   };

   Button._private = _private;

   return Button;
});
