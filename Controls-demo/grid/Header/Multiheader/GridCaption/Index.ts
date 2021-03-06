import {Control, TemplateFunction} from "UI/Base"
import * as Template from "wml!Controls-demo/grid/Header/Multiheader/GridCaption/GridCaption"
import {Memory} from "Types/source"
import {getCountriesStats} from "../../../DemoHelpers/DataCatalog"
import 'wml!Controls-demo/grid/Header/Multiheader/GridCaption/GridCaptionHeaderCell'
import 'css!Controls-demo/Controls-demo'

export default class extends Control {
    protected _template: TemplateFunction = Template;
    protected _viewSource: Memory;
    private _header = getCountriesStats().getMultiHeaderVar2();
    protected _columns = getCountriesStats().getColumnsWithWidths().slice(1);

    protected _beforeMount() {
        this._header[0].template = 'wml!Controls-demo/grid/Header/Multiheader/GridCaption/GridCaptionHeaderCell';
        this._viewSource = new Memory({
            keyProperty: 'id',
            data: getCountriesStats().getData()
        });
    }
}