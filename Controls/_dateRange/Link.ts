import BaseControl = require('Core/Control');
import ILinkView from './interfaces/ILinkView';
import componentTmpl = require('wml!Controls/_dateRange/Link/Link');
import 'css!theme?Controls/dateRange';
import getOptions from 'Controls/Utils/datePopupUtils';
/**
 * Controls that allows user to select date value in calendar.
 *
 * @class Controls/_dateRange/Link
 * @extends Core/Control
 * @mixes Controls/interface/IInputDateTime
 * @mixes Controls/interface/ILinkView
 * @control
 * @public
 * @category Input
 * @author Водолазских А.А.
 * @demo Controls-demo/Input/Date/Link
 *
 */

var Component = BaseControl.extend({
   _template: componentTmpl,

   _openDialog: function(event) {
      const container = this._children.linkView.getDialogTarget();
      var cfg = {
         ...getOptions.getCommonOptions(this),
         target: container,
         template: 'Controls/datePopup',
         className: 'controls-PeriodDialog__picker',
         templateOptions: {
            ...getOptions.getTemplateOptions(this),
            headerType: 'link',
            closeButtonEnabled: true,
            rangeselect: false,
            quantum: null
         }
      };
      if (!this._options.vdomDialog) {
         cfg.template = 'SBIS3.CONTROLS/Date/RangeBigChoose';
         cfg.isCompoundTemplate = true;
         cfg.templateOptions.handlers = { onChoose: this._onResultWS3.bind(this) };
      }
      this._children.opener.open(cfg);
   },
   _onResultWS3: function(event, startValue) {
      this._onResult(startValue);
   },
   _onResult: function(value) {
      this._notify('valueChanged', [value]);
      this._children.opener.close();
      this._forceUpdate();
   },
   _rangeChangedHandler: function(event, value) {
      this._notify('valueChanged', [value]);
   }
});

Component.EMPTY_CAPTIONS = ILinkView.EMPTY_CAPTIONS;

Component.getDefaultOptions = function() {
   return {vdomDialog: true, ...ILinkView.getDefaultOptions()};
};

Component.getOptionTypes = function() {
   return ILinkView.getOptionTypes();
};

export default Component;
