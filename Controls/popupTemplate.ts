/**
 * Библиотека контролов, которые реализуют содержимое всплывающих окон.
 * @library Controls/popupTemplate
 * @includes CloseButton Controls/_popupTemplate/CloseButton
 * @includes Stack Controls/_popupTemplate/Stack
 * @includes StackHeader wml!Controls/_popupTemplate/Stack/resources/Header
 * @includes Dialog Controls/_popupTemplate/Dialog
 * @includes Confirmation Controls/popupConfirmation
 * @includes InfoBox Controls/_popupTemplate/InfoBox
 * @includes Notification Controls/_popupTemplate/Notification/Base
 * @includes NotificationSimple Controls/_popupTemplate/Notification/Simple
 * @includes INotification Controls/_popupTemplate/Notification/interface/INotification
 * @includes IPopupTemplate Controls/_popupTemplate/interface/IPopupTemplate
 * @includes Sticky Controls/_popupTemplate/Sticky
 * @public
 * @author Крайнов Д.О.
 */
/*
 * popupTemplate library
 * @library Controls/popupTemplate
 * @includes CloseButton Controls/_popupTemplate/CloseButton
 * @includes Stack Controls/_popupTemplate/Stack
 * @includes StackHeader wml!Controls/_popupTemplate/Stack/resources/Header
 * @includes Dialog Controls/_popupTemplate/Dialog
 * @includes Confirmation Controls/popupConfirmation
 * @includes InfoBox Controls/_popupTemplate/InfoBox
 * @includes Notification Controls/_popupTemplate/Notification/Base
 * @includes NotificationSimple Controls/_popupTemplate/Notification/Simple
 * @includes IPopupTemplate Controls/_popupTemplate/interface/IPopupTemplate
 * @includes Sticky Controls/_popupTemplate/Sticky
 * @public
 * @author Крайнов Д.О.
 */

import Dialog = require('Controls/_popupTemplate/Dialog');
import { Template as Confirmation, DialogTemplate as ConfirmationDialog } from 'Controls/popupConfirmation';
import InfoBox = require('Controls/_popupTemplate/InfoBox');
export {default as Notification} from 'Controls/_popupTemplate/Notification/Base';
export {default as NotificationSimple} from 'Controls/_popupTemplate/Notification/Simple';
export {default as StackHeader} from 'Controls/_popupTemplate/Stack/resources/Header';
export {default as Stack} from 'Controls/_popupTemplate/Stack';
export {default as Sticky} from 'Controls/_popupTemplate/Sticky';
export {default as IPopupTemplate, IPopupTemplateOptions} from 'Controls/_popupTemplate/interface/IPopupTemplate';
export {default as INotification, INotificationOptions} from 'Controls/_popupTemplate/Notification/interface/INotification';
export {default as CloseButton} from 'Controls/_popupTemplate/CloseButton'

import {default as BaseController} from 'Controls/_popupTemplate/BaseController';
import DialogController = require('Controls/_popupTemplate/Dialog/Opener/DialogController');
import StickyController = require('Controls/_popupTemplate/Sticky/StickyController');
import InfoBoxController = require('Controls/_popupTemplate/InfoBox/Opener/InfoBoxController');
import StackController = require('Controls/_popupTemplate/Stack/Opener/StackController');
import StackContent = require('Controls/_popupTemplate/Stack/Opener/StackContent');
import TargetCoords = require('Controls/_popupTemplate/TargetCoords');
import NotificationController = require('Controls/_popupTemplate/Notification/Opener/NotificationController');
import PreviewerController = require('Controls/_popupTemplate/Previewer/PreviewerController');
import templateInfoBox = require('Controls/_popupTemplate/InfoBox/Opener/resources/template');

import StackStrategy = require('Controls/_popupTemplate/Stack/Opener/StackStrategy');

export {
   Dialog,
   Confirmation,
   InfoBox,

   BaseController,
   ConfirmationDialog,
   DialogController,
   StickyController,
   StackContent,
   InfoBoxController,
   StackController,
   TargetCoords,
   NotificationController,
   PreviewerController,
   templateInfoBox,
   StackStrategy
};
