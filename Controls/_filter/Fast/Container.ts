/**
 * Created by am.gerasimov on 22.03.2018.
 */
import Control = require('Core/Control');
import template = require('wml!Controls/_filter/Fast/Container');

/**
 * Контрол используют в качестве контейнера для {@link Controls/filter:Fast}. Он обеспечивает передачу параметров фильтрации между {@link Controls/filter:Controller} и Controls/filter:Fast.
 * @remark
 * Получает результат дочернего события "filterChanged" и уведомляет о всплывающем событии "filterChanged".
 *
 * Подробнее об организации поиска и фильтрации в реестре читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/list-environment/filter-search/ здесь}.
 * Подробнее о классификации контролов Wasaby и схеме их взаимодействия читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/list-environment/component-kinds/ здесь}.
 *
 * @class Controls/_filter/Fast/Container
 * @extends Core/Control
 * @author Герасимов А.М.
 * @control
 * @public
 * @deprecated Данный контрол устарел и будет удалён.
 */

/*
 * Special container for {@link Controls/_filter/Fast}.
 * Listens for child's "filterChanged" event and notify bubbling event "filterChanged".
 * Receives props from context and pass to {@link Controls/_filter/Fast}.
 * NOTE: Must be located inside Controls/_filter/Controller.
 *
 * More information you can read <a href='/doc/platform/developmentapl/interface-development/controls/filter-search/'>here</a>.
 *
 * @class Controls/_filter/Fast/Container
 * @extends Core/Control
 * @author Герасимов А.М.
 * @control
 * @public
 */



var Container = Control.extend(/** @lends Controls/_filter/Fast/Container.prototype */{

   _template: template,

   _itemsChanged: function(event, items) {
      this._notify('filterItemsChanged', [items], {bubbling: true});
   }
});

export = Container;

