/**
 * 体素渲染器模块
 * 使用 Three.js 渲染 3D 体素模型
 * 采用 InstancedMesh 提高性能
 */

const VoxelRenderer = {
    // Three.js 组件
    scene: null,
    camera: null,
    renderer: null,
    controls: null,

    // 场景对象
    voxelMeshes: [],  // 多个 InstancedMesh (按颜色分组)
    lights: [],

    // 状态
    isInitialized: false,
    isWireframe: false,
    isLightEnabled: true,

    // 配置
    config: {
        blockSize: 1,
        backgroundColor: 0x1a1a2e,
        ambientLightColor: 0x808080,
        ambientLightIntensity: 1.2,
        directionalLightColor: 0xffffff,
        directionalLightIntensity: 1.0
    },

    /**
     * 初始化渲染器
     * @param {HTMLCanvasElement} canvas 目标画布
     */
    init(canvas) {
        if (this.isInitialized) {
            this.dispose();
        }

        console.log('VoxelRenderer: 开始初始化...');

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);

        // 创建相机
        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 600;
        const aspect = width / height;

        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 5000);
        this.camera.position.set(80, 60, 80);
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(this.config.backgroundColor, 1);

        // 创建轨道控制器
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 1000;
        this.controls.target.set(0, 0, 0);

        // 添加光照
        this.setupLights();

        // 监听窗口大小变化
        this.resizeHandler = () => this.onResize(canvas);
        window.addEventListener('resize', this.resizeHandler);

        this.isInitialized = true;

        // 开始动画循环
        this.animate();

        console.log('VoxelRenderer: 初始化完成');
    },

    /**
     * 设置光照
     */
    setupLights() {
        // 强环境光确保物体可见
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        // 主方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);

        // 补光
        const fillLight = new THREE.DirectionalLight(0xaaddff, 0.5);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
        this.lights.push(fillLight);

        // 底部补光
        const bottomLight = new THREE.DirectionalLight(0xffaa88, 0.3);
        bottomLight.position.set(0, -50, 0);
        this.scene.add(bottomLight);
        this.lights.push(bottomLight);
    },

    /**
     * 渲染体素网格 (使用 InstancedMesh)
     * @param {Object} voxelGrid 体素网格数据
     */
    renderVoxels(voxelGrid) {
        console.log('VoxelRenderer: renderVoxels 被调用');

        // 确保已初始化
        if (!this.isInitialized || !this.scene) {
            console.error('VoxelRenderer: 渲染器未初始化!');
            return;
        }

        // 清除旧的体素
        this.clearVoxels();

        const { voxels, bounds } = voxelGrid;
        if (!voxels || voxels.length === 0) {
            console.warn('VoxelRenderer: 没有体素数据可渲染');
            return;
        }

        console.log(`VoxelRenderer: 开始渲染 ${voxels.length} 个体素...`);
        console.log('VoxelRenderer: bounds =', bounds);

        // 按颜色分组体素
        const colorGroups = new Map();

        for (const voxel of voxels) {
            if (!voxel || !voxel.block || !voxel.block.color) {
                continue;
            }

            const colorKey = voxel.block.color.join(',');
            if (!colorGroups.has(colorKey)) {
                colorGroups.set(colorKey, {
                    color: voxel.block.color,
                    voxels: []
                });
            }
            colorGroups.get(colorKey).voxels.push(voxel);
        }

        console.log(`VoxelRenderer: 分成 ${colorGroups.size} 个颜色组`);

        if (colorGroups.size === 0) {
            console.warn('VoxelRenderer: 颜色分组为空');
            return;
        }

        // 计算中心偏移
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const centerZ = (bounds.minZ + bounds.maxZ) / 2;

        console.log(`VoxelRenderer: 中心点 = (${centerX}, ${centerY}, ${centerZ})`);

        // 创建共享的方块几何体
        const blockSize = this.config.blockSize;
        const boxGeometry = new THREE.BoxGeometry(
            blockSize * 0.92,
            blockSize * 0.92,
            blockSize * 0.92
        );

        // 为每种颜色创建 InstancedMesh
        for (const [colorKey, group] of colorGroups) {
            const count = group.voxels.length;
            if (count === 0) continue;

            // 创建材质
            const color = new THREE.Color(
                group.color[0] / 255,
                group.color[1] / 255,
                group.color[2] / 255
            );

            const material = new THREE.MeshLambertMaterial({
                color: color,
                wireframe: this.isWireframe
            });

            // 创建 InstancedMesh
            const instancedMesh = new THREE.InstancedMesh(boxGeometry, material, count);

            // 创建矩阵并设置每个实例的位置
            const dummy = new THREE.Object3D();

            for (let i = 0; i < count; i++) {
                const voxel = group.voxels[i];

                // 计算相对于中心的位置
                dummy.position.set(
                    (voxel.x - centerX) * blockSize,
                    (voxel.y - centerY) * blockSize,
                    (voxel.z - centerZ) * blockSize
                );
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i, dummy.matrix);
            }

            instancedMesh.instanceMatrix.needsUpdate = true;
            instancedMesh.frustumCulled = false; // 禁用视锥剔除确保可见

            this.scene.add(instancedMesh);
            this.voxelMeshes.push(instancedMesh);
        }

        // 调整相机位置
        this.fitCameraToObject(bounds);

        console.log(`VoxelRenderer: 渲染完成，创建了 ${this.voxelMeshes.length} 个 InstancedMesh`);

        // 强制渲染一帧
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    /**
     * 清除所有体素网格
     */
    clearVoxels() {
        if (!this.scene) return;

        for (const mesh of this.voxelMeshes) {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
        this.voxelMeshes = [];
    },

    /**
     * 调整相机以适应对象
     * @param {Object} bounds 边界信息
     */
    fitCameraToObject(bounds) {
        if (!bounds || !this.camera || !this.controls) return;

        const sizeX = (bounds.sizeX || 1) * this.config.blockSize;
        const sizeY = (bounds.sizeY || 1) * this.config.blockSize;
        const sizeZ = (bounds.sizeZ || 1) * this.config.blockSize;

        const maxDim = Math.max(sizeX, sizeY, sizeZ);
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = (maxDim / 2) / Math.tan(fov / 2) * 2.0;

        console.log(`VoxelRenderer: 尺寸 = ${sizeX}x${sizeY}x${sizeZ}, 相机距离 = ${distance}`);

        this.camera.position.set(
            distance * 0.8,
            distance * 0.6,
            distance * 0.8
        );

        this.controls.target.set(0, 0, 0);
        this.controls.update();

        // 更新裁剪面
        this.camera.near = 0.1;
        this.camera.far = distance * 10;
        this.camera.updateProjectionMatrix();
    },

    /**
     * 重置相机视角
     */
    resetCamera() {
        if (this.voxelMeshes.length === 0) return;

        // 计算边界盒
        const box = new THREE.Box3();
        for (const mesh of this.voxelMeshes) {
            mesh.geometry.computeBoundingBox();
            box.expandByObject(mesh);
        }

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const fov = this.camera.fov * (Math.PI / 180);
        const distance = (maxDim / 2) / Math.tan(fov / 2) * 2.0;

        this.camera.position.set(
            center.x + distance * 0.8,
            center.y + distance * 0.6,
            center.z + distance * 0.8
        );

        this.controls.target.copy(center);
        this.controls.update();
    },

    /**
     * 切换线框模式
     */
    toggleWireframe() {
        this.isWireframe = !this.isWireframe;

        for (const mesh of this.voxelMeshes) {
            if (mesh.material) {
                mesh.material.wireframe = this.isWireframe;
            }
        }

        return this.isWireframe;
    },

    /**
     * 切换光照
     */
    toggleLight() {
        this.isLightEnabled = !this.isLightEnabled;

        for (const light of this.lights) {
            if (light instanceof THREE.DirectionalLight) {
                light.intensity = this.isLightEnabled ? 1.0 : 0;
            }
        }

        return this.isLightEnabled;
    },

    /**
     * 动画循环
     */
    animate() {
        if (!this.isInitialized) return;

        requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    /**
     * 窗口大小变化处理
     * @param {HTMLCanvasElement} canvas 
     */
    onResize(canvas) {
        if (!this.isInitialized) return;

        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 600;

        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }

        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
    },

    /**
     * 手动触发大小调整
     * @param {HTMLCanvasElement} canvas 
     */
    resize(canvas) {
        this.onResize(canvas);
    },

    /**
     * 获取当前渲染的截图
     * @returns {string} Data URL
     */
    captureScreenshot() {
        if (!this.renderer) return null;

        this.renderer.render(this.scene, this.camera);
        return this.renderer.domElement.toDataURL('image/png');
    },

    /**
     * 清理资源
     */
    dispose() {
        if (!this.isInitialized) return;

        window.removeEventListener('resize', this.resizeHandler);

        this.clearVoxels();

        for (const light of this.lights) {
            if (this.scene) this.scene.remove(light);
        }
        this.lights = [];

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.isInitialized = false;
    }
};
