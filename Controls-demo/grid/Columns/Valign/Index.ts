import {Control, TemplateFunction} from "UI/Base"
import * as Template from "wml!Controls-demo/grid/Columns/Valign/Valign"
import {Memory} from "Types/source"
import {getCountriesStats} from "../../DemoHelpers/DataCatalog"

import 'css!Controls-demo/Controls-demo'

export default class extends Control {
    protected _template: TemplateFunction = Template;
    protected _viewSource: Memory;

    protected _columns = getCountriesStats().getColumnsWithValign();

    protected _beforeMount() {
        this._viewSource = new Memory({
            keyProperty: 'id',
            data: getCountriesStats().getData().slice(0, 5)
        });
    }
}