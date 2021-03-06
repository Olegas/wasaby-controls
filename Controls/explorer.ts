/**
 * Библиотека контролов, которые реализуют иерархический список с возможностью входить в раздел и отображать элементы в разных режимах.
 * @library Controls/explorer
 * @includes View Controls/_explorer/View
 * @includes SearchItemTemplate wml!Controls/_treeGrid/SearchView/Item
 * @includes IExplorer Controls/_explorer/interface/IExplorer
 * @public
 * @author Крайнов Д.О.
 */

import View = require('Controls/_explorer/View');
import SearchItemTemplate = require('wml!Controls/_treeGrid/SearchView/Item');

export {
   View,
   SearchItemTemplate
};
