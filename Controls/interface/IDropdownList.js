define('Controls/interface/IDropdownList', [], function() {

   /**
    * Interface for dropdown lists.
    *
    * @interface Controls/interface/IDropdownList
    * @public
    */

   /**
    * @typedef {String} typeShadow
    * @variant default Default shadow
    * @variant suggestionsContainer Shadow on the right, left, bottom
    */

   /**
    * @typedef {Object} headConfig
    * @property {menuStyle} menuStyle
    * @variant defaultHead The head with icon and caption
    * @variant duplicateHead The icon set under first item
    */

   /**
    * @typedef {String} menuStyle
    * @variant defaultHead The head with icon and caption
    * @variant duplicateHead The icon set under first item
    */

   /**
    * @typedef {String|Boolean} emptyText
    * @variant true Add empty item with text 'Не выбрано'
    */

   /**
    * @typedef {Object} templateOptions
    * @property {headConfig} headConfig Configuration for folder render
    * @property {String} keyProperty Name of the item property that uniquely identifies collection item
    * @property {String} parentProperty Name of the field that contains item's parent identifier
    * @property {String} nodeProperty Name of the item property that identifies item type (list, node, hidden node)
    * @property {String} itemTemplateProperty Name of the item property that contains template for item render. If not set, itemTemplate is used instead
    * @property {Function} itemTemplate Template for item render
    * @property {Function} headTemplate Template that will be rendered above the list.
    * @property {Function} contentTemplate Template that will be render the list.
    * @property {Function} footerTemplate Template that will be rendered below the list.
    * @property {Boolean} showHeader Indicates whether folders should be displayed.
    * @property {Boolean} showClose Determines whether the cross is displayed.
    * @property {Array} selectedKeys Array of selected items' keys.
    * @property {typeShadow} typeShadow Specifies the type of shadow around the popup.
    * @property {emptyText} emptyText Add an empty item to the list with the given text.
    * @property {Boolean} marker Determines whether the marker is displayed around the selected item.
    */

});
