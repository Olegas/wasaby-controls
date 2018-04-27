/**
 * Created by ps.borisov on 21.05.2016.
 */
define('SBIS3.CONTROLS/RichEditor/Components/RichTextArea',
   [
   "Core/UserConfig",
   "Core/core-clone",
   "Core/Context",
   "Core/Indicator",
   "Core/core-clone",
   "Core/CommandDispatcher",
   "Core/constants",
   "Core/Deferred",
   "Core/helpers/Function/runDelayed",
   "SBIS3.CONTROLS/TextBox/TextBoxBase",
   "tmpl!SBIS3.CONTROLS/RichEditor/Components/RichTextArea/RichTextArea",
   "SBIS3.CONTROLS/Utils/RichTextAreaUtil/RichTextAreaUtil",
   "SBIS3.CONTROLS/RichEditor/Components/RichTextArea/resources/smiles",
   'WS.Data/Di',
   "SBIS3.CONTROLS/Utils/ImageUtil",
   "Core/Sanitize",
   'Core/helpers/String/escapeTagsFromStr',
   'Core/helpers/String/escapeHtml',
   'Core/helpers/String/linkWrap',
   'SBIS3.CONTROLS/RichEditor/Components/RichTextArea/resources/ImageOptionsPanel/ImageOptionsPanel',
   'SBIS3.CONTROLS/RichEditor/Components/RichTextArea/resources/CodeSampleDialog/CodeSampleDialog',
   'Core/EventBus',
   'SBIS3.CONTROLS/WaitIndicator',

   'tmpl!SBIS3.CONTROLS/RichEditor/Components/RichTextArea/RichTextAreaInner',
   "css!WS/css/styles/RichContentStyles",
   "i18n!SBIS3.CONTROLS/RichEditor",
   'css!SBIS3.CONTROLS/RichEditor/Components/RichTextArea/RichTextArea'
], function (
      UserConfig,
      cClone,
      cContext,
      cIndicator,
      coreClone,
      CommandDispatcher,
      cConstants,
      Deferred,
      runDelayed,
      TextBoxBase,
      dotTplFn,
      RichUtil,
      smiles,
      Di,
      ImageUtil,
      Sanitize,
      escapeTagsFromStr,
      escapeHtml,
      LinkWrap,
      ImageOptionsPanel,
      CodeSampleDialog,
      EventBus,
      WaitIndicator
   ) {
      'use strict';

      //TODO: ПЕРЕПИСАТЬ НА НОРМАЛЬНЫЙ КОД РАБОТУ С ИЗОБРАЖЕНИЯМИ

      /**
       * Константа - информация о текущем браузере
       * @private
       * @type {object}
       */
      var BROWSER = cConstants.browser;
      // TODO: Избавиться везде ниже от выражения cConstants.browser

      var _getTrueIEVersion = function () {
         var version = cConstants.browser.IEVersion;
         // В cConstants.browser.IEVersion неправильно определяется MSIE 11
         if (version < 11 && typeof window !== 'undefined') {
            var ms = navigator.userAgent.match(/Trident\/([0-9]+)\.[0-9]+/);
            if (ms) {
               version = +ms[1] + 4
            }
         }
         return version;
      };

      var
         // TinyMCE 4.7 и выше не поддерживает MSIE 10? поэтому отдельно для него старый TinyMCE
         // 1175061954 https://online.sbis.ru/opendoc.html?guid=296b17cf-d7e9-4ff3-b4d9-e192627b41a1
         TINYMCE_URL_BASE = cConstants.browser.isIE && _getTrueIEVersion() < 11 ? 'SBIS3.CONTROLS/RichEditor/third-party/tinymce46-ie10' : 'SBIS3.CONTROLS/RichEditor/third-party/tinymce',
         EDITOR_MODULES = [
            //'css!' + TINYMCE_URL_BASE + '/skins/lightgray/skin.min.css',
            //'css!' + TINYMCE_URL_BASE + '/skins/lightgray/content.inline.min.css',
            //Экстренное решение что бы уменшить трафик. В 3.18.200 надо исправить сия безобразие
            TINYMCE_URL_BASE + '/tinymce'
         ],
         constants = {
            baseAreaWidth: 768,//726
            defaultImagePercentSize: 25,// Начальный размер картинки (в процентах)
            defaultPreviewerSize: 768,//512
            //maximalPictureSize: 120,
            imageOffset: 40, //16 слева +  24 справа
            defaultYoutubeHeight: 300,
            minYoutubeHeight: 214,
            defaultYoutubeWidth: 430,
            minYoutubeWidth: 350,
            //dataReviewPaddings: 6,
            styles: {
               title: {inline: 'span', classes: 'titleText'},
               subTitle: {inline: 'span', classes: 'subTitleText'},
               additionalText: {inline: 'span', classes: 'additionalText'}
            },
            colorsMap: {
               'rgb(0, 0, 0)': 'black',
               'rgb(255, 0, 0)': 'red',
               'rgb(0, 128, 0)': 'green',
               'rgb(0, 0, 255)': 'blue',
               'rgb(128, 0, 128)': 'purple',
               'rgb(128, 128, 128)': 'grey'
            },
            ipadCoefficient: {
               top: {
                  vertical: 0.65,
                  horizontal:0.39
               },
               bottom: {
                  vertical: 0.7,
                  horizontal:0.44
               }
            }
         },
         /**
          * Поле ввода для богатого текстового редактора. Чтобы связать с ним тулбар {@link SBIS3.CONTROLS/RichEditor/Components/Toolbar}, используйте метод {@link SBIS3.CONTROLS/RichEditor/Components/ToolbarBase#setLinkedEditor}.
          * @class SBIS3.CONTROLS/RichEditor/Components/RichTextArea
          * @extends SBIS3.CONTROLS/TextBox/TextBoxBase
          * @author Спирин В.А.
          * @public
          * @control
          */
         RichTextArea = TextBoxBase.extend(/** @lends SBIS3.CONTROLS/RichEditor/Components/RichTextArea.prototype */{
         _dotTplFn: dotTplFn,
         $protected : {
            _options : {
               /**
                * @cfg {Boolean} Поддержка смены шаблонов для изображений
                *     <option name="templates">true</option>
                * </pre>
                */
               templates: true,
               /**
                * @cfg {Boolean} Включение режима автовысоты
                * <wiTag group="Управление">
                * Режим автовысоты текстового редактора.
                * @example
                * <pre>
                *     <option name="autoHeight">true</option>
                * </pre>
                */
               autoHeight: false,
               /**
                * @cfg {Number} Минимальная высота (в пикселях)
                * <wiTag group="Управление">
                * Минимальная высота текстового поля (для режима с автовысотой).
                * @example
                * <pre>
                *     <option name="autoHeight">true</option>
                *     <option name="minimalHeight">100</option>
                * </pre>
                */
               minimalHeight: 200,
               /**
                * @cfg {Number} Максимальная высота (в пикселях)
                * <wiTag group="Управление">
                * Максимальная высота текстового поля (для режима с автовысотой).
                * Для задания неограниченной высоты необходимо выставить в значении опции 0.
                * @example
                * <pre>
                *     <option name="autoHeight">true</option>
                *     <option name="maximalHeight">0</option>
                * </pre>
                */
               maximalHeight: 300,
               /**
                * @cfg {Boolean} При включенном режиме автовысоты (autoHeight==true) позволяет оставлять сбодной высоту области просмотра в задизейбленном состоянии редактора
                * <wiTag group="Управление">
                * Режим автовысоты области просмотра текстового редактора.
                * @example
                * <pre>
                *     <option name="previewAutoHeight">true</option>
                * </pre>
                */
               previewAutoHeight: false,
               /**
                * @cfg {Object} Объект с настройками для tinyMCE
                * <wiTag group="Управление">
                *
                */
               editorConfig: {
                  className: null,
                  plugins: 'media,paste,lists,noneditable,codesample',
                  codesample_content_css: false,
                  inline: true,
                  relative_urls: false,
                  convert_urls: false,
                  formats: constants.styles,
                  paste_webkit_styles: 'color font-size text-align text-decoration width height max-width padding padding-left padding-right padding-top padding-bottom',
                  paste_retain_style_properties: 'color font-size text-align text-decoration width height max-width padding padding-left padding-right padding-top padding-bottom',
                  paste_as_text: true,
                  extended_valid_elements: 'div[class|onclick|style|id],img[unselectable|class|src|alt|title|width|height|align|name|style]',
                  body_class: 'ws-basic-style',
                  invalid_elements: 'script',
                  paste_data_images: false,
                  paste_convert_word_fake_lists: false, //TODO: убрать когда починят https://github.com/tinymce/tinymce/issues/2933
                  statusbar: false,
                  toolbar: false,
                  menubar: false,
                  browser_spellcheck: true,
                  smart_paste: true,
                  noneditable_noneditable_class: "controls-RichEditor__noneditable",
                  object_resizing: false,
                  inline_boundaries: false
               },
               /**
                * @cfg {String} Значение Placeholder`а
                * При пустом значении редактора отображается placeholder
                * @translatable
                */
               placeholder: '',
               /**
                * Позволяет в задизабленном режиме подсвечивать ссылки на файлы и URL
                * @cfg {Boolean} Подсвечивать ссылки
                * <wiTag group="Управление">
                */
               highlightLinks: false,
               /**
                * Имя каталога, в который будут загружаться изображения
                * @cfg {String} имя декоратора
                */
               imageFolder: 'images',
               /**
                * позволяет сохранять историю ввода
                * @cfg {boolean} Сохранять ли историю ввода
                */
               saveHistory: true,
                /**
                 * @cfg {function} функция проверки валидности класса
                 */
               validateClass: undefined,
               /**
                * @cfg {Object} Пользовательский формат для блоков
                * @example
                * <pre>
                *    <options name="customStyle">
                *       <option name="block">div</option>
                *       <option name="wrapper">1</option>
                *       <option name="remove">all</option>
                *       <option name="classes">customStyle</option>
                *    </options>
                * </pre>
                */
               customFormats: {}
            },
            _richTextAreaContainer: undefined,
            _richTextAreaScrollContainer: undefined,
            _scrollContainer: undefined,
            _dataReview: undefined,
            _inputControl: undefined,
            _fakeArea: undefined, //textarea для перехода фкуса по табу
            _tinyEditor: undefined, //экземпляр tinyMCE
            _lastTotalHeight: undefined, //последняявысота для UpdateHeight
            _lastContentHeight: undefined, //последняявысота для UpdateHeight
            _tinyReady: null, //deferred готовности tinyMCE
            _readyControlDeffered: null, //deferred Готовности контрола
            _saveBeforeWindowClose: null,
            _sourceArea: undefined,
            _sourceContainer: undefined, //TODO: избавиться от _sourceContainer
            _tinyIsInit: false,//TODO: избьавиться от этого флага через  _tinyReady
            _enabled: undefined, //TODO: подумать как избавиться от этого
            _typeInProcess: false,
            _clipboardText: undefined,
            _mouseIsPressed: false, //Флаг того что мышь была зажата в редакторе
            _imageOptionsPanel: undefined,
            _lastReview: undefined,
            _fromTouch: false,
            _codeSampleDialog: undefined,
            _beforeFocusOutRng: undefined,
            _images: {},
            _lastActive: undefined,
            _lastSavedText: undefined,
            //МЕГАкостыль, т.к. один человек, очень быстро нажимает ctr + Enter и отпускаение Enter происходит уже без нажатия ctr
            //Получаем что TextArea думает, что просто отпустили Enter и не пропускает событие. Ошибка обусловлена тем что
            //исторически сложилось так, редактирование по месту обрабатывает нажатия на keyup и от этого нужно уходить.
            //Выписал задачу https://online.sbis.ru/opendoc.html?guid=41cf6afb-ddd1-46b6-9ebf-09dd62e798b5 и надеюсь что
            //в VDOM это заработет само и ни какие костыли с keyup больше не понадобятся.
            _ctrlKeyUpTimestamp: undefined
         },

         _modifyOptions: function(options) {
            options = RichTextArea.superclass._modifyOptions.apply(this, arguments);
            options._prepareReviewContent = this._prepareReviewContent.bind({_options: options});
            options._prepareContent = this._prepareContent.bind(this);
            options._sanitizeClasses = this._sanitizeClasses.bind(this);
            if (options.autoHeight) {
               options.minimalHeight = this._cleanHeight(options.minimalHeight);
               options.maximalHeight = this._cleanHeight(options.maximalHeight);
            }
            return options;
         },

         $constructor: function() {
            var self = this;
            this._publish('onInitEditor', 'onUndoRedoChange','onNodeChange', 'onFormatChange', 'onToggleContentSource');
            this._sourceContainer = this._container.find('.controls-RichEditor__sourceContainer');
            this._sourceArea = this._sourceContainer.find('.controls-RichEditor__sourceArea').bind('input', this._onChangeAreaValue.bind(this));
            this._readyControlDeffered = new Deferred().addCallbacks(function(){
               this._notify('onReady');
            }.bind(this), function (e) {
               return e;
            });
            this._dChildReady.push(this._readyControlDeffered);
            this._tinyReady = new Deferred();
            this._richTextAreaContainer = this._container.find('.controls-RichEditor__richTextArea');
            this._richTextAreaScrollContainer = this._container.find('.controls-RichEditor__scrollContainer');
            this._scrollContainer = this._container.find('.controls-RichEditor__scrollContainer');
            this._dataReview = this._container.find('.controls-RichEditor__dataReview');
            this._inputControl = this._container.find('.controls-RichEditor__editorFrame');
            this._fakeArea = this._container.find('.controls-RichEditor__fakeArea');
            this._initMainHeight();
            this._options.editorConfig.selector = '#' + this.getId() + ' .controls-RichEditor__editorFrame';
            this._options.editorConfig.fixed_toolbar_container = '#' + this.getId() + ' .controls-RichEditor__fakeArea';
            this._options.editorConfig.setup = function(editor) {
               self._tinyEditor = editor;
               self._bindEvents();
            };

            // Наш чудо-платформенный механизм установки состояния задизабленности отрабатывает не в то время.
            // Для того, чтобы отловить реальное состояние задизабленности нужно дожидаться события onInit.
            this.once('onInit', function() {
               //вешать обработчик copy/paste надо в любом случае, тк редактор может менять состояние Enabled
               RichUtil.markRichContentOnCopy(this._dataReview);
               if (!this.isEnabled()) {
                  if (!this._readyControlDeffered.isReady()) {
                     this._readyControlDeffered.callback();
                  }
               }
               this._updateDataReview(this.getText());
            }.bind(this));

            this._togglePlaceholder();
            this._needDebounceTextChanged().addCallback(function (need) {
               if (need) {
                  self._notifyTextChanged = self._notifyTextChanged.debounce(500);
               }
            });
            this._fillImages(false);
         },

         /**
          * Определить, нужно ли группировать события при изменении текста
          * @protected
          * @return {Core/Deferred}
          */
         _needDebounceTextChanged: function () {
            var b = cConstants.browser;
            if (b.isMobileAndroid) {
               return Deferred.success(true);
            }
            if (!b.isWin10 || typeof TouchEvent === 'undefined') {
               return Deferred.success(false);
            }
            /*if (b.isWPMobilePlatform) {
               return Deferred.success(true);
            }*/
            var o = window.screen.orientation || window.screen.mozOrientation || window.screen.msOrientation;
            if (!(o && o.type && o.lock && o.unlock)) {
               return Deferred.success(false);
            }
            var promise = new Deferred();
            o.lock(o.type).then(
               function () {
                  o.unlock();
                  promise.callback(true);
               },
               function (ex) {
                  var msg = ex.message.toLowerCase();
                  promise.callback(false/*msg.indexOf('is not available') === -1 && msg.indexOf('is not supported') === -1*/);
               }
            );
            return promise;
         },

         /*БЛОК ПУБЛИЧНЫХ МЕТОДОВ*/

         /**
          * Добавить youtube видео
          * @param {String} link Ссылка на youtube видео.
          * @return {Boolean} Результат добавления видео (true - добавилось, false - не добавилось).
          * @example
          * Добавить в богатый редактор youtube видео по ссылке
          * <pre>
          *     richEditor.subscribe('onReady', function() {
         *        richEditor.addYouTubeVideo('http://www.youtube.com/watch?v=...');
         *     });
          * </pre>
          */
         addYouTubeVideo: function(link) {
            if (!(link && typeof link === 'string')) {
               return false;
            }
            var url = escapeTagsFromStr(link, []);
            var id = this._getYouTubeVideoId(url);
            if (id) {
               var _byRe = function (re) { var ms = url.match(re); return ms ? ms[1] : null; };
               var protocol = _byRe(/^(https?:)/i) || '';
               var timemark = _byRe(/\?(?:t|start)=([0-9]+)/i);
               this.insertHtml([
                  '<iframe',
                  ' width="' + constants.defaultYoutubeWidth + '"',
                  ' height="' + constants.defaultYoutubeHeight + '"',
                  ' style="min-width:' + constants.minYoutubeWidth + 'px; min-height:' + constants.minYoutubeHeight + 'px;"',
                  ' src="' + protocol + '//www.youtube.com/embed/' + id + (timemark ? '?start=' + timemark : '') + '"',
                  ' allowfullscreen',
                  ' frameborder="0" >',
                  '</iframe>'
               ].join(''));
               return true;
            }
            return false;
         },

         /**
          * JavaScript function to match (and return) the video Id
          * of any valid Youtube URL, given as input string.
          * @author: Stephan Schmitz <eyecatchup@gmail.com>
          * @url: http://stackoverflow.com/a/10315969/624466
          */
         _getYouTubeVideoId: function(link) {
            var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            return link.match(p) ? RegExp.$1 : false;
         },

         /**
          * Устанавливает минимальную высоту текстового поля редактора
          * @param {Number} value Минимальная высота поля редактора
          */
         setMinimalHeight: function (value) {
            this._setLimitingHeight('min', value);
         },

         /**
          * Устанавливает максимальную высоту текстового поля редактора
          * @param {Number} value Максимальная высота поля редактора
          */
         setMaximalHeight: function (value) {
            this._setLimitingHeight('max', value);
         },

         /**
          * Устанавливает максимальную или минимальную высоту текстового поля редактора
          * @param {string} type Тип значения: 'min' или 'max'
          * @param {number} value Значение максимальная или минимальная высота поля редактора
          */
         _setLimitingHeight: function (type, value) {
            var props = {'min':'minimalHeight', 'max':'maximalHeight'};
            if (props[type]) {
               var options = this._options;
               if (options.autoHeight && typeof value === 'number') {
                  options[props[type]] = value || '';
                  if (value) {
                     var pairProp = props[type === 'min' ? 'max' : 'min'];
                     if (options[pairProp] && options.maximalHeight < options.minimalHeight) {
                        options[pairProp] = value;
                     }

                  }
                  var isInline = options.editorConfig.inline;
                  var iFrame = isInline ? null : $(this._tinyEditor.iframeElement);
                  (isInline ? this._richTextAreaContainer : iFrame).css('max-height', options.maximalHeight || '');
                  (isInline ? this._richTextAreaScrollContainer : iFrame).css('max-height', options.maximalHeight || '');
                  (isInline ? this._inputControl : iFrame).css('min-height', options.minimalHeight || '');
               }
            }
         },

         /**
          * <wiTag group="Управление">
          * Добавить в текущую позицию указанный html-код
          * @param {String} html Добавляемый html
          * @example
          * Вставить цитату
          * <pre>
          *    tinyEditor.insertHtml('<blockquote>Текст цитаты</blockquote>');
          * </pre>
          */
         insertHtml: function(html) {
            if (typeof html === 'string' && this._tinyEditor) {
               this._performByReady(function() {
                  html = this._prepareContent(html);
                  // Если по любым причинам редактор пуст абсолютно - восстановить минимальный контент
                  // 1175088566 https://online.sbis.ru/opendoc.html?guid=5f7765c4-55e5-4e73-b7bd-3cd05c61d4e2
                  this._ensureHasMinContent();
                  var editor = this._tinyEditor;
                  var lastRng = this._tinyLastRng;
                  if (lastRng) {
                     // Если определён последний рэнж, значит вставка происходит в неактивный редактор или в отсутствии фокуса. Если текщий рэнж
                     // не соответствунет ему - используем последний.
                     // https://online.sbis.ru/opendoc.html?guid=e1e07406-30c3-493a-9cc0-b85ebdf055bd
                     // https://online.sbis.ru/opendoc.html?guid=49da7b60-c4d2-46c8-b1b7-db1eb86e4443
                     var rng = editor.selection.getRng();
                     if (rng.startContainer !== lastRng.startContainer || rng.startOffset !== lastRng.startOffset || rng.endContainer !== lastRng.endContainer || rng.endOffset !== lastRng.endOffset) {
                        editor.selection.setRng(lastRng);
                     }
                  }
                  editor.insertContent(html);
                  // Иногда в FF после вставки рэнж охватывает весь элемент редактора, а не находится внутри него - поставить курсор в конец
                  // в таком случае
                  // 1174769960 https://online.sbis.ru/opendoc.html?guid=268d5fe6-e038-40d3-b185-eff696796f12
                  // 1174769988 https://online.sbis.ru/opendoc.html?guid=5c37d724-1e7b-4627-afe6-257db37d4798
                  if (cConstants.browser.firefox) {
                     var rng = editor.selection.getRng();
                     var editorBody = editor.getBody();
                     if (rng.startContainer === editorBody && rng.endContainer === editorBody) {
                        this.setCursorToTheEnd();
                     }
                  }
                  //вставка контента может быть инициирована любым контролом,
                  //необходимо нотифицировать о появлении клавиатуры в любом случае
                  if (cConstants.browser.isMobilePlatform) {
                     this._notifyMobileInputFocus();
                  }
               }.bind(this));
            }
         },

         /**
          * Убедиться в том, что в редакторе наличествует хотя бы минимальный контент, если нет - восстановить минимальный контент
          * (Не все функции вставки и команд tiny работают нормально с абсолютно пустым редактором)
          */
         _ensureHasMinContent: function () {
            var editor = this._tinyEditor;
            var editorBody = editor.getBody();
            if (!editorBody.innerHTML) {
               editorBody.innerHTML = '<p></p>';
               this._selectNewRng(editorBody.firstChild, 0);
            }
         },

         /**
          * Возвращает минимальную высоту текстового поля редактора
          * @returns {Number}
          */
         getMinimalHeight: function() {
            if (this._options.autoHeight) {
               return this._options.minimalHeight;
            }
         },

         /**
          * Возвращает максимальную высоту текстового поля редактора
          * @returns {Number}
          */
         getMaximalHeight: function() {
            if (this._options.autoHeight) {
               return this._options.maximalHeight;
            }
         },

         /**
          * Устанавливает текстовое значение внутри поля ввода.
          * @param {String} text Текстовое значение, которое будет установлено в поле ввода.
          * @example
          * <pre>
          *     if (control.getText() == "Введите ФИО") {
          *        control.setText("");
          *     }
          * </pre>
          * @see text
          */
         setText: function(text) {
            if (text !== this._curValue()) {
               this._drawText(text);
            }
            this._setText(text);
         },

         setActive: function(active) {
            this._lastActive = active;
            if (active && this._needFocusOnActivated() && this.isEnabled()) {
               this._performByReady(function() {
                  //Активность могла поменяться пока грузится tinymce.js
                  if (this._lastActive) {
                     var noRng = !this._tinyLastRng;
                     this._tinyEditor.focus();
                     // Если сейчас есть контент и не было установлено осмысленного рэнжа - поставить курсор ввода в его конец
                     // 24823 https://online.sbis.ru/opendoc.html?guid=cd2659d7-0066-4207-bade-b77edb462684
                     // Но только, если редактор не был и до этого активным (повтроный вызов)
                     // 1174883097 https://online.sbis.ru/opendoc.html?guid=56ad4bd1-a74a-4694-98bf-8401938c144a
                     if (noRng && !this.isActive() && this.getText()) {
                        this.setCursorToTheEnd();
                     }
                     if (cConstants.browser.isMobileAndroid) {
                        // на android устройствах не происходит подскролла нативного
                        // наш функционал тестируется на планшете фирмы MI на котором клавиатура появляется долго ввиду анимации =>
                        // => сразу сделать подскролл нельзя
                        // появление клавиатуры стрельнет resize у window в этот момент можно осуществить подскролл до элемента ввода текста
                        var
                           resizeHandler = function(){
                              this._inputControl[0].scrollIntoView(false);
                              $(window).off('resize', resizeHandler);
                           }.bind(this);
                        $(window).on('resize', resizeHandler);
                     }
                     if (cConstants.browser.isMobilePlatform) {
                        this._notifyMobileInputFocus();
                     }
                  }
               }.bind(this));
            }
            else {
               if (!active) {
                  var editor = this._tinyEditor;
                  if (editor) {
                     var manager = editor.editorManager;
                     // Если компонент должен стать неактивным - нужно сбросить фокусированный редактор (Аналогично обработчику 'focusout' в TinyMCE в строке 40891)
                     if (manager && manager.focusedEditor === editor) {
                        manager.focusedEditor = null;
                     }
                  }
                  // Убрать FakeCarret в редакторе при переходе в не активное состояние
                  // 1174789437 https://online.sbis.ru/opendoc.html?guid=e21b8722-3ffa-4a47-a499-c8bd01af0985
                  this._removeTinyFakeCaret();
                  if (cConstants.browser.isMobilePlatform) {
                     EventBus.globalChannel().notify('MobileInputFocusOut');
                  }
               }
            }
            RichTextArea.superclass.setActive.apply(this, arguments);
         },

         destroy: function() {
            cConstants.$win.unbind('beforeunload', this._saveBeforeWindowClose);
            this.saveToHistory(this.getText());
            RichUtil.unmarkRichContentOnCopy(this._dataReview);
            RichUtil.unmarkRichContentOnCopy(this._inputControl);
            //Проблема утечки памяти через tinyMCE
            //Проверка на то созадвался ли tinyEditor
            if (this._tinyEditor && this._tinyReady.isReady()) {
               this._tinyEditor.destroy();
               if (this._tinyEditor.theme ) {
                  if (this._tinyEditor.theme.panel) {
                     this._tinyEditor.theme.panel._elmCache = null;
                     this._tinyEditor.theme.panel.$el = null;
                  }
                  this._tinyEditor.theme.panel = null;
               }
               for (var key in this._tinyEditor) {
                  if (this._tinyEditor.hasOwnProperty(key) && key !== 'removed') {
                     this._tinyEditor[key] = null;
                  }
               }
               this._tinyEditor.destroyed = true;
            }
            this._container.unbind('keydown keyup');
            this._sourceArea.unbind('input');
            this._tinyEditor = null;
            this._sourceContainer  = null;
            this._fakeArea = null;
            this._sourceArea = null;
            this._dataReview = null;
            this._options.editorConfig.setup = null;
            if (!this._readyControlDeffered.isReady()) {
               this._readyControlDeffered.errback();
            }
            this._inputControl.unbind('mouseup dblclick click mousedown touchstart scroll');
            if (this._imageOptionsPanel) {
               this._imageOptionsPanel.destroy();
            }
            RichTextArea.superclass.destroy.apply(this, arguments);
         },

         /**
          * Метод открывает диалог, позволяющий добавлять контент с учетом стилей
          * @param onAfterCloseHandler Функция, вызываемая после закрытия диалога
          * @param target объект рядом с которым будет позиционироваться  диалог если нотификатор отсутствует
          */
         pasteFromBufferWithStyles: function(onAfterCloseHandler, target, saveStyles) {
            var
               save = typeof saveStyles === 'undefined' ? true : saveStyles,
               self = this,
               dialog,
               eventResult,
               prepareAndInsertContent = function(content) {
                  //Вычищаем все ненужные теги, т.к. они в конечном счёте превращаютя в <p>
                  content = content.replace(new RegExp('<!--StartFragment-->|<!--EndFragment-->|<html>|<body>|</html>|</body>', 'img'), '').trim();
                  //получение результата из события  BeforePastePreProcess тини потому что оно возвращает контент чистым от тегов Ворда,
                  //withStyles: true нужно чтобы в нашем обработчике BeforePastePreProcess мы не обрабатывали а прокинули результат в обработчик тини
                  eventResult = self.getTinyEditor().fire('PastePreProcess', {content: content, withStyles: true});
                  self.insertHtml(eventResult.content);
                  self._updateTextByTiny();
               },
               onPaste = function(event) {
                  var content = event.clipboardData.getData ? event.clipboardData.getData('text/html') : '';
                  if (!content || !save) {
                     content = event.clipboardData.getData ? event.clipboardData.getData('text/plain') : window.clipboardData.getData('Text');
                     content.replace('data-ws-is-rich-text="true"', '');
                  }
                  prepareAndInsertContent(content);
                  dialog.close();
                  onClose();
                  event.stopPropagation();
                  event.preventDefault();
                  return false;
               },
               onClose = function () {
                  document.removeEventListener('paste', onPaste, true);
                  if (typeof onAfterCloseHandler === 'function') {
                     onAfterCloseHandler();
                  }
               },
               service = {
                  destroy: function(){}
               },
               createDialog = function() {
                  cIndicator.hide();
                  require(['SBIS3.CONTROLS/Utils/InformationPopupManager'], function (InformationPopupManager) {
                     document.addEventListener('paste', onPaste, true);
                     dialog = InformationPopupManager.showMessageDialog({
                           className: 'controls-RichEditor__pasteWithStyles-alert',
                           message: save ? rk('Не закрывая это окно нажмите CTRL + V для вставки текста из буфера обмена с сохранением стилей') : rk('Не закрывая это окно нажмите CTRL + V для вставки текста из буфера обмена без сохранения стилей'),
                           details: null,
                           submitButton: {caption:rk('Отменить')},
                           isModal: true,
                           closeByExternalClick: true,
                           opener: self
                        },
                        onClose
                     );
                  });
                  service.destroy();
               };

            cIndicator.show();
            if (Di.isRegistered('SBIS3.Plugin/Source/LocalService')) {
               //service создаётся каждый раз и destroy`тся каждый раз тк плагин может перезагрузиться и сервис протухнет
               //см прохождение по задаче:https://inside.tensor.ru/opendoc.html?guid=c3362ff8-4a31-4caf-a284-c0832c4ac4d5&des=
               service = Di.resolve('SBIS3.Plugin/Source/LocalService',{
                  endpoint: {
                     address: 'Clipboard-1.0.1.0',
                     contract: 'Clipboard'
                  },
                  options: { mode: 'silent' }
               });
               service.isReady().addCallback(function() {
                  service.call("getContentType", {}).addCallback(function (ContentType) {
                     service.call((ContentType === 'Text/Html' || ContentType === 'Text/Rtf' || ContentType === 'Html' || ContentType === 'Rtf') && save ? 'getHtml' : 'getText', {}).addCallback(function (content) {
                        cIndicator.hide();
                        prepareAndInsertContent(content);
                        if (typeof onAfterCloseHandler === 'function') {
                           onAfterCloseHandler();
                        }
                        service.destroy();
                     }).addErrback(function () {
                        createDialog();
                     });
                  }).addErrback(function () {
                     createDialog();
                  });
               }).addErrback(function () {
                  createDialog();
               });
            } else {
               createDialog();
            }
         },
         /**
          * <wiTag group="Управление">
          * Сохранить в историю.
          * Сохраняет на бизнес логику, в пользовательский конфиг, строку прявязывая её к имени контрола.
          * В памяти истории может хранится до 10 значений.
          * @param valParam {String} строковое значение
          * @see userItems
          * @public
          */
         saveToHistory: function(valParam) {
            var
               self = this,
               isDublicate = false;
            if (valParam && typeof valParam === 'string' && self._textChanged && self._options.saveHistory && this._lastSavedText !== valParam) {
               this._lastSavedText = valParam;
               this.getHistory().addCallback(function(arrBL){
                  arrBL.forEach(function (valBL) {
                     if (valParam === valBL) {
                        isDublicate = true;
                     }
                  });
                  if (!isDublicate) {
                     self._addToHistory(valParam);
                  }
               });
            }
         },

         /**
          * <wiTag group="Управление">
          * Получить историю ввода.
          * Вовзращает деферред истории ввода вводимых значений.
          * @return {Deferred} в случае успеха, дефферед врнет массив данных
          * @example
          * <pre>
          *    fre.getHistory().addCallback(function(arrBL){
          *       var historyData = Array();
          *       $ws.helpers.forEach(arrBL, function(valBL, keyBL){
          *          historyData.push({key: keyBL, value: valBL});
          *          FieldDropdown.setData(historyData);
          *       });
          *    }).addErrback(function(){
          *       $ws.helpers.alert('Не данных!');
          *    });
          * </pre>
          * @see saveToHistory
          * @public
          */
         getHistory: function() {
            return UserConfig.getParamValues(this._getNameForHistory()).addCallback(function(arrBL) {
               if( typeof arrBL  === 'string') {
                  arrBL = [arrBL];
               }
               arrBL.forEach(function(text,index) {
                  arrBL[index] = this._replaceCodesToSmile(text);
               }, this);
               return arrBL;
            }.bind(this))
         },

         /**
          * Почистить выделение от <br data-mce-bogus="1">
          * @private
          */
         _clearBrDataMceBogus: function () {
            //TinyMCE использует для определения положения каретки(курсора ввода) <br data-mce-bogus="1">.
            //При смене формата содаётся новый <span class='classFormat'>.
            //В FF в некторых случаях символ каретки(курсора ввода) не удаляется из предыдущего <span> блока при смене формата
            //из за-чего происход разрыв строки.
            $(this._tinyEditor.selection.getNode()).find('br[data-mce-bogus="1"]').remove();
         },

         /**
          * Установить стиль для выделенного текста
          * @param {Object} style Объект, содержащий устанавливаемый стиль текста
          * @public
          */
         setFontStyle: function(style) {
            if (cConstants.browser.firefox) {
               this._clearBrDataMceBogus();
            }
            //Удаление текущего форматирования под курсором перед установкой определенного стиля
            ['fontsize', 'forecolor', 'bold', 'italic', 'underline', 'strikethrough'].forEach(function(stl){
               this._removeFormat(stl);
            }, this);
            for (var stl in constants.styles) {
               if (style !== stl) {
                  this._removeFormat(stl);
               }
            }
            if (style !== 'mainText') {
               this._applyFormat(style, true);
            }
            this._tinyEditor.execCommand('');
            //при установке стиля(через форматтер) не стреляет change
            this._updateTextByTiny();
         },

         /**
          * Установить цвет для выделенного текста
          * @param {Object} color Объект, содержащий устанавливаемый цвет текста
          * @public
          */
         setFontColor: function(color) {
            this._applyFormat('forecolor', color);
            this._tinyEditor.execCommand('');
            //при установке стиля(через форматтер) не стреляет change
            this._updateTextByTiny();
         },

         /**
          * Установить размер для выделенного текста
          * @param {number} size Устанавливаемый размер текста
          * @public
          */
         setFontSize: function (size) {
            // TODO: Использоватиь здесь _setFontSize
            //необходимо удалять текущий формат(размер шрифта) чтобы правльно создавались span
            this._removeFormat('fontsize');
            if (size) {
               this._tinyEditor.execCommand('FontSize', false,  size + 'px');
            }
            this._tinyEditor.execCommand('');
            //при установке стиля(через форматтер) не стреляет change
            this._updateTextByTiny();
         },

         /**
          * Установить размер для выделенного текста
          * @param {Object} size Устанавливаемый размер текста
          * @protected
          */
         _setFontSize: function (size) {
            // Это "чистая" реализация, здесь не должно быть НИКАКИХ дополнительных манипуляций с рэнжем, фокусом, фиксацией значения компоненты и так далее!
            var editor = this._tinyEditor;
            if (editor) {
               //необходимо удалять текущий формат(размер шрифта) чтобы правльно создавались span
               editor.formatter.remove('fontsize', {value: undefined}, null, true);
               if (size) {
                  editor.execCommand('FontSize', false,  size + 'px');
               }
            }
         },

         /**
          * Получить свойства форматирования текущего выделения
          * @param {Array<string>} [properties] Список имён запрашиваемых свойств форматирования. Если не указан, буду возвращены все свойства (опционально)
          * @return {object}
          */
         getCurrentFormats: function (properties) {
            var node = this._getCurrentFormatNode();
            if (node) {
               return this._getNodeFormats(node, properties);
            }
         },

         /**
          * Получить свойства форматирования по-умолчанию - определяется по свойствам форматирования контейнера редактора, (то, как видно в редакторе без форматирования)
          * @return {object}
          */
         getDefaultFormats: function () {
            if (!this._defaultFormats) {
               this._defaultFormats = this._getNodeFormats(this._inputControl, ['fontsize', 'color']);
            }
            return this._defaultFormats;
         },

         _getCurrentFormatNode: function () {
            var editor = this._tinyEditor;
            if (editor) {
               var rng = editor.selection.getRng();
               var node = rng.startContainer;
               return node.nodeType === 3 ? node.parentNode : node;
            }
         },

         _getNodeFormats: function (node, properties) {
            var editor = this._tinyEditor;
            if (editor) {
               if (!properties || !properties.length) {
                  properties = ['fontsize', 'color', 'bold', 'italic', 'underline', 'strikethrough'];
               }
               var formats = {};
               var $node;
               var selectors;
               for (var i = 0; i < properties.length; i++) {
                  var prop = properties[i];
                  if (prop === 'fontsize') {
                     formats[prop] = +editor.dom.getStyle(node, 'font-size', true).replace('px', '');//^^^+$node.css('font-size').replace('px', '')
                  }
                  else
                  if (prop === 'color') {
                     var color = editor.dom.getStyle(node, 'color', true);//^^^$node.css('color')
                     formats[prop] = constants.colorsMap[color] || color;
                  }
                  else {
                     if (!selectors) {
                        selectors = {
                           'bold': 'strong',
                           'italic': 'em',
                           'underline': 'span[style*="decoration: underline"]',
                           'strikethrough': 'span[style*="decoration: line-through"]'
                        };
                     }
                     var selector = selectors[prop];
                     if (selector) {
                        if (!$node) {
                           $node = $(node);
                        }
                        formats[prop] = !!$node.closest(selector).length;
                     }
                  }
               }
            }
            return formats;

         },

         /**
          * Применить свойства форматирования к текущему выделению
          * @public
          * @param {object} formats Свойства форматирования
          */
         applyFormats: function (formats) {
            // Отбросить все свойства форматирования, тождественные форматированию по-умолчанию
            var editor = this._tinyEditor;
            if (!editor) {
               return;
            }
            var defaults = this._getNodeFormats(this._getCurrentFormatNode().parentNode, ['fontsize', 'color']);
            for (var prop in defaults) {
               if (prop in formats && formats[prop] ==/* Не "==="! */ defaults[prop]) {
                  delete formats[prop];
               }
            }
            if (cConstants.browser.firefox) {
               this._clearBrDataMceBogus();
            }
            // Применить новое форматирование
            if (formats.id) {
               this.setFontStyle(formats.id);
            }
            else {
               var formatter = editor.formatter;
               for (var i = 0, names = ['title', 'subTitle', 'additionalText', 'forecolor']; i < names.length; i++) {
                  formatter.remove(names[i], {value: undefined}, null, true);
               }
               var sameFont = formats.fontsize && formats.fontsize === this.getCurrentFormats(['fontsize']).fontsize;
               //необходимо сначала ставить размер шрифта, тк это сбивает каретку
               if (!sameFont) {
                  this._setFontSize(formats.fontsize);
               }
               var hasOther;
               for (var i = 0, names = ['bold', 'italic', 'underline', 'strikethrough']; i < names.length; i++) {
                  var name = names[i];
                  if (name in formats) {
                     if (formats[name] !== formatter.match(name)) {
                        editor.execCommand(name);
                     }
                     hasOther = formats[name] || hasOther;
                  }
               }
               if (formats.color) {
                  var currentColor = this.getCurrentFormats(['color']).color;
                  if (formats.color !== currentColor) {
                     formatter.apply('forecolor', {value: formats.color});
                     hasOther = true;
                  }
               }
               if (sameFont && !hasOther) {
                  // Если указан тот же размер шрифта (и это не размер по умолчанию), и нет других изменений - нужно чтобы были правильно
                  // созданы окружающие span-ы (например https://online.sbis.ru/opendoc.html?guid=5f4b9308-ec3e-49b7-934c-d64deaf556dc)
                  // в настоящий момент работает и без этого кода, но если не будет работать, но нужно использовать modify, т.к. expand помечен deprecated.
                  //this._tinyEditor.selection.getSel().modify();//.getRng().expand()
                  this._setFontSize(formats.fontsize);
               }
               this._updateTextByTiny();
            }
         },

         /**
          * Получить экземпляр редактора tinyMCE
          */
         getTinyEditor: function() {
            return this._tinyEditor;
         },

         /**
          * <wiTag group="Управление">
          * Вставить смайл.
          * Вставляет смайл по его строковому соответствию^
          * <ul>
          *    <li>Smile - улыбка;</li>
          *    <li>Nerd - умник;</li>
          *    <li>Angry - злой;</li>
          *    <li>Annoyed - раздраженный;</li>
          *    <li>Blind - слепой;</li>
          *    <li>Cool - крутой;</li>
          *    <li>Cry - плачет;</li>
          *    <li>Devil - дьявол;</li>
          *    <li>Dumb - тупица;</li>
          *    <li>Inlove - влюблен;</li>
          *    <li>Kiss - поцелуй;</li>
          *    <li>Laugh - смеётся;</li>
          *    <li>Money - алчный;</li>
          *    <li>Neutral - нейтральный;</li>
          *    <li>Puzzled - недоумевает;</li>
          *    <li>Rofl - подстолом;</li>
          *    <li>Sad - расстроен;</li>
          *    <li>Shocked - шокирован;</li>
          *    <li>Snooze - дремлет;</li>
          *    <li>Tongue - дразнит;</li>
          *    <li>Wink - подмигивает;</li>
          *    <li>Yawn - зевает;</li>
          * </ul>
          * @public
          * @example
          * <pre>
          *    fre.insertSmile('Angry')
          * </pre>
          * @param {String} smile название смайла
          */
         insertSmile: function(smile) {
            //Если редактор не был активным контролом необходимо вначале проставить активность
            //поле связи если было активно при потере фокуса дестроит содержимое саггеста
            //если в нем был какой либо контрол, то он вызывает onBringToFront, который в свою очередь вернет фокус в поле связи
            //после чего смайл вставится в поле связи
            if (!this.isActive()) {
               this.setActive(true);
            }
            if (typeof smile === 'string') {
               smiles.forEach(function(obj) {
                  if (obj.key === smile) {
                     smile = obj;
                     return false;
                  }
               });
               if (typeof smile === 'object') {
                  this.insertHtml(this._smileHtml(smile));
               }
            }
         },

         /**
          * <wiTag group="Управление">
          * Выполнить команду.
          * @param {String} command передаваемая в качестве строки команда
          * @example
          * <pre>
          *    fre.setValue('Случайно написал эту фразу');
          *    fre.execCommand('undo'); // отменить последнее действие
          * </pre>
          * @public
          */
         execCommand: function (command) {
            var editor = this._tinyEditor;
            var selection = editor.selection;
            var isBlockquote = command === 'blockquote';
            var isListNode = !isBlockquote && (command === 'InsertOrderedList' || command === 'InsertUnorderedList');
            var afterProcess;
            var execCmd;
            if (isBlockquote) {
               execCmd = 'mceBlockQuote';
            }
            // Если по любым причинам редактор пуст абсолютно - восстановить минимальный контент
            // 1175088566 https://online.sbis.ru/opendoc.html?guid=5f7765c4-55e5-4e73-b7bd-3cd05c61d4e2
            this._ensureHasMinContent();
            var isAlreadyApplied = editor.formatter.match(command);
            var rng = selection.getRng();
            var isBlockquoteOfList;
            if (isBlockquote) {
               // При обёртывании списков в блок цитат каждый элемент списка оборачивается отдельно. Во избежание этого сделать список временно нередактируемым
               // 1174914305 https://online.sbis.ru/opendoc.html?guid=305e5cb1-8b37-49ea-917d-403f746d1dfe
               var listNode = rng.commonAncestorContainer;
               isBlockquoteOfList = ['OL', 'UL'].indexOf(listNode.nodeName) !== -1;
               if (isBlockquoteOfList) {
                  var $listNode = $(listNode);
                  $listNode.wrap('<div>');
                  selection.select(listNode.parentNode, false);
                  $listNode.attr('contenteditable', 'false');
                  afterProcess = function () {
                     $listNode.unwrap();
                     $listNode.removeAttr('contenteditable');
                     selection.select(listNode, true);
                  };
               }
            }
            if ((isListNode || (isBlockquote && !isBlockquoteOfList)) && !isAlreadyApplied) {
               var node = rng.startContainer;
               if (rng.endContainer === node) {
                  if (node.nodeType === 3 && node.previousSibling && node.previousSibling.nodeType === 1) {
                     var startOffset = rng.startOffset;
                     var endOffset = rng.endOffset;
                     editor.dom.split(node.parentNode, node);
                     this._selectNewRng(node, startOffset, node, endOffset);
                  }
                  else
                  // FF иногда "поднимает" рэнж выше по дереву
                  // 1174769960 https://online.sbis.ru/opendoc.html?guid=268d5fe6-e038-40d3-b185-eff696796f12
                  // 1174815941 https://online.sbis.ru/opendoc.html?guid=07157c2e-94d5-4ba3-bb7a-1833708ce0aa
                  if (cConstants.browser.firefox && node.nodeType === 1 && rng.collapsed && !editor.dom.isEmpty(node)) {
                     var newNode = editor.dom.create(node.nodeName);
                     newNode.innerHTML = '<br data-mce-bogus="1" />';
                     node.parentNode.insertBefore(newNode, node.nextSibling);
                     selection.select(newNode, true);
                  }
               }
            }
            editor.execCommand(execCmd || command);
            if (afterProcess) {
               afterProcess();
            }
            //TODO:https://github.com/tinymce/tinymce/issues/3104, восстанавливаю выделение тк оно теряется если после нжатия кнопки назад редактор стал пустым
            if ((cConstants.browser.firefox || cConstants.browser.isIE) && command == 'undo' && this._getTinyEditorValue() == '') {
               selection.select(editor.getBody(), true);
            }
         },

         /**
          * Метод открывает диалог, позволяющий вставить ссылку
          * @param onAfterCloseHandler Функция, вызываемая после закрытия диалога
          * @param target объект рядом с которым будет позиционироваться  диалог вставки ссылки
          */
         insertLink: function(onAfterCloseHandler, target) {
            //TODO: переписать этот метод на отдельный компонент
            var
               editor = this._tinyEditor,
               selection = editor.selection,
               range = coreClone(selection.getRng()),
               element = selection.getNode(),
               anchor = editor.dom.getParent(element, 'a[href]'),
               origHref = anchor ? editor.dom.getAttrib(anchor, 'href') : '',
               origCaption = selection.getContent({format:'text'}),//anchor ? anchor.innerText : ''
               fre = this,
               context = cContext.createContext(this),
               dialogWidth = 440;
            require(['Lib/Control/Dialog/Dialog', 'Deprecated/Controls/FieldString/FieldString', 'SBIS3.CONTROLS/Button'], function(Dialog, FieldString, Button) {
               new Dialog({
                  title: rk('Web-ссылка'),
                  disableActions: true,
                  resizable: false,
                  width: dialogWidth,
                  height: 80,
                  autoHeight: false,
                  keepSize: false,
                  opener: fre,
                  context: context,
                  top: target && target.offset().top + target.height() - $(window).scrollTop(),
                  left: target && target.offset().left - (dialogWidth - target.width()),
                  handlers: {
                     onReady: function () {
                        var
                           self = this,
                           okButton = $('<div class="controls-RichEditor__InsertLink__okButton"></div>'),
                           hrefLabel = $('<div class="controls-RichEditor__InsertLink__label controls-RichEditor__InsertLink__hrefLabel">' + rk('Адрес') + '</div>'),
                           hrefInput = $('<div class="controls-RichEditor__InsertLink__input controls-RichEditor__InsertLink__hrefInput"></div>'),
                           captionLabel = $('<div class="controls-RichEditor__InsertLink__label controls-RichEditor__InsertLink__captionLabel">' + rk('Название') + '</div>'),
                           captionInput = $('<div class="controls-RichEditor__InsertLink__input controls-RichEditor__InsertLink__captionInput"></div>'),
                           linkAttrs = {
                              target: '_blank',
                              rel: null,
                              'class': null,
                              title: null
                           };
                        this.getContainer()
                           .append(hrefLabel)
                           .append(hrefInput)
                           .append(captionLabel)
                           .append(captionInput);
                        //TODO: перевечсти поле ввода на SBIS3.CONTROLS.TextBoxтк в нём нет доскрола при активации
                        this._hrefInput = new FieldString({
                           value: origHref,
                           parent: this,
                           element: hrefInput,
                           linkedContext: context,
                           name: 'RichEditor__InsertLink__href'
                        });
                        this._captionInput = new FieldString({
                           value: origCaption,
                           parent: this,
                           element: captionInput,
                           linkedContext: context,
                           name: 'RichEditor__InsertLink__caption'
                        });
                        var handler = function(e) {
                           if (e.which == cConstants.key.enter) {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                           }
                        };
                        this._hrefInput.getContainer().on('keydown', handler);
                        this._captionInput.getContainer().on('keydown', handler);
                        this._titleBar
                           .prepend($('<a href="javascript:void(0)"></a>')
                              .addClass('ws-float-close ws-float-close-right')
                              .click(function () {
                                 self.close();
                                 return false;
                              }))
                           .append(okButton);
                        new Button({
                           caption: rk('Сохранить'),
                           primary: true,
                           parent: this,
                           handlers: {
                              onActivated: function () {
                                 var parent = this.getParent();
                                 var href = parent._hrefInput.getValue();
                                 var caption = parent._captionInput.getValue() || href;
                                 var protocol = /(?:https?|ftp|file):\/\//gi;
                                 if (href && href.search(protocol) === -1) {
                                    href = 'http://' + href;
                                 }
                                 var dom = editor.dom;
                                 var done;
                                 if (element && element.nodeName === 'A' && element.className.indexOf('ws-focus-out') < 0) {
                                    if (href) {
                                       dom.setAttribs(element, {
                                          target: '_blank',
                                          href: escapeHtml(href)
                                       });
                                       element.innerHTML = escapeHtml(caption);
                                       selection.select(element);
                                    }
                                    else {
                                       editor.execCommand('unlink');
                                    }
                                    done = true;
                                 }
                                 else
                                 if (href) {
                                    linkAttrs.href = href;
                                    selection.setRng(range);
                                    var content = selection.getContent();
                                    if (content === '' || (BROWSER.firefox && (content.indexOf('<') === -1 || (content.indexOf('href=') !== -1 && /^<a [^>]+>[^<]+<\/a>$/.test(content))))) {
                                       var linkHtml = dom.createHTML('a', linkAttrs, dom.encode(caption));
                                       // Для MSIE и FF принудительно смещаем курсор ввода после вставленной ссылки
                                       // 1174853380 https://online.sbis.ru/opendoc.html?guid=77405679-2b2b-42d3-8bc0-d2eee745ea23
                                       // 1175114814 https://online.sbis.ru/opendoc.html?guid=4cef3009-ccbc-4751-b755-dea3d69b82f1
                                       var appendix = BROWSER.isIE ? '&#65279;&#8203;' : (BROWSER.firefox ? '&#65279;' : '');
                                       editor.insertContent(linkHtml + appendix);
                                       if (!appendix) {
                                          selection.select(selection.getNode().querySelector('a'), true);
                                       }
                                       selection.collapse(false);
                                    }
                                    else {
                                       if (origCaption !== caption) {
                                          selection.setContent(caption);
                                          var rng = selection.getRng();
                                          fre._selectNewRng(range.startContainer, range.startOffset, rng.endContainer, rng.endOffset);
                                       }
                                       editor.execCommand('mceInsertLink', false, linkAttrs);
                                       selection.collapse(false);
                                       if (cConstants.browser.firefox) {
                                          // В firefox каретка(курсор ввода) остаётся (и просачивается) внутрь элемента A, нужно принудительно вывести её наружу, поэтому:
                                          var r = editor.selection.getRng();
                                          var a = r.endContainer;
                                          for (; a && a.nodeName !== 'A'; a = a.parentNode) {}
                                          if (a) {
                                             editor.selection.select(a);
                                             editor.selection.collapse(false);
                                             fre.insertHtml('&#65279;');
                                             editor.selection.setRng(r);
                                          }
                                       }
                                    }
                                    done = true;
                                 }
                                 if (done) {
                                    self._tinyLastRng = selection.getRng();
                                    editor.undoManager.add();
                                 }
                                 self.close();
                              }
                           },
                           element: okButton
                        });

                     },
                     onAfterShow: function(){
                        if (cConstants.browser.isMobileIOS) {
                           //финт ушами, тк фокус с редактора убрать никак нельзя
                           //тк кнопки на которую нажали у нас в обработчике тоже нет
                           //ставим фокус на любой блок внутри нового диалогового окна, например на контейнер кнопки
                           this._hrefInput.getContainer().focus(); //убираем фокус с редактора
                           $('.controls-RichEditor__InsertLink__okButton').focus();//убираем клавиатуру
                        }
                     },
                     onAfterClose: function() {
                        if (typeof onAfterCloseHandler === 'function') {
                           onAfterCloseHandler();
                        }
                     }
                  }
               });
            });
         },

         /**
          * Установить курсор в конец контента.
          */
         setCursorToTheEnd: function() {
            var editor = this._tinyEditor;
            // Устанавливать курсор только если редактор активен (чтобы не забирать фокус)
            // 1174789546 https://online.sbis.ru/opendoc.html?guid=9675e20f-5a90-4a34-b6be-e24805813bb9
            if (editor && this.isActive() && !this._sourceContainerIsActive()) {
               var nodeForSelect = editor.getBody();
               // But firefox places the selection outside of that tag, so we need to go one level deeper:
               if (editor.isGecko) {
                  var root = editor.dom.getRoot();
                  nodeForSelect = root.childNodes[root.childNodes.length - 1];
                  nodeForSelect = nodeForSelect.childNodes[nodeForSelect.childNodes.length - 1];
               }
               editor.selection.select(nodeForSelect, true);
               editor.selection.collapse(false);
               // Убран фрагмент кода ниже ввиду ошибки
               // 93052 https://online.sbis.ru/opendoc.html?guid=05634433-2fda-4960-b75c-f252d3df4d28
               //code from tinyMCE.init method
               /*try {
                  editor.lastRng = editor.selection.getRng();
               } catch (ex) {
                  // IE throws "Unexcpected call to method or property access" some times so lets ignore it
               }*/
            }
         },

         /**
          * Возвращает контейнер, используемый компонентом для ввода данных
          * @returns {*|jQuery|HTMLElement}
          * @deprecated
          */
         //TODO:придумать дургое решение: https://inside.tensor.ru/opendoc.html?guid=c7676fdd-b4de-4ac6-95f5-ab28d4816c27&description=
         getInputContainer: function() {
            return this._inputControl;
         },


         // Переключение пользовательского формата у блока
         toggleStyle: function(style) {
            //Проверяем наличие фокуса на редакторе и если его там нет, то ставим его на него
            //https://online.sbis.ru/opendoc.html?guid=80c4825a-91f6-4d7d-b377-2b788df94439
            if (!this.isActive()) {
               this.setActive(true);
            }
            this._tinyEditor.formatter.toggle(style);
         },

         /**
          * Установить выравнивание текста для активной строки
          * @param {String} align Устанавливаемое выравнивание
          * @private
          */
         setTextAlign: function(align) {
            //TODO: перейти на  this.execCommand('JustifyRight'), http://archive.tinymce.com/wiki.php/Tutorials:Command_identifiers
            var
            // выбираем ноду из выделения
               $selectionContent = $(this._tinyEditor.selection.getNode()),
            // ищем в ней списки
               $list = $selectionContent.find('ol,ul');
            if (!$list.length) {
               // если списков не нашлось внутри, может нода и есть сам список
               $list = $selectionContent.closest('ol,ul');
            }
            if ($list.length) {
               // для того чтобы список выравнивался вместе с маркерами нужно проставлять ему
               // свойство list-style-position: inline, и, также, убирать его при возврате назад,
               // так как это влечет к дополнительным отступам
               $list.css('list-style-position', align === 'alignjustify' || align === 'alignleft' ? '' : 'inside');
            }
            this._tinyEditor.formatter.apply(align, true);
            //если смена стиля будет сразу после setValue то контент не установится,
            //так как через форматттер не стреляет change
            this._updateTextByTiny();
         },

         toggleContentSource: function(visible) {
            var
               sourceVisible = visible !== undefined ? !!visible : this._sourceContainer.hasClass('ws-hidden'),
               container = this._tinyEditor.getContainer() ? $(this._tinyEditor.getContainer()) : this._inputControl,
               focusContainer = sourceVisible ? this._sourceArea : container,
               focusElement = focusContainer[0],
               range;
            if (sourceVisible) {
               this._sourceArea.css('min-height', this._scrollContainer.height());
               this._sourceArea.val(this.getText());
            }
            this._sourceContainer.toggleClass('ws-hidden', !sourceVisible);
            container.toggleClass('ws-hidden', sourceVisible);
            this._notify('onToggleContentSource', sourceVisible);
            //установка фокуса в поле ввода на которое происходит переключение
            focusContainer.focus();
            if (typeof focusElement.selectionStart == "number") {
                 focusElement.selectionStart = focusElement.selectionEnd = focusElement.value.length;
             } else if (typeof focusElement.createTextRange != "undefined") {
                 range = focusElement.createTextRange();
                 range.collapse(false);
                 range.select();
             }
         },

         insertImageTemplate: function(key, fileobj) {
            //необходимо вставлять каретку(курсор ввода), чтобы пользователь понимал куда будет производиться ввод
            var browser = cConstants.browser;
            var CARET = browser.chrome || browser.isIE || browser.safari || browser.isMobileIOS /*|| browser.firefox*/ ? '&#xFEFF;{$caret}' : '{$caret}';
            var className, before, after;
            switch (key) {
               case '1':
                  className = 'image-template-left';
                  after = CARET;
                  break;
               case '2':
                  before = '<p class="controls-RichEditor__noneditable image-template-center">';
                  after = '</p>' + CARET;
                  break;
               case '3':
                  className = 'image-template-right';
                  after = CARET;
                  break;
               case '6':
                  after = CARET;
                  break;
               case '4':
                  //todo: сделать коллаж
               default:
                  // Неизвестный тип
                  return;
            }
            var size = constants.defaultImagePercentSize;
            this._startWaitIndicator(rk('Загрузка изображения...'), 1000);
            this._makeImgPreviewerUrl(fileobj, size, null, false).addCallback(function (urls) {
               var uuid = fileobj.id;
               if (uuid) {
                  this._images[uuid] = false;
               }
               this._insertImg(urls, size + '%', null, className, null, before, after, uuid)
                  .addBoth(this._stopWaitIndicator.bind(this));
            }.bind(this));
         },
         codeSample: function(text, language) {
            if (this._beforeFocusOutRng) {
               this._tinyEditor.selection.setRng(this._beforeFocusOutRng);
            }
            var
               wasClear = !this._tinyEditor.plugins.codesample.getCurrentCode(this._tinyEditor);
            this._tinyEditor.plugins.codesample.insertCodeSample( this._tinyEditor, language, text);
            if (wasClear) {
               this._tinyEditor.selection.collapse();
               this.insertHtml('<p>{$caret}</p>')
            }
            this._beforeFocusOutRng = false;
         },
         getCodeSampleDialog: function(){
            var
               self = this;
            if (!this._codeSampleDialog) {
               this._codeSampleDialog = new CodeSampleDialog({
                  parent: this,
                  element: $('<div></div>')
               });
               this._codeSampleDialog.subscribe('onApply', function(event, text, language) {
                  self.codeSample(text, language);
               })
            }
            return this._codeSampleDialog;
         },
         showCodeSample: function() {
            var
               editor = this._tinyEditor,
               codeDialog = this.getCodeSampleDialog();
               this._beforeFocusOutRng = editor.selection.getRng(); // необходимо запоминать выделение пред открытием ддиалога, тк оно собьется при переходе в textarea
            codeDialog.setText(editor.plugins.codesample.getCurrentCode(editor) || '');
            codeDialog.show();
         },
         getImages: function() {
            return this._fillImages(true);
         },
         /*БЛОК ПУБЛИЧНЫХ МЕТОДОВ*/

         /*БЛОК ПРИВАТНЫХ МЕТОДОВ*/
         _updateTextByTiny: function () {
            // Только если редактор уже есть и уже готов
            // 1174825882 https://online.sbis.ru/opendoc.html?guid=f5b2e544-7960-45f3-b32e-082bbe50f52c
            if (this._tinyEditor && this._tinyEditor.initialized && this.isEnabled()) {
               this._setTrimmedText(this._getTinyEditorValue());
            }
         },

         _setTrimmedText: function(text) {
            this._setText(this._trimText(text));
         },

         _setText: function(text) {
            if (text !== this.getText()) {
               if (!this._isEmptyValue(text)) {
                  this._textChanged = true;
               }
               this._options.text = text;
               this._notify('onTextChange', text);
               this._notifyTextChanged();
               this._updateDataReview(text);
               this.clearMark();
            }
            //При нажатии enter передаётся trimmedText поэтому updateHeight text === this.getText() и updateHeight не зовётся
            this._updateHeight();
            this._togglePlaceholder(text);
         },
         _notifyTextChanged: function() {
            this._notifyOnPropertyChanged('text');
         },
         _showImagePropertiesDialog: function(target) {
            var
               $image = $(target),
               editor = this._tinyEditor,
               $scrollParent = this._inputControl.parent(),
               scrollTop = $scrollParent.scrollTop(),
               self = this;
            require(['Lib/Control/Dialog/Dialog'], function(Dialog) {
               new Dialog({
                  name: 'imagePropertiesDialog',
                  template: 'SBIS3.CONTROLS/RichEditor/Components/ImagePropertiesDialog',
                  parent: self,
                  componentOptions: {
                     selectedImage: $image,
                     editorWidth: self._inputControl.width()
                  },
                  handlers: {
                     onBeforeShow: function () {
                        CommandDispatcher.declareCommand(this, 'saveImage', function () {
                           var promise = self._changeImgSize($image, this.getChildControlByName('imageWidth').getValue(), this.getChildControlByName('imageHeight').getValue(), this.getChildControlByName('valueType').getValue() !== 'per');
                           promise.addCallback(function () {
                              setTimeout(function () {
                                 // После изменения размера слетает выделение - установить курсор ввода сразу после изображения
                                 // 1174814497 https://online.sbis.ru/opendoc.html?guid=8089187f-3917-4ae4-97ab-9dcd6a30b5ef
                                 var node = $image[0];
                                 if (node.parentNode.classList.contains('image-template-center')) {
                                    node = node.parentNode;
                                 }
                                 var next = node.nextSibling;
                                 self._selectNewRng(next, next && next.nodeType === 3 && next.nodeValue.length && next.nodeValue.charCodeAt(0) === 65279 ? 1 : 0);
                                 if (scrollTop) {
                                    $scrollParent.scrollTop(scrollTop);
                                 }
                                 else {
                                    // В прцессе изменения размера открываются и закрываются два окна, в результате активность уходит на floatArea,
                                    // что приведёт к прокрутке в редакторе. Поэтому, нужно как-то возвращать изображение в область видвимости
                                    // 1174814497 https://online.sbis.ru/opendoc.html?guid=8089187f-3917-4ae4-97ab-9dcd6a30b5ef
                                    node.scrollIntoView(true);
                                 }
                              }, 1);
                           });
                           editor.undoManager.add();
                        }.bind(this));
                     },
                     onAfterShow: function () {
                        self._notify('onImagePropertiesDialogOpen');
                     }
                  }
               });
            });
         },

         _changeImgSize: function ($img, width, height, isPixels) {
            var size = {width:'', height:''};
            var css = [];
            if (0 < width) {
               if (!isPixels && width > 100) {
                  size.width = '100%';
               } else {
                  size.width = width + (isPixels ? 'px' : '%');
               }
               css.push('width:' + size.width);
            }
            //не проставляем высоту если процентые размеры
            if (0 < height && isPixels) {
               size.height = height + 'px';
               css.push('height:' + size.height);
            }
            $img.css(size);
            $img.attr('data-mce-style', css.join('; '));
            var prevSrc = $img.attr('src');
            var promise = this._makeImgPreviewerUrl({url:$img.attr('src')}, 0 < width ? width : null, 0 < height ? height : null, isPixels);
            return promise.addCallback(function (urls) {
               var url = urls.preview || urls.original;
               if (prevSrc !== url) {
                  $img.attr('src', url);
                  $img.attr('data-mce-src', url);
               }
            });
         },

         _smileHtml: function(smile) {
            return '&#' + smile.code + ';';
         },

         _selectNewRng: function (startNode, startOffset, endNode, endOffset) {
            var hasEndNode = endNode !=/*Не !==*/ null;
            var hasEndOffset = endOffset !=/*Не !==*/ null;
            var editor = this._tinyEditor;
            var newRng = editor.dom.createRng();
            newRng.setStart(startNode, startOffset);
            newRng.setEnd(hasEndNode ? endNode : startNode, hasEndOffset ? endOffset : (hasEndNode ? 0 : startOffset));
            var selection = editor.selection;
            selection.setRng(newRng);
            if (!hasEndNode && !hasEndOffset) {
               selection.collapse(false);
            }
         },

         _cleanHeight: function (value) {
            return value && 0 < (typeof value === 'string' ? parseFloat(value) : value) ? value : 0;
         },

         _bindEvents: function() {
            var
               self = this,
               editor = this._tinyEditor;

            //По инициализации tinyMCE
            editor.on('initContentBody', function(){
               var
                  bindImageEvent = function(event, callback) {
                     self._inputControl.bind(event, function(e){
                        if (self._inputControl.attr('contenteditable') !== 'false') {
                           var
                              target = e.target;
                           if (target.nodeName === 'IMG' && target.className.indexOf('mce-object-iframe') === -1) {
                              callback(e, target);
                           }
                        }
                     });
                  };
               //По двойному клику на изображение показывать диалог редактирования размеров
               bindImageEvent('dblclick', function(event, target) {
                  self._showImagePropertiesDialog(target);
               });
               //По нажатию на изображения показывать панель редактирования самого изображения
               bindImageEvent('mouseup touchstart', function(event, target) {
                  self._showImageOptionsPanel($(target));
               });

               //Проблема:
               //    При клике на изображение в ie появляются квадраты ресайза
               //Решение:
               //    отменять дефолтное действие
               if(cConstants.browser.isIE) {
                  bindImageEvent('mousedown', function(event) {
                     event.preventDefault();
                  });
               }

               //При клике на изображение снять с него выделение
               bindImageEvent('click', function() {
                  // Откладываем снятие выделения т.к. tinymce подписан на такое же событие и может установить
                  // выделение после этого обработчика.
                  // Возможно тут и для всех событий устанавливаемых через bindImageEvent правильнее
                  // было бы подписываться на соответсвующие события editor и обойтись без runDelayed
                  runDelayed(function() {
                     var
                        selection = window.getSelection ? window.getSelection() : null;
                     if (selection) {
                        selection.removeAllRanges();
                     }
                  });
               });
               var _hideImageOptionsPanel = function () {
                  if (this._imageOptionsPanel) {
                     this._imageOptionsPanel.hide();
                  }
               }.bind(this);
               this._inputControl.on('scroll mousewheel', _hideImageOptionsPanel);
               this._inputControl.on('keydown', function (e) {
                  if (e.ctrlKey && (e.key === 'End' || e.keyCode === 35 || e.key === 'Home' || e.keyCode === 36)) {
                     _hideImageOptionsPanel();
                  }
               });

               // При нажатии клавиши Del - удалить изображение, если оно выделено
               // 1174801418 https://online.sbis.ru/opendoc.html?guid=1473813c-1617-4a21-9890-cedd1c692bfd
               this._inputControl.on('keyup', function (evt) {
                  if (evt.key === 'Delete' || evt.keyCode === 46) {
                     var imgOptsPanel = this._imageOptionsPanel;
                     if (imgOptsPanel && imgOptsPanel.isVisible()) {
                        var $img = imgOptsPanel.getTarget();
                        if ($img && $img.length) {
                           var selection = editor.selection;
                           selection.select($img[0]);
                           selection.getRng().deleteContents();
                           imgOptsPanel.hide();
                        }
                     }
                  }
               }.bind(this));

               this._inputControl.attr('tabindex', 1);

               if (!cConstants.browser.firefox) { //в firefox работает нативно
                  this._inputControl.bind('mouseup', function (e) { //в ie криво отрабатывает клик
                     if (e.ctrlKey) {
                         //По ctrl+click по ссылке внутри редктора открывается ссылка в новой вкладке
                         //если перед этим текст делали зеленым то выходит вёрстка
                         //<a><span green>text</span></a>
                         //в момент ctrl+click необходимо смотреть на тег и на его родителя
                        var
                           target = e.target.nodeName === 'A' ? e.target :$(e.target).parent('a')[0]; //ccылка может быть отформатирована
                        if (target && target.nodeName === 'A' && target.href) {
                           window.open(target.href, '_blank');
                        }
                     }
                  });
               }
               this._notifyOnSizeChanged();
               if (!self._readyControlDeffered.isReady()) {
                  self._tinyReady.addCallback(function() {
                     if (!self._readyControlDeffered.isReady()) {
                        self._readyControlDeffered.callback();
                     }
                  });
               }
               // в tinyMCE предустановлены сочетания клавиш на alt+shift+number
               // данные сочетания ставят формат выделенному тексту (h1 - h6, p , div, address)
               // необходимо отключать эти сочетания, чтобы нельзя было как либо создать такие форматы
               for (var i = 1; i <= 9; i++) {
                  editor.shortcuts.remove('access+' + i);
               }
               this._inputControl = $(editor.getBody());
               RichUtil.markRichContentOnCopy(this._inputControl);
               self._tinyReady.callback();
               /*НОТИФИКАЦИЯ О ТОМ ЧТО В РЕДАКТОРЕ ПОМЕНЯЛСЯ ФОРМАТ ПОД КУРСОРОМ*/
               //formatter есть только после инита поэтому подписка осуществляется здесь
               var formats = 'bold,italic,underline,strikethrough,alignleft,aligncenter,alignright,alignjustify,title,subTitle,additionalText,blockquote';
               for(var key in this._options.customFormats){
                  if ({}.hasOwnProperty.call(this._options.customFormats, key)) {
                     formats += ',' + key;
                  }
               }
               editor.formatter.formatChanged(formats, function(state, obj) {
                  self._notify('onFormatChange', obj, state)
               });
               self._notify('onInitEditor');
            }.bind(this));

            //БИНДЫ НА ВСТАВКУ КОНТЕНТА И ДРОП
            editor.on('onBeforePaste', function(e) {
               if (self.addYouTubeVideo(e.content)) {
                  return false;
               }
            });

            editor.on('Paste', function(e) {
               self._clipboardText = e.clipboardData ?
                  e.clipboardData.getData(cConstants.browser.isMobileIOS ? 'text/plain' : 'text') :
                  window.clipboardData.getData('text');
               // editor.plugins.paste.clipboard.pasteFormat = 'html';
            });

            //Обработка вставки контента
            editor.on('PastePreProcess', function(e) {
               // Отключаю форматированную вставку в Win10 -> Edge, т.к. вместе с основным контентом вставляются инородные
               // элементы, которые портят верстку. Баг пофиксен в свежей версии TinyMCE, нужно обновление.
               // https://online.sbis.ru/opendoc.html?guid=0d74d2ac-a25c-4d03-b75f-98debcc303a2
               var
                  isRichContent = cConstants.browser.isIE12 && cConstants.browser.isWin10 ? false : e.content.indexOf('data-ws-is-rich-text="true"') !== -1;
               e.content = e.content.replace('data-ws-is-rich-text="true"', '');
               //Необходимо заменять декорированные ссылки обратно на url
               //TODO: временное решение для 230. удалить в 240 когда сделают ошибку https://inside.tensor.ru/opendoc.html?guid=dbaac53f-1608-42fa-9714-d8c3a1959f17
               e.content = self._prepareContent(e.content);
               //Парсер TinyMCE неправльно распознаёт стили из за - &quot;TensorFont Regular&quot;
               e.content = e.content.replace(/&quot;TensorFont Regular&quot;/gi,'\'TensorFont Regular\'');
               //_mouseIsPressed - флаг того что мышь была зажата в редакторе и не отпускалась
               //равносильно тому что d&d совершается внутри редактора => не надо обрезать изображение
               //upd: в костроме форматная вставка, не нужно вырезать лишние теги
               if (!self._mouseIsPressed && self._options.editorConfig.paste_as_text) {
                  e.content = self._options._sanitizeClasses(e.content, false);
               }
               self._mouseIsPressed = false;
               // при форматной вставке по кнопке мы обрабаотываем контент через событие tinyMCE
               // и послыаем метку форматной вставки, если метка присутствует не надо обрабатывать событие
               // нашим обработчиком, а просто прокинуть его в дальше
               if (e.withStyles) {
                  return e;
               }
               if (!isRichContent) {
                  if (self._options.editorConfig.paste_as_text) {
                     //если данные не из БТР и не из word`a, то вставляем как текст
                     //В Костроме юзают БТР с другим конфигом, у них всегда форматная вставка
                     if (self._clipboardText !== false) {
                        e.content = self._getTextBeforePaste(editor);
                     }
                  }
               }
            });

            editor.on('PastePostProcess', function(event){
               var content = event.node;
               var reUrlOnly = /^https?:\/\/[a-z0-9:=&%#_\-\.\/\?]+$/gi;
               var reUrl = /https?:\/\/[a-z0-9:=&%#_\-\.\/\?]+/i;
               var isPlainUrl = content.innerHTML.search(reUrlOnly) !== -1;
               var $content = $(content);
               $content.find('[unselectable ="on"]').attr('data-mce-resize', 'false');
               if (!isPlainUrl) {
                  var $images = $content.find('img:not(.ws-fre__smile)');
                  if ($images.length) {
                     if (/data:image/gi.test(content.innerHTML)) {
                        return false;
                     }
                     var
                        maximalWidth,
                        width,
                        currentWidth,
                        naturalSizes;
                     maximalWidth = this._inputControl.width() - constants.imageOffset;
                     for (var i = 0; i < $images.length; i++) {
                        naturalSizes = ImageUtil.getNaturalSizes($images[i]);
                        currentWidth = $($images[i]).width();
                        width = currentWidth > maximalWidth ? maximalWidth : currentWidth === 0 ? naturalSizes.width > maximalWidth ? maximalWidth : naturalSizes.width : currentWidth;
                        if (!$images[i].style || ((!$images[i].style.width || $images[i].style.width.indexOf('%') < 0)) && (naturalSizes.width > naturalSizes.height) ) {
                           $($images[i]).css({
                              'width': width,
                              'height': 'auto'
                           });
                        }
                     }
                  }
               }
               var html = content.innerHTML;
               var rng = editor.selection.getRng();
               if (isPlainUrl) {
                  if (rng.collapsed) {
                     var endNode = rng.endContainer;
                     var text = endNode.nodeType === 1 ? endNode.innerHTML : endNode.nodeValue;
                     var offset = rng.endOffset;
                     if (text && offset < text.length && text.substring(offset, offset + 1).search(/[<\s]/gi) === -1) {
                        // Имеем вставку урла внутрь текста, с которым он сольётся - отделить его пробелом в конце
                        // Было бы лучше (намного) сделать этот урл сразу ссылкой, но тогда сервис декораторов не подхватит его
                        // 93358 https://online.sbis.ru/opendoc.html?guid=6e7ccbf1-001c-43fb-afc1-7887baa96d7c
                        html += ' ';
                     }
                  }
               }
               else {
                  var startNode = rng.startContainer;
                  var value = startNode.nodeType === 1 ? startNode.innerHTML : startNode.nodeValue;
                  var offset = rng.startOffset;
                  if (startNode.nodeType == 3) {
                     // Нужно слить текст со всеми соседними текстовыми узлами (нормализовать родитьский узел здесь нельзя, так как слетит рэнж)
                     offset -= value.length;
                     value = this._getAdjacentTextNodesValue(startNode, false) + value;
                     offset += value.length;
                     value += this._getAdjacentTextNodesValue(startNode, true);
                  }
                  if (value.length && offset) {
                     var m = value.match(reUrl);
                     if (m && m.index + m[0].length === offset) {
                        // Имеем вставку текста сразу после урла, с которым он сольётся - отделить его пробелом в началее
                        // Было бы лучше (намного) если бы этот урл был сразу ссылкой, но тогда сервис декораторов не подхватит его
                        // 93358 https://online.sbis.ru/opendoc.html?guid=6e7ccbf1-001c-43fb-afc1-7887baa96d7c
                        html = ' ' + html;
                     }
                  }
               }
               //Замена переносов строк на <br>
               html = html.replace(/([^>])\n(?!<)/gi, '$1<br />');
               // Замена отступов после переноса строки и в первой строке
               // пробелы заменяются с чередованием '&nbsp;' + ' '
               html = this._replaceWhitespaces(html);
               // И теперь (только один раз) вставим в DOM
               content.innerHTML = html;
            }.bind(this));

            if (this._options.editorConfig.browser_spellcheck) {
               // Если включена проверка правописания, нужно при исправлениях обновлять принудительно text
               var _onSelectionChange1 = function () {
                  //В Yandex браузере выделение меняется 2 раза подряд. Откладываем подписку, чтобы ловить только одно.
                  //Это поведение нельзя объединить с поведением для Safari и Chrome, т.к. тогда в Yandex этот обработчик вообще не сработает.
                  //Для всех браузеров это сделано потому что все равно человек не сможет выбрать вариант так быстро и нет смысла плодить лишние условия
                  setTimeout(function() {
                     cConstants.$doc.one('selectionchange', _onSelectionChange2);
                  }, 1);
                  // Хотя цепляемся на один раз, но всё же отцепим через пару минут, если ничего не случится за это время
                  setTimeout(function() {
                     cConstants.$doc.off('selectionchange', _onSelectionChange2);
                  }, 120000);
               }.bind(this);

               var _onSelectionChange2 = function () {
                  this._updateTextByTiny();
               }.bind(this);

               //В IE событие contextmenu не стреляет при включенной проверке орфографии, так что подписываемся на mousedown
               editor.on('mousedown', function (evt) {
                  if (evt.button === 2) {
                     if (evt.currentTarget === this._inputControl[0] && (evt.target === evt.currentTarget || $.contains(evt.currentTarget, evt.target))) {
                        cConstants.$doc.off('selectionchange', _onSelectionChange2);
                        if (cConstants.browser.safari || cConstants.browser.chrome && !cConstants.browser.yandex) {
                           // Для safari и chrome обязательно нужно отложить подписку на событие (потому что в тот момент, когда делается эта подписка
                           // они меняют выделение, и потом меняют его в момент вставки. Чтобы первое не ловить - отложить)
                           setTimeout(function() {
                              cConstants.$doc.one('selectionchange', _onSelectionChange1);
                           }, 1);
                        }
                        else {
                           cConstants.$doc.one('selectionchange', _onSelectionChange1);
                        }
                     }
                  }
               }.bind(this));
            }

            editor.on('drop', function(event) {
               //при дропе тоже заходит в BeforePastePreProcess надо обнулять _clipboardTex
               self._clipboardText = false;
               if (!self._mouseIsPressed && !cConstants.browser.isIE && (!event.targetClone || !$(event.targetClone).hasClass('controls-RichEditor__noneditable')))  {
                  event.preventDefault();
               }
            });

            editor.on('dragstart', function(event) {
               //Youtube iframe не отдаёт mouseup => окошко с видеороликом таскается за курсором
               //запрещаем D&D iframe элементов
               if (event.target && $(event.target).hasClass('mce-object-iframe')) {
                  event.preventDefault();
               }
             });

            //БИНДЫ НА СОБЫТИЯ КЛАВИАТУРЫ (ВВОД)
            if (cConstants.browser.isMobileIOS || cConstants.browser.isMobileAndroid) {
               //TODO: https://github.com/tinymce/tinymce/issues/2533
               this._inputControl.on('input', function() {
                  self._updateTextByTiny();
               });
            }

            //Передаём на контейнер нажатие ctrl+enter и escape
            this._container.bind('keydown', function(e) {
               if (!(e.which === cConstants.key.enter && e.ctrlKey) && e.which !== cConstants.key.esc) {
                  e.stopPropagation();
               }
            });

            //Запрещаем всплытие Enter, Up и Down
            this._container.bind('keyup', function(e) {
               var ctrlKey = e.ctrlKey;

               if (e.which === cConstants.key.enter && !ctrlKey && self._ctrlKeyUpTimestamp) {
                  ctrlKey = (new Date() - self._ctrlKeyUpTimestamp) < 100;
               }
               if (e.which === cConstants.key.ctrl) {
                  self._ctrlKeyUpTimestamp = new Date();
               }

               if ((e.which === cConstants.key.enter && !ctrlKey)|| e.which === cConstants.key.up || e.which === cConstants.key.down) {
                  e.stopPropagation();
                  e.preventDefault();
               }
            });

            editor.on('keyup', function(e) {
               self._typeInProcess = false;
               if (!(e.keyCode === cConstants.key.enter && e.ctrlKey)) { // Не нужно обрабатывать ctrl+enter, т.к. это сочетание для дефолтной кнопки
                  self._updateTextByTiny();
               }
            });

            editor.on('keydown', function(e) {
               self._typeInProcess = true;
               if (e.which === cConstants.key.pageDown || e.which === cConstants.key.pageUp || (e.which === cConstants.key.insert && !e.shiftKey && !e.ctrlKey)) {
                  e.stopPropagation();
                  e.preventDefault();
               }
               if (e.keyCode == cConstants.key.tab) {
                  var
                     area = self.getParent(),
                     nextControl = area.getNextActiveChildControl(e.shiftKey);
                  if (nextControl) {
                     self._fakeArea.focus();
                     nextControl.setActive(true, e.shiftKey);
                  }
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  //после tab не происходит keyup => необходимо сбрасывать флаг нажатой кнопки
                  self._typeInProcess = false;
                  return false;
               } else if (e.ctrlKey || (e.which >= cConstants.key.f1 && e.which <= cConstants.key.f12 ) ) {
                  //сбрасываем флаг при любом горячем сочетании
                  if (e.which === cConstants.key.enter) {
                     e.preventDefault();//по ctrl+enter отменяем дефолтное(чтобы не было перевода строки лишнего), разрешаем всплытие
                     //по ctrl+enter может произойти перехват события( например главная кнопка) и keyup может не сработать
                     //необходимо сбрасывать флаг зажатой кнопки, чтобы шло обновление опции text (сейчас обновление опции text не идёт при зажатаой клавише, чтобы не тормозило)
                  }
                  self._typeInProcess = false;
               }
               self._updateHeight();
            });

            // Если редактируется ссылка, у которой текст точно соответсвовал урлу, то при редактировании текста должен изменяться и её урл.
            // Особенно актуально, когда на тулбаре кнопки редактирования ссылки нет
            var _linkEditStart = function () {
               var a = editor.selection.getNode();
               if (a.nodeName === 'A' && a.hasChildNodes() && !a.children.length) {
                  var url = a.href;
                  var text = a.innerHTML;
                  var isCoupled = text === url;
                  var prefix, suffix;
                  if (!isCoupled) {
                     prefix = url.substring(0, url.indexOf('://') + 3);
                     text = prefix + text;
                     isCoupled = url === text;
                     if (!isCoupled) {
                        suffix = '/';
                        isCoupled =  url === text + suffix;
                     }
                  }
                  if (isCoupled) {
                     if (!a.dataset) {
                        // В MSIE нет свойства dataset, но достаточно просто довить его
                        a.dataset = {};
                     }
                     a.dataset.wsPrev = JSON.stringify({url:url, prefix:prefix || '', suffix:suffix || ''});
                  }
               }
            };

            var _linkEditEnd = function () {
               var a = editor.selection.getNode();
               if (a.nodeName === 'A' && a.dataset && 'wsPrev' in a.dataset) {
                  if (a.hasChildNodes() && !a.children.length) {
                     var prev = JSON.parse(a.dataset.wsPrev);
                     var url = a.href;
                     var text = a.innerHTML;
                     if (prev.url === url) {
                        url = prev.prefix + text + prev.suffix;
                        a.href = url;
                        // Опять же - в MSIE нет свойства dataset, поэтому по-старинке
                        a.setAttribute('data-mce-href', url);
                     }
                  }
                  delete a.dataset.wsPrev;
               }
            };

            // Если (в chrome-е) при удалении бэкспейсом пред курсором находится символ &#xFEFF; , то удалить его тоже
            // 1174778405 https://online.sbis.ru/opendoc.html?guid=d572d435-488a-4ac0-9c28-ebed44e4e51e
            if (cConstants.browser.chrome) {
               editor.on('keydown', function (e) {
                  if (e.key === 'Backspace') {
                     var selection = this._tinyEditor.selection;
                     if (selection.isCollapsed()) {
                        var rng = selection.getRng();
                        var node = rng.startContainer;
                        var index = rng.startOffset;
                        if (node.nodeType === 3 && 0 < index) {
                           var text = node.nodeValue;
                           if (text.charCodeAt(index - 1) === 65279/*&#xFEFF;*/) {
                              node.nodeValue = 1 < text.length ? text.substring(0, index - 1) + text.substring(index) : '';
                              this._selectNewRng(node, index - 1);
                           }
                        }
                     }
                  }
               }.bind(this));
            }

            // При посимвольном удалении текста на Ipad, полностью удалив текст, упираемся в невидимый символ. При этом
            // у <br> в <p> отсутствует аттрибут data-mce-bogus="1". Добавим его вручную, тем самым установив курсор в
            // должное положение
            // https://online.sbis.ru/opendoc.html?guid=18888f87-e0b7-4295-903d-c7f8093c2701
            if(cConstants.browser.isMobileSafari || (cConstants.browser.chrome && cConstants.browser.isMobileIOS)) {
               editor.on('keyup', function(e) {
                  var selection = this._tinyEditor.selection,
                     node = selection.getNode().parentNode;
                  if (node.innerHTML === "<p><br></p>") {
                     node.innerHTML = '<p><br data-mce-bogus="1"></p>';
                  }
               }.bind(this));
            }

            // Обработка изменения содержимого редактора.
            editor.on('keydown', function(e) {
               if (e.key && 1 < e.key.length) {
                  _linkEditStart();
                  setTimeout(function() {
                     //Возможно, мы уже закрыты
                     if(!self.isDestroyed()){
                        _linkEditEnd();
                     }
                  }, 1);
               }
            });

            // Обработка изменения содержимого редактора.
            // Событие keypress возникает сразу после keydown, если нажата символьная клавиша, т.е. нажатие приводит к появлению символа.
            // Любые буквы, цифры генерируют keypress. Управляющие клавиши, такие как Ctrl, Shift, F1, F2.. — keypress не генерируют.
            editor.on('keypress', function(e) {
               _linkEditStart();
               // <проблема>
               //    Если в редакторе написать более одного абзаца, выделить, и нажать любую символьную клавишу,
               //    то, он оставит сверху один пустой абзац, который не удалить через визуальный режим, и будет писать в новом
               // </проблема>
               if (!e.ctrlKey && !(e.metaKey && cConstants.browser.isMacOSDesktop) && e.charCode !== 0) {
                  if (!editor.selection.isCollapsed()) {
                     if (editor.selection.getContent() == self._getTinyEditorValue()) {
                        editor.bodyElement.innerHTML = '';
                     }
                  }
               }
               setTimeout(function() {
                  if(!self.isDestroyed()){
                     _linkEditEnd();
                  }
                  self._togglePlaceholder(self._getTinyEditorValue());
               }, 1);
            });
            editor.on('change', function(e) {
               self._updateTextByTiny();
            });
            editor.on('cut',function(e){
               setTimeout(function() {
                  self._updateTextByTiny();
               }, 1);
            });
            //Сообщаем компоненту об изменении размеров редактора
            editor.on('resizeEditor', function() {
               self._notifyOnSizeChanged();
            });

            //реагируем на то что редактор изменился при undo/redo
            editor.on('undo', function() {
               self._updateTextByTiny();
            });

            editor.on('redo', function() {
               self._updateTextByTiny();
            });
            //Уличная магия в чистом виде (на мобильных устройствах просто не повторить) :
            //Если начать выделять текст в редакторе и увести мышь за его границы и продолжить печатать падают ошибки:
            //Клик окончится на каком то элементе, listview например стрельнет фокусом на себе
            //если  есть активный редактор то запомнится выделение(lastFocusBookmark) и прежде чем
            //введется символ сработает focusin(который не перебить непонятно почему)
            //в нём сработает восстановление выделения, а выделенного уже и нет => error
            //Решение: в mouseLeave смотреть зажата ли мышь, и если зажата убирать activeEditor
            //тк activeEditor будет пустой не запомнится LastFocusBookmark и не будет восстановления выделения
            //activeEditor восстановится сразу после ввода символа а может и раньше, главное что восстновления выделения не будет
            if (!cConstants.browser.isMobileIOS && !cConstants.browser.isMobileAndroid) {
               editor.on('mousedown', function(e) {
                  self._mouseIsPressed = true;
               });
               editor.on('mouseup', function(e) {
                  self._mouseIsPressed = false;
               });
               editor.on('focusout', function(e) {
                  if (self._mouseIsPressed){
                     editor.editorManager.activeEditor = false;
                  }
                  self._mouseIsPressed = false;
               });
            }

            //сохранение истории при закрытии окна
            this._saveBeforeWindowClose  =  function() {
               this.saveToHistory(this.getText());
            }.bind(this);
            cConstants.$win.bind('beforeunload', this._saveBeforeWindowClose);

            /*НОТИФИКАЦИЯ О ТОМ ЧТО В РЕДАКТОРЕ ПОМЕНЯЛСЯ UNDOMANAGER*/
            editor.on('TypingUndo AddUndo ClearUndos redo undo', function() {
               self._notify('onUndoRedoChange', {
                  hasRedo: self._tinyEditor.undoManager.hasRedo(),
                  hasUndo: self._tinyEditor.undoManager.hasUndo()
               });
            });
            /*НОТИФИКАЦИЯ О ТОМ ЧТО В РЕДАКТОРЕ ПОМЕНЯЛСЯ NODE ПОД КУРСОРОМ*/
            editor.on('NodeChange', function(e) {
               self._notify('onNodeChange', e)
            });

            // Для правильной работы метода insertHtml в отсутствии фокуса будем фиксировать последний актуальный рэнж
            editor.on('focus focusin', function (evt) {
               // Сбрасывать последний актуальный рэнж не сразу, а только после того, как все синхронные обработчики события отработают
               setTimeout(function () {
                  self._tinyLastRng = null;
               }, 1);
            });
            editor.on('blur focusout', function (evt) {
               var rng = editor.selection.getRng();
               if (!(rng.collapsed && rng.startOffset === 0 && rng.startContainer === editor.getBody())) {
                  self._tinyLastRng = rng;
               }
            });

            editor.on('focusin', function(e) {
               if (self._fromTouch){
                  self._notifyMobileInputFocus();
               }
            });
            editor.on('focusout', function(e) {
               if (self._fromTouch){
                  EventBus.globalChannel().notify('MobileInputFocusOut');
                  self._fromTouch = false;
               }
            });
            editor.on('touchstart', function(e) {
               self._fromTouch = true;
            });
         },

         _getAdjacentTextNodesValue: function (node, toEnd) {
            var prop = toEnd ? 'nextSibling' : 'previousSibling';
            var value = '';
            for (var n = node[prop]; n && n.nodeType == 3; n = n[prop]) {
               value = toEnd ? value + n.nodeValue : n.nodeValue + value;
            }
            return value;
         },

         _notifyMobileInputFocus: function () {
            EventBus.globalChannel().notify('MobileInputFocus');
         },

         _showImageOptionsPanel: function(target) {
            this._getImageOptionsPanel(target).show();
         },

         _changeImageTemplate: function ($img, template) {
            $img.removeClass();
            var $parent = $img.parent();
            var needUnwrap = $parent.hasClass('image-template-center');
            if (needUnwrap && template != '2') {
               $img.unwrap();
            }
            switch (template) {
               case '1':
                  $img.addClass('image-template-left');
                  break;
               case '2':
                  //todo: go to tmpl
                  var width = $img[0].style.width || ($img.width() + 'px');
                  var html = '<p class="controls-RichEditor__noneditable image-template-center" contenteditable="false">' + //tinyMCE не проставляет contenteditable если изменение происходит  через dom.replace
                        '<img' +
                        ' src="' + $img.attr('src') + '"' +
                        ' style="width:' + (width ? width : constants.defaultImagePercentSize + '%') + '"' +
                        ' alt="' + $img.attr('alt') + '"' +
                        ' data-img-uuid="' + $img.attr('data-img-uuid') + '"' +
                        '></img>' +
                     '</p>';
                  this._tinyEditor.dom.replace($(html)[0], (needUnwrap ? $parent : $img)[0],false);
                  break;
               case '3':
                  $img.addClass('image-template-right');
                  break;
               case '6':
                  break;
            };
            // Вызвать recalcPosition напрямую во избежании ощутимых задержек
            // 49132 https://online.sbis.ru/opendoc.html?guid=f6ceccf6-2001-494d-90c1-d44a6255ad1e
            this._imageOptionsPanel.recalcPosition();
            this._updateTextByTiny();
         },

         _getImageOptionsPanel: function(target){
            var
               self = this,
               uuid = this.checkImageUuid(target[0]);
            if (!this._imageOptionsPanel) {
               this._imageOptionsPanel = new ImageOptionsPanel({
                  templates: self._options.templates,
                  parent: self,
                  target: target,
                  imageUuid: uuid,
                  targetPart: true,
                  corner: 'bl',
                  closeByExternalClick: true,
                  element: $('<div></div>'),
                  imageFolder: self._options.imageFolder,
                  verticalAlign: {
                     side: 'top'
                  },
                  horizontalAlign: {
                     side: 'left'
                  }
               });
               this._imageOptionsPanel.subscribe('onImageChange', function(event, fileobj){
                  self._startWaitIndicator(rk('Загрузка изображения...'), 1000);
                  var $img = this.getTarget();
                  //Сбросим ширину и высоту, т.к. они могут остаться от предыдущей картинки
                  $img[0].style.width = '';
                  $img[0].style.height = '';
                  var width = $img[0].style.width || ($img.width() + 'px');
                  var isPixels = width.charAt(width.length - 1) !== '%';
                  self._makeImgPreviewerUrl(fileobj, +width.substring(0, width.length - (isPixels ? 2 : 1)), null, isPixels).addCallback(function (urls) {
                     var url = urls.preview || urls.original;
                     $img.attr('src', url);
                     $img.attr('data-mce-src', url);
                     var uuid = fileobj.id;
                     // TODO: 20170913 Также убрать атрибуты с uuid, как и в методе _insertImg
                     $img.attr('data-img-uuid', uuid);
                     $img.attr('alt', uuid);
                     $img[0].onload = $img[0].onerror = self._stopWaitIndicator.bind(self);
                     self._tinyEditor.undoManager.add();
                     self._updateTextByTiny();
                     if (uuid) {
                        self._images[uuid] = false;
                     }
                      var selection = window.getSelection ? window.getSelection() : null;
                      if (selection) {
                          selection.collapse($img[0]);
                      }
                  });
               });
               this._imageOptionsPanel.subscribe('onImageDelete', function () {
                  var nodeForDelete = this.getTarget()[0];
                  var nodeForSelect = nodeForDelete.parentNode;
                  // Если изображение обёрнуто - удалить и обёртку
                  // 1174832762 https://online.sbis.ru/opendoc.html?guid=0e560e83-6ebe-40a2-862f-18bd0563bbf6
                  if (nodeForSelect.classList.contains('image-template-center')) {
                     nodeForDelete = nodeForSelect;
                     nodeForSelect = nodeForDelete.parentNode;
                  }
                  $(nodeForDelete).remove();
                  //Проблема:
                  //          После удаления изображения необходимо вернуть фокус в редактор,
                  //          но тк выделение было на изображении при фокусе оно пытаетсыя восстановиться.
                  //          Допустим в редакторе было только изображение, тогда выделение было вида:
                  //             start/endContainer = <p>, endOffset = 1.
                  //          После удаления <p>.childNodes.length = 0, попытается восстановиться 1 => ошибка
                  //Решение:
                  //          После удаления изображения ставить каретку(курсор ввода) в конец родительского для изображения блока
                  self._tinyEditor.selection.select(nodeForSelect, false);
                  self._tinyEditor.selection.collapse();
                  self._tinyEditor.undoManager.add();
                  self._updateTextByTiny();
               });
               this._imageOptionsPanel.subscribe('onTemplateChange', function(event, template){
                  self._changeImageTemplate(this.getTarget(), template);
               });
               this._imageOptionsPanel.subscribe('onImageSizeChange', function (evt) {
                  var promise = new Deferred();
                  self.subscribeOnceTo(self, 'onImagePropertiesDialogOpen', promise.callback.bind(promise));
                  self._showImagePropertiesDialog(this.getTarget());
                  evt.setResult(promise);
               });
            } else {
               this._imageOptionsPanel.setTarget(target);
               this._imageOptionsPanel.setImageUuid(uuid);
            }
            return this._imageOptionsPanel;
         },

         /**
          * Получить идентификатор изображения
          * @public
          * @param {Element} img Элемент IMG
          * @return {string}
          */
         checkImageUuid: function (img) {
            // html, содержащий в себе изображения, может попасть в редактор откуда угодно (старые или проблемные документы и т.д.), нет строгой
            // гарантии, что в атрибуте alt содержится именно uuid изображения, так что пробуем извлечь его откуда найдётся (и поправить если придётся)
            var REs = [
               /(?:\?|&)id=([0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12})(?:&|$)/i,
               /\/disk\/api\/v[0-9\.]+\/([0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12})(?:_|$)/i
            ];
            var url = img.src;
            for (var i = 0; i < REs.length; i++) {
               var ms = url.match(REs[i]);
               if (ms) {
                  return ms[1];
               }
            }
         },

         /**
          * Создать урл изображения через previewer-сервис с необходимым масштабированием
          * @protected
          * @param {object} imgInfo Информация об изображении (url, width, height, id?, filePath?)
          * @param {number} width Визуальная ширина изображения
          * @param {number} height Визуальная высота изображения
          * @param {boolean} isPixels Размеры указаны в пикселах (иначе в процентах)
          * @return {Core/Deferred<object>}
          */
         _makeImgPreviewerUrl: function (imgInfo, width, height, isPixels) {
            if (!(0 < width)) {
               throw new Error('Size is not specified');
            }
            var promise = new Deferred();
            var url = imgInfo.filePath || imgInfo.url;
            if (!/\/disk\/api\/v[0-9\.]+\//i.test(url)) {
               // Это не файл, хранящийся на СбисДиск, вернуть как есть
               promise.callback({preview:url, original:url});
               return promise;
            }
            url = url.replace(/^\/previewer(?:\/r\/[0-9]+\/[0-9]+)?/i, '');
            promise = promise.addCallback(function (size) {
               return {preview:size ? '/previewer' + '/r/' + size + '/' + size + url : null, original:url};
            });
            if (0 < width) {
               if (!isPixels && width > 100) {
                  width=100;
                  height=100;
               }
               var w = isPixels ? width : width*constants.baseAreaWidth/100;//this.getContainer().width()
               if (0 < height) {
                  promise.callback(Math.round(width < height ? w*height/width : w));
               }
               else
               if (0 < imgInfo.width && 0 < imgInfo.height) {
                  promise.callback(Math.round(imgInfo.width < imgInfo.height ? w*imgInfo.height/imgInfo.width : w));
               }
               else {
                  var img = new Image();
                  img.onload = function () {
                     promise.callback(Math.round(img.width < img.height ? w*img.height/img.width : w));
                  };
                  img.onerror = function () {
                     promise.callback(null);
                  };
                  img.src = url;
               }
            }
            else {
               promise.callback(constants.defaultPreviewerSize);
            }
            return promise;
         },

         /**
          * Заменить все вхождения пробелов и сущностей &nbsp; регуляризованными чередующимися цепочками
          * @param {string} text Исходный текст
          * @return {string}
          */
         _replaceWhitespaces: function (text) {
            if (typeof text !== 'string') {
               return text;
            }
            var out = '';
            for (var a = 0, b = -1, opening = true, notEnd = true ; notEnd; opening = !opening) {
               b = text.indexOf(opening ? '<' : '>', a);
               notEnd = b !== -1;
               if (opening) {
                  if (a !== notEnd ? b : text.length) {
                     // Это фрагмент между тегами
                     out += text.substring(a, notEnd ? b : text.length)
                        // Сначала заменяем все вхождения сущности &nbsp; на эквивалентный символ
                        .replace(/&nbsp;/g, String.fromCharCode(160))
                        // Затем регуляризуем все пробельные цепочки
                        .replace(/[\x20\xA0]+/g, function ($0/*, index, source*/) {
                           if ($0.length === 1) {
                              return $0.charCodeAt(0) === 32 ? $0 : '&nbsp;';
                           }
                           else {
                              // Получена цепочка пробельных символов - заменяем чередованием. Первым в цепочке всегда берём &nbsp;
                              var spaces = '';
                              for (var i = 0; i < $0.length; i++) {
                                 spaces += i%2 === 1 ? ' ' : '&nbsp;';
                              }
                              return spaces;
                           }
                        });
                     ;
                  }
                  a = b;
               }
               else {
                  // Это фрагмент внутри тега
                  out += text.substring(a, notEnd ? b + 1 : text.length);
                  a = b + 1;
               }
            }
            return out;
         },

         _performByReady: function(callback) {
            if (this._tinyReady.isReady()) {
               callback();
            } else {
               this._tinyReady.addCallback(callback);
            }
         },

         _getElementToFocus: function() {
            return this._inputControl || false;
         },

         _setEnabled: function(enabled) {
            this._enabled = enabled;
            if (!this._tinyReady.isReady() && enabled) {
               this._tinyReady.addCallback(function() {
                  this._applyEnabledState(this._enabled);
               }.bind(this));
               this._initTiny();
            } else {
               this._applyEnabledState(enabled);
            }
         },

         _applyEnabledState: function (enabled) {
            var container = this._tinyEditor && this._tinyEditor.getContainer() ? $(this._tinyEditor.getContainer()) : this._inputControl;
            var options = this._options;
            if (options.autoHeight) {
               this._richTextAreaContainer.css('max-height', this._cleanHeight(options.maximalHeight) || '');
               this._richTextAreaScrollContainer.css('max-height', this._cleanHeight(options.maximalHeight) || '');
               // Минимальную высоту области просмотра нужно фиксировать только в отсутствии опции previewAutoHeight
               // 1175020199 https://online.sbis.ru/opendoc.html?guid=ff26541b-4dce-4df3-8b04-1764ee9b1e7a
               // 1175043073 https://online.sbis.ru/opendoc.html?guid=69a945c9-b517-4056-855a-6dec71d81823
               if (this._dataReview && !options.previewAutoHeight) {
                  this._dataReview.css('min-height', enabled ? '' : this._cleanHeight(options.minimalHeight) || '');
               }
            }
            else {
               if (this._dataReview) {
                  this._dataReview.css('min-height', enabled ? '' : this._scrollContainer.height());
               }
            }
            if (this._dataReview) {
               this._updateDataReview(this.getText() || '', !enabled);
               this._dataReview.toggleClass('ws-hidden', enabled);
            }
            container.toggleClass('ws-hidden', !enabled);
            this._inputControl.toggleClass('ws-hidden', !enabled);
            //Требуем в будущем пересчитать размеры контрола
            this._notifyOnSizeChanged();

            // Убрать FakeCarret в редакторе при неактивном состоянии
            // 1174789437 https://online.sbis.ru/opendoc.html?guid=e21b8722-3ffa-4a47-a499-c8bd01af0985
            if (enabled && !this.isActive()) {
               setTimeout(this._removeTinyFakeCaret.bind(this), 1);
            }

            RichTextArea.superclass._setEnabled.apply(this, arguments);
         },

         _requireTinyMCE: function() {
            var
               notDefined = false,
               result = new Deferred();
            // Реквайрим модули только если они не были загружены ранее, т.к. require отрабатывает асинхронно и на ipad это
            // недопустимо (клавиатуру можно показывать синхронно), да и в целом можно считать это оптимизацией.
            EDITOR_MODULES.forEach(function(module) {
               if (!require.defined(module)) {
                  notDefined = true;
               }
            });
            if (notDefined) {
               require(EDITOR_MODULES, function() {
                  result.callback();
               });
            } else {
               result.callback();
            }
            return result;
         },

         _initTiny: function() {
            var
               self = this;
            if (!this._tinyEditor && !this._tinyIsInit) {
               this._tinyIsInit = true;
               this._requireTinyMCE().addCallback(function() {
                  var cfg = cClone(self._options.editorConfig);
                  cfg.paste_as_text = false;

                  for(var key in self._options.customFormats) {
                     if ({}.hasOwnProperty.call(self._options.customFormats, key)) {
                        cfg.formats[key] = self._options.customFormats[key];
                     }
                  }
                  tinyMCE.baseURL = '/resources/' + TINYMCE_URL_BASE;
                  tinyMCE.init(cfg);
               });
            }
            this._tinyReady.addCallback(function () {
               var editor = this._tinyEditor;
               var text = this._prepareContent(this.getText()) || '';
               editor.setContent(text);
               // Если при инициализации редактора есть начальный контент - нужно установить курсор в конец и переключить местоимение (placeholder)
               // 1174747440 https://online.sbis.ru/opendoc.html?guid=3ffa28b7-7924-469d-8e42-c7570d3939d5
               if (text) {
                  this.setCursorToTheEnd();
                  this._togglePlaceholder(text);
               }
               //Проблема:
               //          1) При инициализации тини в историю действий добавляет контент блока на котором он построился
               //                (если пусто то <p><br data-mce-bogus="1"><p>)
               //          2) При открытиии задачи мы добавляем в историю действий текущий контент
               //          После выполнения пункта 2 редактор стреляет 'change'(тк история не пустая(1) и в неё добавляют(2))
               //          Далее мы стреляем изменением в контекст
               //             а тк мы могли раздекорировать ссылку то портим значение в контексте
               //Правильное решение:
               //          В методе _setText сранивать текщуее значение опции и значение в редакторе
               //          предварительно подготовив их через _prepareContent
               //          N.B!  Данное решение не подходит тк заход в _setText идёт при каждом символе
               //                и каждый раз разбирать контент на DOM-дерево не быстро =>
               //                => будет тормозить ввод в редактор
               //Решение:
               //          Очистить историю редактора (clear) после его построения, чтобы пункт 2 был
               //          первым в истории изщменений и редактор не стрелял 'change'
               editor.undoManager.clear();
               editor.undoManager.add();
            }.bind(this));
         },

         /**
          * Получить текущее содержимое редактора
          * Вынесено в метод так как no_events: true нужно в методе getContent,
          * но также не нужно в _tinyEditor.serializer.serialize.
          * Данный метод это метод getContent TinyMce без предсобытий вызываемых в нём
          * @returns {*} Текущее значение (в формате html-кода)
          */
         _getTinyEditorValue: function () {
            var
               content = this._tinyEditor.getContent({no_events: true}),
               args = this._tinyEditor.fire('PostProcess', {content: content});
            return args.content;
         },

         /**
          * Убрать пустые строки из начала и конца текста
          * @returns {*} текст без пустх строк вначале и конце
          */
         _trimText: function (text) {
            if (!text) {
               return '';
            }
            var regs = {
               regShiftLine1: /<p>[\s\xA0]*(?:<br[^<>]*>)+[\s\xA0]*/gi,    // регулярка пустой строки через shift+ enter и space
               regShiftLine2: /[\s\xA0]*(?:<br[^<>]*>)+[\s\xA0]*<\x2Fp>/gi,// регулярка пустой строки через space и shift+ enter
               beginReg: /^<p>[\s\xA0]*<\x2Fp>[\s\xA0]*/i,        // регулярка начала строки
               endReg: /[\s\xA0]*<p>[\s\xA0]*<\x2Fp>$/i           // регулярка конца строки
            };
            var substitutes = {
               regShiftLine1: '<p>',
               regShiftLine2: '</p>'
            };
            text = this._removeEmptyTags(text);
            text = text.replace(/&nbsp;/gi, String.fromCharCode(160));
            for (var name in regs) {
               for (var prev = -1, cur = text.length; cur !== prev; prev = cur, cur = text.length) {
                  text = text.replace(regs[name], substitutes[name] || '');
               }
               text = text.replace(/^[\s\xA0]+|[\s\xA0]+$/g, '');
               if (!text) {
                  return '';
               }
            }
            text = text.replace(/\xA0/gi, '&nbsp;');
            return text;
         },

         /**
          * Проблема:
          *          при нажатии клавиши установки формата( полужирный/курсив и тд) генерируется пустой тег (strong,em и тд)
          *          опция text при этом перестает быть пустой
          * Решение:
          *          убирать пустые теги перед тем как отдать значение опции text
          * @param text
          * @returns {String}
          * @private
          */
         _removeEmptyTags: function(text) {
            var
               temp = $('<div>' + text + '</div>');
            while ( temp.find(':empty:not(img, iframe, br)').length) {
               temp.find(':empty:not(img, iframe)').remove();
            }
            return temp.html();
         },

         /**
          * Получить текущее значение
          * @returns {*} Текущее значение (в формате html-кода)
          */
         _curValue: function() {
            return this._tinyEditor && this._tinyEditor.initialized && this.isEnabled() ? this._getTinyEditorValue() : this.getText();
         },

         _prepareContent: function(text) {
            text = typeof text === 'string' ? text : text === null || text === undefined ? '' : text + '';
            //TODO: временное решение для 230. удалить в 240 когда сделают ошибку https://inside.tensor.ru/opendoc.html?guid=dbaac53f-1608-42fa-9714-d8c3a1959f17
            return RichUtil.unDecorateLinks(text);
         },

         //метод показа плейсхолдера по значению//
         //TODO: ждать пока решится задача в самом tinyMCE  https://github.com/tinymce/tinymce/issues/2588
         _togglePlaceholder:function(value){
            var
               curValue = value || this.getText();
            this.getContainer().toggleClass('controls-RichEditor__empty', (curValue === '' || curValue === undefined || curValue === null) &&
               this._inputControl.html().indexOf('</li>') < 0 &&
               this._inputControl.html().indexOf('<p>&nbsp;') < 0 &&
               this._inputControl.html().indexOf('<p><br>&nbsp;') < 0 &&
               this._inputControl.html().indexOf('<blockquote>') < 0
            );
         },

         _replaceSmilesToCode: function(text) {
            smiles.forEach(function(smile){
               text = text.replace(new RegExp(String.fromCodePoint(smile.code), 'gi'), smile.title);
            });
            return text;
         },

         _replaceCodesToSmile: function(text) {
            smiles.forEach(function(smile) {
               text = text.replace(new RegExp(smile.title, 'gi'), String.fromCodePoint(smile.code));
            });
            return text;
         },

         /**
          * Убрать FakeCarret в редакторе
          */
         _removeTinyFakeCaret: function () {
            var editor = this._tinyEditor;
            if (editor) {
               var selectionOverrides = editor._selectionOverrides;
               if (selectionOverrides) {
                  selectionOverrides.hideFakeCaret();
               }
            }
         },

         _addToHistory: function(text) {
            return UserConfig.setParamValue(this._getNameForHistory(), this._replaceSmilesToCode(text));
         },

         _getNameForHistory: function() {
            return this.getName().replace('/', '#') + 'ИсторияИзменений';
         },

         /**
          * Показать индикатор ожидания
          * @protected
          * @param {string} message Текст сообщения
          * @param {string} [delay] Задержка перед началом показа индикатора (опционально)
          */
         _startWaitIndicator: function (message, delay) {
            this._stopWaitIndicator();
            this._waitIndicatorStopper = new Deferred();
            WaitIndicator.make({
               overlay: 'dark',
               delay: 0 < delay ? delay : 0,
               target: this,
               message: message
            }, this._waitIndicatorStopper);
         },

         /**
          * Прекратить показ индикатор ожидания
          * @protected
          */
         _stopWaitIndicator: function () {
            var stopper = this._waitIndicatorStopper;
            if (stopper && !stopper.isReady()) {
               stopper.callback();
            }
            this._waitIndicatorStopper = null;
         },

         _insertImg: function (urls, width, height, className, alt, before, after, uuid) {
            var src = urls.preview || urls.original;
            if (!src) {
               return this._showImgError();
            }
            var promise = new Deferred();
            var editor = this._tinyEditor;
            var img = new Image();
            img.onload = function () {
               // TODO: 20170913 Здесь в атрибуты, сохранность которых не гарантируется ввиду свободного редактирования пользователями, помещается значение uuid - Для обратной совместимости
               // После задач https://online.sbis.ru/opendoc.html?guid=6bb150eb-4973-4770-b7da-865789355916 и https://online.sbis.ru/opendoc.html?guid=a56c487d-6e1d-47bc-bdf6-06a0cd7aa57a
               // Убрать по мере переделки стороннего кода, используещего эти атрибуты.
               // Для пролучения uuid правильно использовать метод getImageUuid
               var style = (width ? 'width:' + width + ';' : '') + (height ? 'height:' + height + ';' : '');
               this.insertHtml(
                  (before || '') +
                  '<img' +
                  (className ? ' class="' + className + '"' : '') +
                  ' src="' + src + '"' +
                  (style ? ' style="' + style + '" data-mce-style="' + style + '"' : '') +
                  /*(alt ? ' alt="' + alt.replace('"', '&quot;') + '"' : '') +*/
                  ' data-img-uuid="' + uuid + '" alt="' + uuid + '"' +
                  '></img>' +
                  (after || '')
               );
               promise.callback();
            }.bind(this);
            img.onerror = function () {
               this._showImgError();//.addCallback(promise.errback.bind(promise))
               promise.errback();
            }.bind(this);
            img.src = src;
            return promise;
         },

         _showImgError: function () {
            var promise = new Deferred();
            require(['SBIS3.CONTROLS/Utils/InformationPopupManager'], function (InformationPopupManager) {
               InformationPopupManager.showMessageDialog({
                     status: 'error',
                     className: 'controls-RichEditor__insertImg-alert',
                     message: rk('Ошибка'),
                     details: rk('Невозможно открыть изображение'),
                     isModal: true,
                     closeByExternalClick: true,
                     opener: this
                  },
                  promise.callback.bind(promise)
               );
            });
            return promise;
         },

         _onChangeAreaValue: function() {
            if (this._sourceContainerIsActive()) {
               this.setText(this._sourceArea.val());
            }
         },

         /**
          * Проверка активен ли режим кода
          * @private
          */
         _sourceContainerIsActive: function(){
            return !this._sourceContainer.hasClass('ws-hidden');
         },

         _updateHeight: function () {
            if (this.isVisible()) {
               var totalHeight = this._container.height();
               var content, $content;
               if (this._options.editorConfig.inline) {
                  $content = this._inputControl;
                  content = $content[0];
               }
               else {
                  content = this._tinyEditor.iframeElement;
               }
               if (cConstants.browser.isIE) {
                  $content = $content || $(content);
                  $content.css('height', '');
               }
               var contentHeight = content.scrollHeight;
               var isChanged = totalHeight !== this._lastTotalHeight || contentHeight !== this._lastContentHeight;
               // При вводе (при переводе на вторую строку) скрол-контейнер немного прокручивается внутри родительского контейнера - вернуть его на место
               // 1175034880 https://online.sbis.ru/opendoc.html?guid=ea5afa7c-f81d-4e53-9709-e10e3acc51e9
               this._scrollContainer[0].scrollTop = 0;
               if (cConstants.browser.isIE) {
                  // В MSIE при добавлении новой строки clientHeight и scrollHeight начинают расходиться - нужно их уравнять
                  // 1175015989 https://online.sbis.ru/opendoc.html?guid=d013f54f-683c-465c-b437-6adc64dc294a
                  var diff = contentHeight - content.clientHeight;
                  $content.css('height', 0 < diff ? content.offsetHeight + diff : content.offsetHeight);
                  if (isChanged) {
                     var parent = content.parentNode;
                     if (parent.clientHeight < contentHeight) {
                        // Также, если прокрутка уже задействована и текущий рэнж находится в самом низу области редактирования. Определяем это по
                        // расстоянию от нижнего края рэнжа до нижнего края области минус увеличение высоты (diff) и минус нижний отступ области
                        // редактирования - оно должно быть "небольшим", то есть меньше некоторого порогового значения (2)
                        var rect0 = content.getBoundingClientRect();
                        var rect1 = this._tinyEditor.selection.getBoundingClientRect();
                        if (rect0.bottom - rect1.bottom - diff - parseInt($content.css('padding-bottom')) < 2) {
                           var scrollTop = parent.scrollHeight - parent.offsetHeight;
                           if (parent.scrollTop < scrollTop) {
                              // И если при всём этом область редактирования недопрокручена до самого конца - подскролить её до конца
                              parent.scrollTop = scrollTop;
                           }
                        }
                     }
                  }
               }
               if (isChanged) {
                  this._lastTotalHeight = totalHeight;
                  this._lastContentHeight = contentHeight;
                  this._notifyOnSizeChanged();
               }
            }
         },

         //Метод проверяет положение элемента отпосительно клавитуры на ipad (true - под клавитурой, false - над)
         _elementIsUnderKeyboard: function(target, side){
            var
               targetOffset = target.getBoundingClientRect(),
               keyboardCoef = (window.innerHeight > window.innerWidth) ? constants.ipadCoefficient[side].vertical : constants.ipadCoefficient[side].horizontal; //Для альбома и портрета коэффициенты разные.
            return cConstants.browser.isMobileIOS && this.isEnabled() && targetOffset[side] > window.innerHeight * keyboardCoef;
         },

         //Метод обновляющий значение редактора в задизабленом состоянии
         //В данном методе происходит оборачивание ссылок в <a> или их декорирование, если указана декоратор
         _updateDataReview: function(text, isForced) {
            if (this._dataReview && (!this.isEnabled() || isForced) && (this._lastReview ==/*Не ===*/ null || this._lastReview !== text)) {
               // _lastReview Можно устанавливать только здесь, когда он реально помещается в DOM, (а не в конструкторе, не в init и не в onInit)
               // иначе проверку строкой выше не пройти. (И устанавливаем всегда строкой, даже если пришли null или undefined)
               this._lastReview = text || '';
               this._dataReview.html(this._prepareReviewContent(text));
            }
         },

         _prepareReviewContent: function(text) {
            if (text && text[0] !== '<') {
               text = '<p>' + text.replace(/\n/gi, '<br/>') + '</p>';
            }
            text = this._options._sanitizeClasses(text, true);
            return this._options.highlightLinks ? LinkWrap.wrapURLs(LinkWrap.wrapFiles(text), true) : text;
         },

         //установка значения в редактор
         _drawText: function(text) {
            var
               autoFormat = true;
            text =  this._prepareContent(text);
            if (!this._typeInProcess && text != this._curValue()) {
               //Подготовка значения если пришло не в html формате
               if (text && text[0] !== '<') {
                  text = '<p>' + text.replace(/\n/gi, '<br/>') + '</p>';
                  autoFormat = false;
               }
               text = this._replaceWhitespaces(text);
               if (this.isEnabled() && this._tinyReady.isReady()) {
                  this._tinyEditor.setContent(text, autoFormat ? undefined : {format: 'raw'});
                  this._tinyEditor.undoManager.add();
                  if (text) {
                     this.setCursorToTheEnd();
                  }
               } else {
                  text = text || '';
                  if (this._tinyReady.isReady()) {
                     this._tinyEditor.setContent(text);
                  } else {
                     this._inputControl.html(this._options._sanitizeClasses(text, true));
                  }
               }
            }
         },

         /**
          * Применить формат к выделенному текст
          * @param {string} format  имя формата
          * @param {string} value  значение формата
          * @private
          * функция взята из textColor плагина для tinyMCE:
          * https://github.com/tinymce/tinymce/commit/2adfc8dc5467c4af77ff0e5403d00ae33298ed52
          */
         _applyFormat : function(format, value) {
            this._tinyEditor.focus();
            this._tinyEditor.formatter.apply(format, {value: value});
            this._tinyEditor.nodeChanged();
            //тк на кнопках не случается focusout не происходит добавления состояния в историю
            this._tinyEditor.undoManager.add();
         },

         /**
          * Убрать формат выделенного текста
          * @param {string} format  имя формата
          * @private
          * функция взята из textColor плагина для tinyMCE:
          * https://github.com/tinymce/tinymce/commit/2adfc8dc5467c4af77ff0e5403d00ae33298ed52
          */
         _removeFormat : function(format, value) {
            this._tinyEditor.focus();
            this._tinyEditor.formatter.remove(format, {value: value}, null, true);
            this._tinyEditor.nodeChanged();
         },

         _focusOutHandler: function(){
            this.saveToHistory(this.getText());
            RichTextArea.superclass._focusOutHandler.apply(this, arguments);
         },

         /**
          * Инициализировать высоту основных элементов. Применяется только при отсутствии автоподстройки высоты (при фиксированой высоте)
          * @protected
          */
         _initMainHeight: function () {
            if (!this._options.autoHeight) {
               this._richTextAreaContainer.css('height', this._container.height());
               this._richTextAreaScrollContainer.css('height', this._container.height());
            }
         },

         //метод взят из link плагина тини
         _isOnlyTextSelected: function() {
            var html = this._tinyEditor.selection.getContent();
            return html.indexOf('<') === -1 || (html.indexOf('href=') !== -1 && /^<a [^>]+>[^<]+<\/a>$/.test(html));
            /*if (/</.test(html) && (!/^<a [^>]+>[^<]+<\/a>$/.test(html) || html.indexOf('href=') == -1)) {
               return false;
            }
            return true;*/
         },
         _sanitizeClasses: function(text, images) {
            var
                self = this;
            return Sanitize(text,
               {
                  validNodes: {
                     img: images,
                     table: {
                        border: true,
                        cellspacing: true,
                        cellpadding: true
                     }
                  },
                  validAttributes: {
                     'class' : function(content, attributeName) {
                        var
                           //проверка this._options для юнит тестов, тк там метод зовётся на прототипе
                           validateIsFunction = this._options && typeof this._options.validateClass === 'function',
                           currentValue = content.attributes[attributeName].value,
                           classes = currentValue.split(' '),
                           whiteList =  [
                              'titleText',
                              'subTitleText',
                              'additionalText',
                              'controls-RichEditor__noneditable',
                              //'without-margin',
                              'image-template-left',
                              'image-template-center',
                              'image-template-right',
                              'mce-object-iframe',
                              'ws-hidden',
                              'language-javascript',
                              'language-css',
                              'language-markup',
                              'language-php',
                              'token',
                              'comment',
                              'prolog',
                              'doctype',
                              'cdata',
                              'punctuation',
                              'namespace',
                              'property',
                              'tag',
                              'boolean',
                              'number',
                              'constant',
                              'symbol',
                              'deleted',
                              'selector',
                              'attr-name',
                              'string',
                              'char',
                              'builtin',
                              'inserted',
                              'operator',
                              'entity',
                              'url',
                              'style',
                              'attr-value',
                              'keyword',
                              'function',
                              'regex',
                              'important',
                              'variable',
                              'bold',
                              'italic',
                              'LinkDecorator__link',
                              'LinkDecorator',
                              'LinkDecorator__simpleLink',
                              'LinkDecorator__linkWrap',
                              'LinkDecorator__decoratedLink',
                              'LinkDecorator__wrap',
                              'LinkDecorator__image'
                           ],
                           index = classes.length - 1;

                        while (index >= 0) {
                           if (!~whiteList.indexOf(classes[index]) && (!validateIsFunction || !this._options.validateClass(classes[index]))) {
                              classes.splice(index, 1);
                           }
                           index -= 1;
                        }
                        currentValue = classes.join(' ');
                        if (currentValue) {
                           content.attributes[attributeName].value = currentValue;
                        } else {
                           delete content.attributes[attributeName];
                        }

                     }.bind(self)
                  },
                  checkDataAttribute: false,
                  escapeInvalidTags: false
               });
         },
         _getTextBeforePaste: function(editor){
            //Проблема:
            //          после вставки текста могут возникать пробелы после <br> в начале строки
            //Решение:
            //          разбить метод _tinyEditor.plugins.paste.clipboard.pasteText:
            //             a)Подготовка текста
            //             b)Вставка текста
            //          использовать метод подготовки текста - _tinyEditor.plugins.paste.clipboard.prepareTextBeforePaste
            return this._tinyEditor.plugins.paste.clipboard.prepareTextBeforePaste(editor, this._clipboardText);
         },
         _fillImages: function(state) {
            var
               temp = $('<div>' + this.getText() + '</div>');
            temp.find('img').toArray().forEach(function(image){
               var
                  uuid = this.checkImageUuid(image);
               if (uuid) {
                  this._images[uuid] = state;
               }
            }, this);
            return this._images;
         }

      });

      RichTextArea.EDITOR_MODULES = EDITOR_MODULES;

      return RichTextArea;
   });
