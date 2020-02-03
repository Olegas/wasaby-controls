import {Control, TemplateFunction} from "UI/Base"
import * as Template from "wml!Controls-demo/grid/Results/CellTemplate/CellTemplate"
import {Memory} from "Types/source"
import {getCountriesStats} from "../../DemoHelpers/DataCatalog";

import 'css!Controls-demo/Controls-demo'

export default class extends Control {
    protected _template: TemplateFunction = Template;
    protected _viewSource: Memory;
    protected _header = getCountriesStats().getDefaultHeader();
    protected _columns = getCountriesStats().getColumnsWithWidths();

    protected _beforeMount() {
        this._viewSource = new Memory({
            keyProperty: 'id',
            data: getCountriesStats().getData()
        });
    }
}