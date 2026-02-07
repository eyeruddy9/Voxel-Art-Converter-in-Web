/**
 * 深度估计模块
 * 使用传统计算机视觉算法估计图像深度
 */

const DepthEstimator = {
    /**
     * 估计图像的深度图
     * @param {Object} processedImage 处理后的图像数据
     * @returns {Array} 2D 深度值数组 (0-1)
     */
    estimateDepth(processedImage) {
        const { pixels, width, height } = processedImage;

        // 1. 计算亮度图
        const luminance = this.computeLuminance(pixels);

        // 2. 计算边缘强度 (Sobel)
        const edges = this.computeEdges(luminance, width, height);

        // 3. 计算模糊程度 (Laplacian 方差)
        const blur = this.computeBlur(luminance, width, height);

        // 4. 计算饱和度
        const saturation = this.computeSaturation(pixels);

        // 5. 计算相对大小/位置线索
        const position = this.computePositionCue(width, height);

        // 6. 综合所有线索生成深度图
        const depth = this.combineDepthCues({
            luminance,
            edges,
            blur,
            saturation,
            position,
            width,
            height
        });

        return depth;
    },

    /**
     * 计算每个像素的亮度
     * @param {Array} pixels 2D 像素数组
     * @returns {Array} 2D 亮度数组 (0-1)
     */
    computeLuminance(pixels) {
        return pixels.map(row =>
            row.map(p => {
                if (!p || p.a < 128) return 0;
                // 使用感知亮度公式
                return (0.299 * p.r + 0.587 * p.g + 0.114 * p.b) / 255;
            })
        );
    },

    /**
     * 使用 Sobel 算子计算边缘强度
     * @param {Array} luminance 2D 亮度数组
     * @param {number} width 
     * @param {number} height 
     * @returns {Array} 2D 边缘强度数组 (0-1)
     */
    computeEdges(luminance, width, height) {
        const edges = [];

        // Sobel 算子
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    row.push(0);
                    continue;
                }

                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const lum = luminance[y + ky][x + kx];
                        gx += lum * sobelX[ky + 1][kx + 1];
                        gy += lum * sobelY[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                row.push(Math.min(1, magnitude));
            }
            edges.push(row);
        }

        return edges;
    },

    /**
     * 使用 Laplacian 方差检测模糊程度
     * 模糊区域通常是背景 (远处)
     * @param {Array} luminance 2D 亮度数组
     * @param {number} width 
     * @param {number} height 
     * @returns {Array} 2D 清晰度数组 (0-1, 1=清晰)
     */
    computeBlur(luminance, width, height) {
        const sharpness = [];
        const windowSize = 3;

        // Laplacian 算子
        const laplacian = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x < windowSize || x >= width - windowSize ||
                    y < windowSize || y >= height - windowSize) {
                    row.push(0.5);
                    continue;
                }

                // 计算局部 Laplacian 方差
                let sum = 0;
                let sumSq = 0;
                let count = 0;

                for (let wy = -windowSize; wy <= windowSize; wy++) {
                    for (let wx = -windowSize; wx <= windowSize; wx++) {
                        // 应用 Laplacian
                        let lap = 0;
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const ly = y + wy + ky;
                                const lx = x + wx + kx;
                                if (ly >= 0 && ly < height && lx >= 0 && lx < width) {
                                    lap += luminance[ly][lx] * laplacian[ky + 1][kx + 1];
                                }
                            }
                        }
                        sum += lap;
                        sumSq += lap * lap;
                        count++;
                    }
                }

                const variance = (sumSq / count) - Math.pow(sum / count, 2);
                // 归一化方差作为清晰度指标
                row.push(Math.min(1, Math.sqrt(Math.abs(variance)) * 10));
            }
            sharpness.push(row);
        }

        return sharpness;
    },

    /**
     * 计算饱和度
     * 高饱和度通常表示前景
     * @param {Array} pixels 2D 像素数组
     * @returns {Array} 2D 饱和度数组 (0-1)
     */
    computeSaturation(pixels) {
        return pixels.map(row =>
            row.map(p => {
                if (!p || p.a < 128) return 0;

                const r = p.r / 255;
                const g = p.g / 255;
                const b = p.b / 255;

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);

                if (max === 0) return 0;
                return (max - min) / max;
            })
        );
    },

    /**
     * 计算位置线索
     * 图像底部通常是前景，顶部是背景
     * @param {number} width 
     * @param {number} height 
     * @returns {Array} 2D 位置权重数组 (0-1)
     */
    computePositionCue(width, height) {
        const position = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            // 底部 = 1 (近), 顶部 = 0 (远)
            const yWeight = y / (height - 1);

            for (let x = 0; x < width; x++) {
                // 中心略微靠前
                const xCenter = Math.abs(x - width / 2) / (width / 2);
                const centerWeight = 1 - xCenter * 0.3;

                row.push(yWeight * centerWeight);
            }
            position.push(row);
        }

        return position;
    },

    /**
     * 综合所有深度线索
     * @param {Object} cues 各种线索
     * @returns {Array} 2D 深度图 (0-1, 0=远, 1=近)
     */
    combineDepthCues({ luminance, edges, blur, saturation, position, width, height }) {
        const depth = [];

        // 权重配置
        const weights = {
            luminance: 0.25,    // 亮度
            edges: 0.15,        // 边缘 (边缘强的区域可能是物体边界)
            blur: 0.25,         // 清晰度
            saturation: 0.15,   // 饱和度
            position: 0.20      // 位置
        };

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const lum = luminance[y][x];
                const edge = edges[y][x];
                const sharp = blur[y][x];
                const sat = saturation[y][x];
                const pos = position[y][x];

                // 综合计算深度值
                let d = 0;
                d += lum * weights.luminance;           // 亮 = 近
                d += edge * weights.edges * 0.5;        // 边缘适中
                d += sharp * weights.blur;              // 清晰 = 近
                d += sat * weights.saturation;          // 高饱和 = 近
                d += pos * weights.position;            // 底部/中心 = 近

                row.push(Math.max(0, Math.min(1, d)));
            }
            depth.push(row);
        }

        // 归一化深度图
        return this.normalizeDepth(depth);
    },

    /**
     * 归一化深度图到 0-1 范围
     * @param {Array} depth 2D 深度数组
     * @returns {Array} 归一化后的深度数组
     */
    normalizeDepth(depth) {
        let min = Infinity;
        let max = -Infinity;

        for (const row of depth) {
            for (const d of row) {
                if (d < min) min = d;
                if (d > max) max = d;
            }
        }

        if (max === min) {
            return depth.map(row => row.map(() => 0.5));
        }

        const range = max - min;
        return depth.map(row =>
            row.map(d => (d - min) / range)
        );
    },

    /**
     * 平滑深度图
     * @param {Array} depth 2D 深度数组
     * @param {number} iterations 平滑迭代次数
     * @returns {Array} 平滑后的深度数组
     */
    smoothDepth(depth, iterations = 2) {
        let result = depth;

        for (let i = 0; i < iterations; i++) {
            const smoothed = [];
            const height = result.length;
            const width = result[0].length;

            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    let count = 0;

                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                sum += result[ny][nx];
                                count++;
                            }
                        }
                    }

                    row.push(sum / count);
                }
                smoothed.push(row);
            }

            result = smoothed;
        }

        return result;
    },

    /**
     * 量化深度到指定层数
     * @param {Array} depth 2D 深度数组 (0-1)
     * @param {number} layers 层数
     * @returns {Array} 量化后的深度数组 (整数)
     */
    quantizeDepth(depth, layers) {
        return depth.map(row =>
            row.map(d => Math.round(d * (layers - 1)))
        );
    }
};
