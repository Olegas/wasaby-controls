import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import template = require('wml!Controls/_popupTemplate/Dialog/Dialog');
import {SyntheticEvent} from 'Vdom/Vdom';
import {Controller as ManagerController} from 'Controls/popup';
import {default as IPopupTemplate, IPopupTemplateOptions} from './interface/IPopupTemplate';
import {goUpByControlTree} from 'UI/Focus';

export interface IDialogTemplateOptions extends IControlOptions, IPopupTemplateOptions {
   draggable?: boolean;
}

interface IDragObject {
    offset: number;
}

/**
 * Базовый шаблон {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/openers/dialog/#template диалогового окна}.
 * @class Controls/_popupTemplate/Dialog
 * @extends Core/Control
 * @control
 * @public
 * @category Popup
 * @author Красильников А.С.
 * @implements Controls/_popupTemplate/interface/IPopupTemplate
 * @implements Controls/_popupTemplate/interface/IPopupTemplateBase
 * @demo Controls-demo/Popup/Templates/DialogTemplatePG
 */

/**
 * @name Controls/_popupTemplate/Dialog#draggable
 * @cfg {Boolean} Определяет, может ли окно перемещаться с помощью <a href='https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/tools/drag-n-drop/'>d'n'd</a>.
 * @default false
 */

class DialogTemplate extends Control<IDialogTemplateOptions> implements IPopupTemplate {
    '[Controls/_popupTemplate/interface/IPopupTemplate]': boolean = true;
    protected _template: TemplateFunction = template;
    protected _headerTheme: string;

    protected _beforeMount(options: IDialogTemplateOptions): void {
        this._prepareTheme();
    }

    protected _beforeUpdate(options: IDialogTemplateOptions): void {
        this._prepareTheme();
    }

    private _onDragEnd(): void {
        this._notify('popupDragEnd', [], {bubbling: true});
    }

    private _onDragMove(event: SyntheticEvent<Event>, dragObject: IDragObject): void {
        this._notify('popupDragStart', [dragObject.offset], {bubbling: true});
    }

    protected close(): void {
        this._notify('close', [], {bubbling: true});
    }

    private _prepareTheme(): void {
        this._headerTheme = ManagerController.getPopupHeaderTheme();
    }

    private _onMouseDown(event: SyntheticEvent<Event>): void {
        if (this._needStartDrag(event.target)) {
            this._startDragNDrop(event);
        }
    }

    private _needStartDrag(target: EventTarget): boolean {
        const controlsArray = goUpByControlTree(target);

        // if click to control then control must handle click
        // Шапка диалога - отдельный контрол, поэтому теперь индекс диалога в дереве контролов сместился
        //TODO: will be fixed by https://online.sbis.ru/opendoc.html?guid=33010df1-501e-4874-a02c-a5f45394a661
        return this._options.draggable && controlsArray[1]._container === this._container;
    }

    private _startDragNDrop(event: SyntheticEvent<Event>): void {
        this._children.dragNDrop.startDragNDrop(null, event);
    }

    static _theme: string[] = ['Controls/popupTemplate'];
    static getDefaultOptions(): IDialogTemplateOptions {
        return {
            headingStyle: 'secondary',
            headingSize: '3xl',
            closeButtonVisibility: true,
            closeButtonViewMode: 'toolButton',
            closeButtonTransparent: true
        };
    }
}

export default DialogTemplate;
