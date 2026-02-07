/**
 * 体素化模块
 * 将 2D 图像 + 深度图转换为 3D 体素网格
 */

const Voxelizer = {
    /**
     * 创建体素网格
     * @param {Object} options 配置选项
     * @param {Array} options.blocks 2D 方块数组
     * @param {Array} options.depth 2D 深度数组 (0-1)
     * @param {number} options.depthScale 深度缩放系数
     * @param {string} options.fillMode 填充模式 ('surface', 'solid', 'hollow')
     * @returns {Object} 体素网格数据
     */
    createVoxelGrid(options) {
        const { blocks, depth, depthScale, fillMode } = options;

        const height = blocks.length;
        const width = blocks[0].length;
        const maxDepth = depthScale;

        // 计算每个位置的深度值 (整数层)
        const quantizedDepth = DepthEstimator.quantizeDepth(depth, maxDepth);

        // 创建 3D 体素网格
        // 坐标系: x = 宽度, y = 高度 (图像上下翻转), z = 深度
        const voxels = [];
        let totalVoxels = 0;

        for (let iy = 0; iy < height; iy++) {
            for (let ix = 0; ix < width; ix++) {
                const block = blocks[iy][ix];
                if (!block) continue;

                // 图像 y 坐标翻转 (图像顶部 -> 3D 顶部)
                const x = ix;
                const y = height - 1 - iy;
                const baseDepth = quantizedDepth[iy][ix];

                if (fillMode === 'surface') {
                    // 仅表面: 只放一层方块
                    voxels.push({
                        x, y, z: baseDepth,
                        block
                    });
                    totalVoxels++;
                } else if (fillMode === 'solid') {
                    // 实心填充: 从 0 到 baseDepth 全部填充
                    for (let z = 0; z <= baseDepth; z++) {
                        voxels.push({
                            x, y, z,
                            block
                        });
                        totalVoxels++;
                    }
                } else if (fillMode === 'hollow') {
                    // 空心结构: 只放表面和底层
                    voxels.push({ x, y, z: baseDepth, block });
                    if (baseDepth > 0) {
                        voxels.push({ x, y, z: 0, block });
                    }
                    totalVoxels += baseDepth > 0 ? 2 : 1;
                }
            }
        }

        // 计算边界
        const bounds = this.calculateBounds(voxels);

        return {
            voxels,
            width,
            height,
            maxDepth,
            totalVoxels,
            bounds
        };
    },

    /**
     * 计算体素网格的边界
     * @param {Array} voxels 体素数组
     * @returns {Object} 边界信息
     */
    calculateBounds(voxels) {
        if (voxels.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (const v of voxels) {
            minX = Math.min(minX, v.x);
            maxX = Math.max(maxX, v.x);
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
            minZ = Math.min(minZ, v.z);
            maxZ = Math.max(maxZ, v.z);
        }

        return {
            minX, maxX,
            minY, maxY,
            minZ, maxZ,
            sizeX: maxX - minX + 1,
            sizeY: maxY - minY + 1,
            sizeZ: maxZ - minZ + 1
        };
    },

    /**
     * 创建用于快速查找的 3D 地图
     * @param {Array} voxels 体素数组
     * @returns {Map} 3D 位置到体素的映射
     */
    createVoxelMap(voxels) {
        const map = new Map();

        for (const v of voxels) {
            const key = `${v.x},${v.y},${v.z}`;
            map.set(key, v);
        }

        return map;
    },

    /**
     * 检测体素是否被完全包围 (用于优化渲染)
     * @param {Map} voxelMap 体素映射
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean} 是否被包围
     */
    isOccluded(voxelMap, x, y, z) {
        const neighbors = [
            [x - 1, y, z], [x + 1, y, z],
            [x, y - 1, z], [x, y + 1, z],
            [x, y, z - 1], [x, y, z + 1]
        ];

        for (const [nx, ny, nz] of neighbors) {
            const key = `${nx},${ny},${nz}`;
            if (!voxelMap.has(key)) {
                return false;
            }
        }

        return true;
    },

    /**
     * 获取每个面的可见性
     * @param {Map} voxelMap 体素映射
     * @param {Object} voxel 体素对象
     * @returns {Object} 每个面的可见性
     */
    getVisibleFaces(voxelMap, voxel) {
        const { x, y, z } = voxel;

        return {
            right: !voxelMap.has(`${x + 1},${y},${z}`),   // +X
            left: !voxelMap.has(`${x - 1},${y},${z}`),    // -X
            top: !voxelMap.has(`${x},${y + 1},${z}`),     // +Y
            bottom: !voxelMap.has(`${x},${y - 1},${z}`),  // -Y
            front: !voxelMap.has(`${x},${y},${z + 1}`),   // +Z
            back: !voxelMap.has(`${x},${y},${z - 1}`)     // -Z
        };
    },

    /**
     * 优化体素网格 (移除被遮挡的体素)
     * @param {Object} voxelGrid 体素网格数据
     * @returns {Object} 优化后的体素网格
     */
    optimizeGrid(voxelGrid) {
        const voxelMap = this.createVoxelMap(voxelGrid.voxels);
        const visibleVoxels = [];

        for (const voxel of voxelGrid.voxels) {
            if (!this.isOccluded(voxelMap, voxel.x, voxel.y, voxel.z)) {
                const faces = this.getVisibleFaces(voxelMap, voxel);
                visibleVoxels.push({
                    ...voxel,
                    faces
                });
            }
        }

        return {
            ...voxelGrid,
            voxels: visibleVoxels,
            totalVoxels: visibleVoxels.length,
            voxelMap
        };
    },

    /**
     * 生成体素统计信息
     * @param {Object} voxelGrid 体素网格数据
     * @returns {Object} 统计信息
     */
    getStats(voxelGrid) {
        const { voxels, bounds } = voxelGrid;

        // 统计每种方块的数量
        const blockCounts = new Map();
        for (const v of voxels) {
            const name = v.block.name;
            blockCounts.set(name, (blockCounts.get(name) || 0) + 1);
        }

        return {
            totalVoxels: voxels.length,
            dimensions: `${bounds.sizeX} × ${bounds.sizeY} × ${bounds.sizeZ}`,
            uniqueBlocks: blockCounts.size,
            blockCounts: Object.fromEntries(blockCounts)
        };
    }
};
