import {TemplateFunction} from 'UI/Base';

export interface IItemTemplateOptions {
    /**
     * @name Controls/_interface/IItemTemplate#itemTemplateProperty
     * Имя свойства, содержащего ссылку на шаблон элемента. Если значение свойства не передано, то для отрисовки используется itemTemplate.
     * <a href="/materials/demo-ws4-list-item-template">Демо-пример</a>.
     */
    itemTemplateProperty: string;
    /**
     * @name Controls/_interface/IItemTemplate#itemTemplate
     * Шаблон элемента списка.
     * <a href="/materials/demo-ws4-list-item-template">Демо-пример</a>.
     * @remark
     * По умолчанию используется шаблон "Controls/list:ItemTemplate".
     *
     * Базовый шаблон itemTemplate поддерживает следующие параметры:
     * - contentTemplate {Function} — Шаблон содержимого элемента;
     * - highlightOnHover {Boolean} — Выделять элемент при наведении на него курсора мыши.
     * - clickable {Boolean} - Тип курсора (false - default или true - pointer) По умолчанию true.
     *
     * В области видимости шаблона доступен объект itemData, позволяющий получить доступ к данным рендеринга (например, элемент, ключ и т.д.).
     *
     * Подробнее о работе с шаблоном читайте в <a href="/doc/platform/developmentapl/interface-development/controls/list/list/templates/item/">руководстве разработчика</a>.
     * @example
     * <pre>
     *    <Controls.list:View>
     *       <ws:itemTemplate>
     *          <ws:partial template="Controls/list:ItemTemplate" scope="{{itemTemplate}}">
     *             <ws:contentTemplate>
     *                <span>{{contentTemplate.itemData.item.description}}</span>
     *             </ws:contentTemplate>
     *          </ws:partial>
     *       </ws:itemTemplate>
     *    </Controls.list:View>
     * </pre>
     */
    itemTemplate: TemplateFunction;
}

/**
 * Интерфейс для контролов с возможностью настройки отображения элементов.
 *
 * @interface Controls/_interface/IItemTemplate
 * @private
 * @author Герасимов А.М.
 */
interface IItemTemplate {
    readonly '[Controls/_interface/IItemTemplate]': boolean;
}

export default IItemTemplate;