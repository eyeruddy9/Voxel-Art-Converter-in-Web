/**
 * Voxel Art Converter - 主应用程序
 * 协调所有模块的交互
 */

const App = {
    // 状态
    state: {
        image: null,
        processedImage: null,
        depth: null,
        blocks: null,
        voxelGrid: null,
        isProcessing: false
    },

    // DOM 元素引用
    elements: {},

    /**
     * 初始化应用
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initRenderer();
        this.updateUI();

        console.log('Voxel Art Converter 初始化完成');
    },

    /**
     * 缓存 DOM 元素引用
     */
    cacheElements() {
        this.elements = {
            // 上传
            uploadZone: document.getElementById('uploadZone'),
            fileInput: document.getElementById('fileInput'),
            uploadPlaceholder: document.getElementById('uploadPlaceholder'),
            previewImage: document.getElementById('previewImage'),

            // 设置
            resolution: document.getElementById('resolution'),
            resolutionValue: document.getElementById('resolutionValue'),
            depthScale: document.getElementById('depthScale'),
            depthScaleValue: document.getElementById('depthScaleValue'),
            palette: document.getElementById('palette'),
            fillMode: document.getElementById('fillMode'),

            // 按钮
            convertBtn: document.getElementById('convertBtn'),
            exportObj: document.getElementById('exportObj'),
            exportSchematic: document.getElementById('exportSchematic'),
            resetCamera: document.getElementById('resetCamera'),
            toggleWireframe: document.getElementById('toggleWireframe'),
            toggleLight: document.getElementById('toggleLight'),

            // 3D 预览
            canvasContainer: document.getElementById('canvasContainer'),
            renderCanvas: document.getElementById('renderCanvas'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText'),

            // 统计
            statsBlocks: document.getElementById('statsBlocks'),
            statsSize: document.getElementById('statsSize')
        };
    },

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        const { uploadZone, fileInput, resolution, depthScale,
            convertBtn, exportObj, exportSchematic,
            resetCamera, toggleWireframe, toggleLight } = this.elements;

        // 上传区域点击
        uploadZone.addEventListener('click', () => fileInput.click());

        // 文件选择
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 拖拽上传
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.loadImageFile(files[0]);
            }
        });

        // 滑块值更新
        resolution.addEventListener('input', () => {
            this.elements.resolutionValue.textContent = resolution.value;
        });

        depthScale.addEventListener('input', () => {
            this.elements.depthScaleValue.textContent = depthScale.value;
        });

        // 转换按钮
        convertBtn.addEventListener('click', () => this.convert());

        // 导出按钮
        exportObj.addEventListener('click', () => this.exportOBJ());
        exportSchematic.addEventListener('click', () => this.exportSchematic());

        // 预览控制按钮
        resetCamera.addEventListener('click', () => VoxelRenderer.resetCamera());

        toggleWireframe.addEventListener('click', () => {
            const isWireframe = VoxelRenderer.toggleWireframe();
            toggleWireframe.classList.toggle('active', isWireframe);
        });

        toggleLight.addEventListener('click', () => {
            const isLight = VoxelRenderer.toggleLight();
            toggleLight.classList.toggle('active', !isLight);
        });

        // 窗口大小变化时调整画布
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    /**
     * 初始化 3D 渲染器
     */
    initRenderer() {
        const { renderCanvas, canvasContainer } = this.elements;

        // 设置画布大小
        renderCanvas.width = canvasContainer.clientWidth;
        renderCanvas.height = canvasContainer.clientHeight;

        VoxelRenderer.init(renderCanvas);
    },

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        const { renderCanvas, canvasContainer } = this.elements;
        renderCanvas.width = canvasContainer.clientWidth;
        renderCanvas.height = canvasContainer.clientHeight;
        VoxelRenderer.resize(renderCanvas);
    },

    /**
     * 处理文件选择
     * @param {Event} e 
     */
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.loadImageFile(files[0]);
        }
    },

    /**
     * 加载图像文件
     * @param {File} file 
     */
    async loadImageFile(file) {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图像文件');
            return;
        }

        try {
            this.showLoading('正在加载图像...');

            const image = await ImageProcessor.loadImage(file);
            this.state.image = image;

            // 显示预览
            const thumbnail = ImageProcessor.createThumbnail(image);
            this.elements.previewImage.src = thumbnail;
            this.elements.previewImage.classList.add('visible');
            this.elements.uploadPlaceholder.style.display = 'none';

            // 启用转换按钮
            this.elements.convertBtn.disabled = false;

            this.hideLoading();
            console.log(`图像加载完成: ${image.width}x${image.height}`);
        } catch (error) {
            console.error('加载图像失败:', error);
            alert('加载图像失败: ' + error.message);
            this.hideLoading();
        }
    },

    /**
     * 执行转换
     */
    async convert() {
        if (!this.state.image || this.state.isProcessing) return;

        this.state.isProcessing = true;
        this.elements.convertBtn.disabled = true;

        try {
            const resolution = parseInt(this.elements.resolution.value);
            const depthScale = parseInt(this.elements.depthScale.value);
            const paletteName = this.elements.palette.value;
            const fillMode = this.elements.fillMode.value;

            // 1. 图像处理
            this.showLoading('正在处理图像...');
            await this.delay(50); // 让 UI 更新

            const processedImage = ImageProcessor.processImage(this.state.image, resolution);
            this.state.processedImage = processedImage;

            // 2. 深度估计
            this.showLoading('正在估计深度...');
            await this.delay(50);

            const depth = DepthEstimator.estimateDepth(processedImage);
            const smoothedDepth = DepthEstimator.smoothDepth(depth, 2);
            this.state.depth = smoothedDepth;

            // 3. 颜色映射
            this.showLoading('正在映射颜色...');
            await this.delay(50);

            const blocks = ImageProcessor.mapToBlocksWithDithering(
                processedImage.pixels,
                paletteName
            );
            this.state.blocks = blocks;

            // 4. 体素化
            this.showLoading('正在生成体素...');
            await this.delay(50);

            const voxelGrid = Voxelizer.createVoxelGrid({
                blocks,
                depth: smoothedDepth,
                depthScale,
                fillMode
            });

            // 5. 优化
            this.showLoading('正在优化模型...');
            await this.delay(50);

            const optimizedGrid = Voxelizer.optimizeGrid(voxelGrid);
            this.state.voxelGrid = optimizedGrid;

            // 6. 渲染
            this.showLoading('正在渲染...');
            await this.delay(50);

            VoxelRenderer.renderVoxels(optimizedGrid);

            // 7. 更新统计
            const stats = Voxelizer.getStats(optimizedGrid);
            this.elements.statsBlocks.textContent = `方块数: ${stats.totalVoxels}`;
            this.elements.statsSize.textContent = `尺寸: ${stats.dimensions}`;

            // 启用导出按钮
            this.elements.exportObj.disabled = false;
            this.elements.exportSchematic.disabled = false;

            this.hideLoading();
            console.log('转换完成:', stats);

        } catch (error) {
            console.error('转换失败:', error);
            alert('转换失败: ' + error.message);
            this.hideLoading();
        } finally {
            this.state.isProcessing = false;
            this.elements.convertBtn.disabled = false;
        }
    },

    /**
     * 导出 OBJ 文件
     */
    exportOBJ() {
        if (!this.state.voxelGrid) return;

        try {
            this.showLoading('正在生成 OBJ 文件...');

            const exportData = ObjExporter.export(this.state.voxelGrid, {
                filename: 'voxel_art',
                blockSize: 1,
                optimizeFaces: true
            });

            ObjExporter.download(exportData);

            this.hideLoading();
            console.log('OBJ 导出完成');
        } catch (error) {
            console.error('OBJ 导出失败:', error);
            alert('导出失败: ' + error.message);
            this.hideLoading();
        }
    },

    /**
     * 导出 Schematic 文件
     */
    exportSchematic() {
        if (!this.state.voxelGrid) return;

        try {
            this.showLoading('正在生成 Schematic 文件...');

            const exportData = SchematicExporter.export(this.state.voxelGrid, {
                filename: 'voxel_art'
            });

            SchematicExporter.download(exportData);

            this.hideLoading();
            console.log('Schematic 导出完成');
        } catch (error) {
            console.error('Schematic 导出失败:', error);
            alert('导出失败: ' + error.message);
            this.hideLoading();
        }
    },

    /**
     * 显示加载状态
     * @param {string} text 
     */
    showLoading(text) {
        this.elements.loadingOverlay.classList.add('visible');
        this.elements.loadingText.textContent = text;
    },

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        this.elements.loadingOverlay.classList.remove('visible');
        this.elements.loadingText.textContent = '准备就绪';
    },

    /**
     * 更新 UI 状态
     */
    updateUI() {
        // 初始状态
        this.elements.resolutionValue.textContent = this.elements.resolution.value;
        this.elements.depthScaleValue.textContent = this.elements.depthScale.value;
    },

    /**
     * 延迟函数 (用于 UI 更新)
     * @param {number} ms 
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
