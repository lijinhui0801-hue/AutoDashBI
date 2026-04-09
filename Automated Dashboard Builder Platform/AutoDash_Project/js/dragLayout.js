/**
 * 模块：交互式画布布局引擎
 * // 修改：无损植入智能吸附引擎 (10px阈值，蓝色辅助线)
 */
const DragLayout = {
    state: {
        mode: 'idle', startX: 0, startY: 0, boxElem: null,
        targetElements: [], initialRects: [], otherRects: [], boxArmed: false, didMutate: false
    },
    // // 新增：严格设定吸附阈值为 10px
    SNAP_THRESHOLD: 10,

    init: function() {
        this.initSidebarDragDrop();
        this.initCanvasInteractions();
    },

    initSidebarDragDrop: function() {
        const dragItems = document.querySelectorAll('.drag-item');
        const dropZone = document.getElementById('dashboardCanvas');
        const wrapper = document.querySelector('.main-canvas-wrapper');

        dragItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', e.target.getAttribute('data-type'));
                const textStr = (e.target.innerText || e.target.textContent || '').trim();
                e.dataTransfer.setData('title', textStr.substring(textStr.indexOf(' ') + 1));
            });
        });

        wrapper.addEventListener('dragover', (e) => e.preventDefault());

        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type');
            const title = e.dataTransfer.getData('title') || '新图表';
            if (type) {
                const rect = dropZone.getBoundingClientRect();
                const x = e.clientX - rect.left + (dropZone.scrollLeft || 0) - 200;
                const y = e.clientY - rect.top + (dropZone.scrollTop || 0) - 150;
                App.addComponentToCanvas(type, Math.max(0, x), Math.max(0, y), title);
            }
        });
    },

    initCanvasInteractions: function() {
        const canvas = document.getElementById('dashboardCanvas');
        const wrapper = document.querySelector('.main-canvas-wrapper');

        canvas.addEventListener('mousedown', (e) => {
            if (e.target.closest('.delete-btn') || e.target.tagName === 'INPUT') return;

            const container = e.target.closest('.chart-container');
            const isResizeHandle = e.target.classList.contains('resize-handle');
            const isDragHandle = !!e.target.closest('.drag-handle') || !!e.target.closest('.component-topbar') || !!e.target.closest('.echart-box');

            this.state.startX = e.clientX;
            this.state.startY = e.clientY;
            this.state.didMutate = false;

            if (isResizeHandle) {
                this.state.mode = 'resizing';
                this.state.targetElements = [container];
                this.recordInitialRects();
                e.stopPropagation();
            }
            else if (container) {
                const id = container.id.replace('_wrapper', '');

                if (e.ctrlKey || e.shiftKey || e.metaKey) {
                    if (App.selectedComponentIds.includes(id)) {
                        App.selectedComponentIds = App.selectedComponentIds.filter(i => i !== id);
                    } else { App.selectedComponentIds.push(id); }
                } else {
                    if (!App.selectedComponentIds.includes(id)) {
                        App.selectedComponentIds = [id];
                    }
                }

                App.updateSelectionUI();
                App.bringComponentToFront(id);

                if (isDragHandle) {
                    this.state.mode = 'dragging';
                    this.state.targetElements = App.selectedComponentIds.map(sid => document.getElementById(sid + '_wrapper'));
                    this.recordInitialRects();
                    document.body.classList.add('is-dragging');
                } else {
                    this.state.mode = 'idle';
                    this.state.targetElements = [];
                    this.state.initialRects = [];
                    this.state.otherRects = [];
                }
            }
            else {
                this.state.mode = 'boxing';
                this.state.boxElem = document.createElement('div');
                this.state.boxElem.className = 'selection-box';
                this.state.boxArmed = false;
            }
        }, true);

        document.addEventListener('mousemove', (e) => {
            if (this.state.mode === 'idle') return;

            let dx = e.clientX - this.state.startX;
            let dy = e.clientY - this.state.startY;

            // // 新增/修改：智能吸附计算逻辑拦截
            if (this.state.targetElements.length === 1 && (this.state.mode === 'dragging' || this.state.mode === 'resizing')) {
                const rect = this.state.initialRects[0];
                let targetL = rect.left + (this.state.mode === 'dragging' ? dx : 0);
                let targetT = rect.top + (this.state.mode === 'dragging' ? dy : 0);
                let targetW = rect.width + (this.state.mode === 'resizing' ? dx : 0);
                let targetH = rect.height + (this.state.mode === 'resizing' ? dy : 0);

                const snapResult = this.calculateSnap(targetL, targetT, targetW, targetH);

                if (this.state.mode === 'dragging') {
                    dx += snapResult.offsetX; dy += snapResult.offsetY;
                } else {
                    dx += snapResult.offsetX; dy += snapResult.offsetY;
                }
                this.drawSnapLines(snapResult.lines);
            }

            // 执行 DOM 更新
            if (this.state.mode === 'dragging') {
                if (dx !== 0 || dy !== 0) this.state.didMutate = true;
                this.state.targetElements.forEach((el, index) => {
                    const rect = this.state.initialRects[index];
                    el.style.left = `${Math.max(0, rect.left + dx)}px`;
                    el.style.top = `${Math.max(0, rect.top + dy)}px`;
                });
            }
            else if (this.state.mode === 'resizing') {
                if (dx !== 0 || dy !== 0) this.state.didMutate = true;
                const el = this.state.targetElements[0];
                const rect = this.state.initialRects[0];
                el.style.width = `${Math.max(200, rect.width + dx)}px`;
                el.style.height = `${Math.max(150, rect.height + dy)}px`;
            }
            else if (this.state.mode === 'boxing') {
                if (!this.state.boxArmed && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
                if (!this.state.boxArmed) {
                    this.state.boxArmed = true;
                    App.selectedComponentIds = [];
                    App.updateSelectionUI();
                    canvas.appendChild(this.state.boxElem);
                }
                const canvasRect = canvas.getBoundingClientRect();
                const left = Math.min(e.clientX, this.state.startX) - canvasRect.left + (canvas.scrollLeft || 0);
                const top = Math.min(e.clientY, this.state.startY) - canvasRect.top + (canvas.scrollTop || 0);
                this.state.boxElem.style.left = `${left}px`;
                this.state.boxElem.style.top = `${top}px`;
                this.state.boxElem.style.width = `${Math.abs(dx)}px`;
                this.state.boxElem.style.height = `${Math.abs(dy)}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.state.mode === 'idle') return;
            document.body.classList.remove('is-dragging');
            this.clearSnapLines(); // // 修改：松手时务必清除蓝线

            if (this.state.mode === 'boxing') {
                if (this.state.boxArmed) {
                    const boxRect = this.state.boxElem.getBoundingClientRect();
                    document.querySelectorAll('.chart-container').forEach(el => {
                        const elRect = el.getBoundingClientRect();
                        if (!(boxRect.right < elRect.left || boxRect.left > elRect.right || boxRect.bottom < elRect.top || boxRect.top > elRect.bottom)) {
                            App.selectedComponentIds.push(el.id.replace('_wrapper', ''));
                        }
                    });
                    App.updateSelectionUI();
                    this.state.boxElem.remove();
                }
            }

            if (this.state.mode === 'dragging' && this.state.didMutate && typeof App.recordHistoryStep === 'function') App.recordHistoryStep('移动组件');
            if (this.state.mode === 'resizing' && this.state.didMutate && typeof App.recordHistoryStep === 'function') App.recordHistoryStep('调整组件尺寸');

            this.state.mode = 'idle';
            this.state.targetElements = [];
            this.state.initialRects = [];
            this.state.otherRects = [];
            this.state.boxArmed = false;
            this.state.didMutate = false;
        });
    },

    // // 新增/修改：收集静止图表用于吸附计算
    recordInitialRects: function() {
        this.state.initialRects = this.state.targetElements.map(el => ({
            left: parseInt(el.style.left) || 0, top: parseInt(el.style.top) || 0,
            width: parseInt(el.style.width) || el.offsetWidth, height: parseInt(el.style.height) || el.offsetHeight
        }));

        this.state.otherRects = [];
        document.querySelectorAll('.chart-container').forEach(el => {
            const id = el.id.replace('_wrapper', '');
            if (!App.selectedComponentIds.includes(id)) {
                this.state.otherRects.push({
                    left: parseInt(el.style.left) || 0, top: parseInt(el.style.top) || 0,
                    right: (parseInt(el.style.left) || 0) + el.offsetWidth, bottom: (parseInt(el.style.top) || 0) + el.offsetHeight,
                    centerX: (parseInt(el.style.left) || 0) + el.offsetWidth / 2, centerY: (parseInt(el.style.top) || 0) + el.offsetHeight / 2
                });
            }
        });
    },

    // // 新增/修改：核心吸附算法 (<10px触发)
    calculateSnap: function(targetL, targetT, targetW, targetH) {
        let offsetX = 0, offsetY = 0; let lines = [];
        const targetR = targetL + targetW, targetB = targetT + targetH;
        const targetCX = targetL + targetW / 2, targetCY = targetT + targetH / 2;

        const checkSnap = (val, refVal, type, linePos, start, end) => {
            if (Math.abs(val - refVal) < this.SNAP_THRESHOLD) {
                lines.push({ type, pos: linePos, start, end });
                return refVal - val;
            } return 0;
        };

        for (let other of this.state.otherRects) {
            // X轴：左对齐，右对齐，中心对齐
            if (!offsetX) offsetX = checkSnap(targetL, other.left, 'v', other.left, Math.min(targetT, other.top), Math.max(targetB, other.bottom));
            if (!offsetX) offsetX = checkSnap(targetL, other.right, 'v', other.right, Math.min(targetT, other.top), Math.max(targetB, other.bottom));
            if (!offsetX) offsetX = checkSnap(targetR, other.right, 'v', other.right, Math.min(targetT, other.top), Math.max(targetB, other.bottom));
            if (!offsetX) offsetX = checkSnap(targetR, other.left, 'v', other.left, Math.min(targetT, other.top), Math.max(targetB, other.bottom));
            if (!offsetX) offsetX = checkSnap(targetCX, other.centerX, 'v', other.centerX, Math.min(targetT, other.top), Math.max(targetB, other.bottom));

            // Y轴：顶对齐，底对齐，中心对齐
            if (!offsetY) offsetY = checkSnap(targetT, other.top, 'h', other.top, Math.min(targetL, other.left), Math.max(targetR, other.right));
            if (!offsetY) offsetY = checkSnap(targetT, other.bottom, 'h', other.bottom, Math.min(targetL, other.left), Math.max(targetR, other.right));
            if (!offsetY) offsetY = checkSnap(targetB, other.bottom, 'h', other.bottom, Math.min(targetL, other.left), Math.max(targetR, other.right));
            if (!offsetY) offsetY = checkSnap(targetB, other.top, 'h', other.top, Math.min(targetL, other.left), Math.max(targetR, other.right));
            if (!offsetY) offsetY = checkSnap(targetCY, other.centerY, 'h', other.centerY, Math.min(targetL, other.left), Math.max(targetR, other.right));
            if (offsetX && offsetY) break;
        }
        return { offsetX, offsetY, lines };
    },

    // // 新增/修改：绘制蓝色吸附线
    drawSnapLines: function(lines) {
        this.clearSnapLines();
        const canvas = document.getElementById('dashboardCanvas');
        lines.forEach(line => {
            const div = document.createElement('div');
            div.className = `snap-line snap-line-${line.type}`;
            if (line.type === 'v') {
                div.style.left = `${line.pos}px`; div.style.top = `${line.start - 50}px`; div.style.height = `${(line.end - line.start) + 100}px`;
            } else {
                div.style.top = `${line.pos}px`; div.style.left = `${line.start - 50}px`; div.style.width = `${(line.end - line.start) + 100}px`;
            }
            canvas.appendChild(div);
        });
    },
    clearSnapLines: function() { document.querySelectorAll('.snap-line').forEach(el => el.remove()); }
};

window.DragLayout = DragLayout;

