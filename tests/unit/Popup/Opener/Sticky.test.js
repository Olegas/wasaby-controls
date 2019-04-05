define(
   [
      'Controls/Popup/Opener/Sticky/StickyStrategy',
      'Controls/Popup/Opener/Sticky/StickyController',
      'Controls/Popup/Manager/ManagerController'
   ],
   (StickyStrategy, StickyController, ManagerController) => {
      'use strict';

      describe('Controls/Popup/Opener/Sticky', () => {
         var targetCoords = {
            top: 200,
            left: 200,
            bottom: 400,
            right: 400,
            width: 200,
            height: 200,
            leftScroll: 0,
            topScroll: 0
         };

         StickyStrategy._private.getWindowSizes = () => ({
            width: 1920,
            height: 1040
         });

         function getPositionConfig() {
            return {
               revertPositionStyle: true,
               corner: {
                  vertical: 'top',
                  horizontal: 'left'
               },
               align: {
                  vertical: {
                     side: 'top',
                     offset: 0
                  },
                  horizontal: {
                     side: 'right',
                     offset: 0
                  }
               },
               config: {},
               sizes: {
                  width: 200,
                  height: 200,
                  margins: {
                     top: 0,
                     left: 0
                  }
               }
            };
         }


         it('Centered sticky', () => {
            var position = StickyStrategy.getPosition({
               corner: {
                  vertical: 'bottom',
                  horizontal: 'center'
               },
               align: {
                  vertical: {
                     side: 'bottom',
                     offset: 0
                  },
                  horizontal: {
                     side: 'center',
                     offset: 0
                  }
               },
               config: {},
               sizes: {
                  width: 200,
                  height: 200,
                  margins: {
                     top: 0,
                     left: 0
                  }
               }
            }, targetCoords);
            assert.isTrue(position.top === 400);
            assert.isTrue(position.left === 200);
         });


         it('Sticky initializing state', () => {
            let itemConfig = {
               popupState: StickyController.POPUP_STATE_INITIALIZING
            };
            let destroyDef = StickyController._elementDestroyed(itemConfig);
            assert.equal(destroyDef.isReady(), true);
         });

         it('Sticky updated classes', () => {
            StickyController._private.isTargetVisible = () => true;
            let item = {
               position: {},
               popupOptions: {},
               sizes: {}
            };
            let container = {
               offsetWidth: 100,
               offsetHeight: 100
            };
            StickyController.elementCreated(item, container);
            assert.equal(typeof item.positionConfig, 'object'); // Конфиг сохранился
            assert.equal(item.sizes.width, 100); // Конфиг сохранился
            var classes = item.popupOptions.className;

            StickyController.elementUpdated(item, container);
            assert.equal(item.popupOptions.className, classes); // Классы не поменялись
         });

         it('Sticky check visible target on elementCreated', () => {
            StickyController._private.isTargetVisible = () => false;
            let isRemoveCalled = false;
            let ManagerControllerRemove = ManagerController.remove;
            ManagerController.remove = () => {
               isRemoveCalled = true;
            };
            StickyController.elementCreated({});
            assert.equal(isRemoveCalled, true);

            ManagerController.remove = ManagerControllerRemove;
            StickyController._private.isTargetVisible = () => true;
         });


         it('Sticky with option fittingMode=overflow', () => {
            let left = 1700;
            let right = 1900;
            let targetC = { ...targetCoords, left, right };

            var position = StickyStrategy.getPosition({
               fittingMode: 'overflow',
               corner: {
                  vertical: 'top',
                  horizontal: 'left'
               },
               align: {
                  vertical: {
                     side: 'top',
                     offset: 0
                  },
                  horizontal: {
                     side: 'right',
                     offset: 0
                  }
               },
               config: {},
               sizes: {
                  width: 400,
                  height: 400,
                  margins: {
                     top: 0,
                     left: 10
                  }
               }
            }, targetC);

            assert.equal(position.top, 0);
            assert.equal(position.left, 1520);
         });

         it('Sticky', () => {
            StickyStrategy._private.getWindowSizes = () => ({
               width: 1000,
               height: 1000
            });
            let cfg = getPositionConfig();

            // 1 position
            let position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.left, 200);
            assert.equal(position.bottom, 800);
            assert.equal(Object.keys(position).length, 2);

            // 2 position
            cfg = getPositionConfig();
            cfg.corner.horizontal = 'right';
            cfg.align.vertical.side = 'bottom';


            position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.left, 400);
            assert.equal(position.top, 200);
            assert.equal(Object.keys(position).length, 2);

            // 3 position
            cfg = getPositionConfig();
            cfg.corner.horizontal = 'right';
            cfg.corner.vertical = 'bottom';
            cfg.align.vertical.side = 'bottom';
            cfg.align.horizontal.side = 'left';

            position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.right, 600);
            assert.equal(position.top, 400);
            assert.equal(Object.keys(position).length, 2);

            // 4 position
            cfg = getPositionConfig();
            cfg.corner.horizontal = 'left';
            cfg.corner.vertical = 'bottom';
            cfg.align.vertical.side = 'top';
            cfg.align.horizontal.side = 'left';

            position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.right, 800);
            assert.equal(position.bottom, 600);
            assert.equal(Object.keys(position).length, 2);
         });

         it('Sticky with body scroll', () => {
            StickyStrategy._private.getWindowSizes = () => ({
               width: 1000,
               height: 1000
            });
            var targetC = {
               top: 400,
               left: 400,
               bottom: 410,
               right: 410,
               width: 10,
               height: 10,
               leftScroll: 50
            };

            // 3 position
            let cfg = getPositionConfig();
            cfg.corner.horizontal = 'right';
            cfg.corner.vertical = 'bottom';
            cfg.align.vertical.side = 'bottom';
            cfg.align.horizontal.side = 'left';
            let position = StickyStrategy.getPosition(cfg, targetC);
            assert.equal(position.top, 410);
            assert.equal(position.right, 640);
            assert.equal(Object.keys(position).length, 2);
         });


         it('Sticky with margins', () => {
            StickyStrategy._private.getWindowSizes = () => ({
               width: 1000,
               height: 1000
            });
            let cfg = getPositionConfig();
            cfg.corner.horizontal = 'right';
            cfg.align.vertical.side = 'bottom';
            cfg.sizes.margins.top = 10;
            cfg.sizes.margins.left = 10;

            let position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.left, 410);
            assert.equal(position.top, 210);
            assert.equal(Object.keys(position).length, 2);

            cfg = getPositionConfig();
            cfg.corner.horizontal = 'left';
            cfg.corner.vertical = 'bottom';
            cfg.align.vertical.side = 'top';
            cfg.align.horizontal.side = 'left';
            cfg.sizes.margins.top = 10;
            cfg.sizes.margins.left = 10;
            cfg.sizes.width = 100;
            cfg.sizes.height = 100;

            position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.right, 790);
            assert.equal(position.bottom, 590);
            assert.equal(Object.keys(position).length, 2);
         });

         it('Sticky revert position', () => {
            let cfg = getPositionConfig();
            cfg.sizes.height = 400;
            let position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.left, 200);
            assert.equal(position.top, 400);
            assert.equal(Object.keys(position).length, 2);

            cfg = getPositionConfig();
            cfg.sizes.width = 400;
            cfg.corner.horizontal = 'left';
            cfg.corner.vertical = 'bottom';
            cfg.align.vertical.side = 'top';
            cfg.align.horizontal.side = 'left';
            targetCoords.topScroll = 10;

            position = StickyStrategy.getPosition(cfg, targetCoords);
            targetCoords.topScroll = 0;
            assert.equal(position.left, 400);
            assert.equal(position.bottom, 620);
            assert.equal(Object.keys(position).length, 2);
         });

         it('Sticky fittingMode fixed', () => {
            StickyStrategy._private.getWindowSizes = () => ({
               width: 1000,
               height: 1000
            });
            let cfg = getPositionConfig();
            cfg.fittingMode = 'fixed';
            cfg.sizes.height = 400;
            let position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.left, 200);
            assert.equal(position.bottom, 800);
            assert.equal(position.height, 200);
            assert.equal(Object.keys(position).length, 3);

            cfg = getPositionConfig();
            cfg.fittingMode = 'fixed';
            cfg.sizes.width = 400;
            cfg.corner.horizontal = 'left';
            cfg.corner.vertical = 'bottom';
            cfg.align.vertical.side = 'top';
            cfg.align.horizontal.side = 'left';

            position = StickyStrategy.getPosition(cfg, targetCoords);
            assert.equal(position.right, 800);
            assert.equal(position.bottom, 600);
            assert.equal(position.width, 200);
            assert.equal(Object.keys(position).length, 3);
         });

         it('Sticky check overflow', () => {
            let popupCfg = { ...getPositionConfig() };
            let position = { right: 0 };
            let overflow = StickyStrategy._private.checkOverflow(popupCfg, targetCoords, position, 'horizontal');
            assert.equal(overflow, 0);
         });
      });
   }
);
