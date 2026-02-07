/**
 * 深度估计模块 - 优化版
 * 使用多种传统计算机视觉算法估计图像深度
 * 新增: 显著性检测、纹理复杂度、梯度方向分析、双边滤波平滑
 */

const DepthEstimator = {
    /**
     * 估计图像的深度图
     * @param {Object} processedImage 处理后的图像数据
     * @returns {Array} 2D 深度值数组 (0-1)
     */
    estimateDepth(processedImage) {
        const { pixels, width, height } = processedImage;

        console.log('DepthEstimator: 开始深度估计...');

        // 1. 基础特征提取
        const luminance = this.computeLuminance(pixels);
        const edges = this.computeEdges(luminance, width, height);
        const blur = this.computeBlur(luminance, width, height);
        const saturation = this.computeSaturation(pixels);
        const position = this.computePositionCue(width, height);

        // 2. 高级特征提取 (新增)
        const saliency = this.computeSaliency(pixels, luminance, width, height);
        const texture = this.computeTextureComplexity(luminance, width, height);
        const gradient = this.computeGradientDirection(luminance, width, height);
        const colorContrast = this.computeColorContrast(pixels, width, height);

        // 3. 综合所有线索生成深度图
        const depth = this.combineDepthCues({
            luminance,
            edges,
            blur,
            saturation,
            position,
            saliency,
            texture,
            gradient,
            colorContrast,
            width,
            height,
            pixels
        });

        console.log('DepthEstimator: 深度估计完成');
        return depth;
    },

    /**
     * 计算每个像素的亮度
     */
    computeLuminance(pixels) {
        return pixels.map(row =>
            row.map(p => {
                if (!p || p.a < 128) return 0;
                return (0.299 * p.r + 0.587 * p.g + 0.114 * p.b) / 255;
            })
        );
    },

    /**
     * 使用 Sobel 算子计算边缘强度
     */
    computeEdges(luminance, width, height) {
        const edges = [];
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
                row.push(Math.min(1, magnitude * 1.5));
            }
            edges.push(row);
        }
        return edges;
    },

    /**
     * 使用 Laplacian 方差检测模糊程度
     */
    computeBlur(luminance, width, height) {
        const sharpness = [];
        const windowSize = 2;
        const laplacian = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x < windowSize || x >= width - windowSize ||
                    y < windowSize || y >= height - windowSize) {
                    row.push(0.5);
                    continue;
                }

                let sum = 0;
                let sumSq = 0;
                let count = 0;

                for (let wy = -windowSize; wy <= windowSize; wy++) {
                    for (let wx = -windowSize; wx <= windowSize; wx++) {
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
                row.push(Math.min(1, Math.sqrt(Math.abs(variance)) * 8));
            }
            sharpness.push(row);
        }
        return sharpness;
    },

    /**
     * 计算饱和度
     */
    computeSaturation(pixels) {
        return pixels.map(row =>
            row.map(p => {
                if (!p || p.a < 128) return 0;
                const r = p.r / 255, g = p.g / 255, b = p.b / 255;
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                if (max === 0) return 0;
                return (max - min) / max;
            })
        );
    },

    /**
     * 计算位置线索 - 改进版
     * 支持不同的图像类型（人像、风景等）
     */
    computePositionCue(width, height) {
        const position = [];
        const centerX = width / 2;
        const centerY = height / 2;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                // 底部权重
                const yWeight = y / (height - 1);
                
                // 中心权重 (使用高斯分布)
                const dx = (x - centerX) / (width / 2);
                const dy = (y - centerY) / (height / 2);
                const distFromCenter = Math.sqrt(dx * dx + dy * dy);
                const centerWeight = Math.exp(-distFromCenter * distFromCenter * 0.5);
                
                // 混合权重
                row.push(yWeight * 0.6 + centerWeight * 0.4);
            }
            position.push(row);
        }
        return position;
    },

    /**
     * 新增: 计算显著性图
     * 基于颜色对比度和空间分布
     */
    computeSaliency(pixels, luminance, width, height) {
        const saliency = [];
        
        // 计算全局平均颜色
        let avgR = 0, avgG = 0, avgB = 0, count = 0;
        for (const row of pixels) {
            for (const p of row) {
                if (p && p.a >= 128) {
                    avgR += p.r;
                    avgG += p.g;
                    avgB += p.b;
                    count++;
                }
            }
        }
        avgR /= count; avgG /= count; avgB /= count;

        // 计算每个像素与平均颜色的距离
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const p = pixels[y][x];
                if (!p || p.a < 128) {
                    row.push(0);
                    continue;
                }

                // 颜色距离
                const colorDist = Math.sqrt(
                    Math.pow(p.r - avgR, 2) +
                    Math.pow(p.g - avgG, 2) +
                    Math.pow(p.b - avgB, 2)
                ) / 441.67; // 最大距离 sqrt(255^2*3)

                // 局部对比度
                let localContrast = 0;
                let neighborCount = 0;
                const radius = 2;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const ny = y + dy, nx = x + dx;
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width && (dx !== 0 || dy !== 0)) {
                            const np = pixels[ny][nx];
                            if (np && np.a >= 128) {
                                localContrast += Math.abs(luminance[y][x] - luminance[ny][nx]);
                                neighborCount++;
                            }
                        }
                    }
                }
                localContrast = neighborCount > 0 ? localContrast / neighborCount : 0;

                // 组合显著性
                row.push(Math.min(1, colorDist * 0.6 + localContrast * 0.4));
            }
            saliency.push(row);
        }
        return saliency;
    },

    /**
     * 新增: 计算纹理复杂度
     * 有纹理的区域通常是前景物体
     */
    computeTextureComplexity(luminance, width, height) {
        const texture = [];
        const windowSize = 3;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x < windowSize || x >= width - windowSize ||
                    y < windowSize || y >= height - windowSize) {
                    row.push(0.5);
                    continue;
                }

                // 计算局部标准差
                let sum = 0;
                let sumSq = 0;
                let count = 0;

                for (let dy = -windowSize; dy <= windowSize; dy++) {
                    for (let dx = -windowSize; dx <= windowSize; dx++) {
                        const lum = luminance[y + dy][x + dx];
                        sum += lum;
                        sumSq += lum * lum;
                        count++;
                    }
                }

                const mean = sum / count;
                const variance = (sumSq / count) - (mean * mean);
                const stdDev = Math.sqrt(Math.max(0, variance));
                
                row.push(Math.min(1, stdDev * 4));
            }
            texture.push(row);
        }
        return texture;
    },

    /**
     * 新增: 计算梯度方向一致性
     * 用于检测物体边界和表面
     */
    computeGradientDirection(luminance, width, height) {
        const directionConsistency = [];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
                    row.push(0.5);
                    continue;
                }

                // 计算梯度
                const gx = luminance[y][x + 1] - luminance[y][x - 1];
                const gy = luminance[y + 1][x] - luminance[y - 1][x];
                
                // 梯度方向和强度
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                
                // 垂直梯度倾向于表示水平表面（较近）
                // 水平梯度倾向于表示垂直边缘
                const verticalBias = Math.abs(gy) / (magnitude + 0.001);
                
                row.push(Math.min(1, magnitude * 2 * (0.5 + verticalBias * 0.5)));
            }
            directionConsistency.push(row);
        }
        return directionConsistency;
    },

    /**
     * 新增: 计算颜色对比度
     * 高对比度区域通常是前景
     */
    computeColorContrast(pixels, width, height) {
        const contrast = [];
        const radius = 3;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const p = pixels[y][x];
                if (!p || p.a < 128) {
                    row.push(0);
                    continue;
                }

                let maxDiff = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const ny = y + dy, nx = x + dx;
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            const np = pixels[ny][nx];
                            if (np && np.a >= 128) {
                                const diff = Math.sqrt(
                                    Math.pow(p.r - np.r, 2) +
                                    Math.pow(p.g - np.g, 2) +
                                    Math.pow(p.b - np.b, 2)
                                );
                                maxDiff = Math.max(maxDiff, diff);
                            }
                        }
                    }
                }
                
                row.push(Math.min(1, maxDiff / 200));
            }
            contrast.push(row);
        }
        return contrast;
    },

    /**
     * 综合所有深度线索 - 优化版
     * 使用自适应权重
     */
    combineDepthCues(cues) {
        const { 
            luminance, edges, blur, saturation, position,
            saliency, texture, gradient, colorContrast,
            width, height, pixels 
        } = cues;

        const depth = [];

        // 自适应权重 - 根据图像特性调整
        const imageStats = this.analyzeImage(pixels, luminance, width, height);
        const weights = this.calculateAdaptiveWeights(imageStats);

        console.log('DepthEstimator: 使用自适应权重:', weights);

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                // 基础线索
                const lum = luminance[y][x];
                const edge = edges[y][x];
                const sharp = blur[y][x];
                const sat = saturation[y][x];
                const pos = position[y][x];
                
                // 高级线索
                const sal = saliency[y][x];
                const tex = texture[y][x];
                const grad = gradient[y][x];
                const contrast = colorContrast[y][x];

                // 综合计算深度值
                let d = 0;
                d += lum * weights.luminance;
                d += sharp * weights.blur;
                d += sat * weights.saturation;
                d += pos * weights.position;
                d += sal * weights.saliency;
                d += tex * weights.texture;
                d += grad * weights.gradient;
                d += contrast * weights.contrast;
                
                // 边缘作为深度边界增强
                d += edge * weights.edges * (1 + sal);

                row.push(Math.max(0, Math.min(1, d)));
            }
            depth.push(row);
        }

        // 应用边缘保持平滑
        const smoothed = this.bilateralFilter(depth, luminance, width, height);
        
        // 归一化
        return this.normalizeDepth(smoothed);
    },

    /**
     * 分析图像特性
     */
    analyzeImage(pixels, luminance, width, height) {
        let totalLuminance = 0;
        let totalSaturation = 0;
        let edgeCount = 0;
        let count = 0;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const p = pixels[y][x];
                if (p && p.a >= 128) {
                    totalLuminance += luminance[y][x];
                    
                    const r = p.r / 255, g = p.g / 255, b = p.b / 255;
                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                    totalSaturation += max > 0 ? (max - min) / max : 0;
                    
                    // 简单边缘检测
                    const diff = Math.abs(luminance[y][x] - luminance[y][x + 1]) +
                                Math.abs(luminance[y][x] - luminance[y + 1][x]);
                    if (diff > 0.1) edgeCount++;
                    
                    count++;
                }
            }
        }

        return {
            avgLuminance: count > 0 ? totalLuminance / count : 0.5,
            avgSaturation: count > 0 ? totalSaturation / count : 0.5,
            edgeDensity: count > 0 ? edgeCount / count : 0.5,
            isHighContrast: (totalLuminance / count) > 0.3 && (totalLuminance / count) < 0.7
        };
    },

    /**
     * 计算自适应权重
     */
    calculateAdaptiveWeights(stats) {
        const { avgLuminance, avgSaturation, edgeDensity, isHighContrast } = stats;

        // 基础权重
        let weights = {
            luminance: 0.15,
            edges: 0.10,
            blur: 0.15,
            saturation: 0.10,
            position: 0.15,
            saliency: 0.15,
            texture: 0.08,
            gradient: 0.06,
            contrast: 0.06
        };

        // 高饱和度图像 - 增加饱和度和显著性权重
        if (avgSaturation > 0.4) {
            weights.saturation *= 1.5;
            weights.saliency *= 1.3;
        }

        // 低对比度图像 - 增加边缘和位置权重
        if (!isHighContrast) {
            weights.position *= 1.3;
            weights.blur *= 1.2;
        }

        // 高边缘密度 - 增加纹理和边缘权重
        if (edgeDensity > 0.3) {
            weights.texture *= 1.4;
            weights.edges *= 1.3;
        }

        // 归一化权重
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        for (const key in weights) {
            weights[key] /= sum;
        }

        return weights;
    },

    /**
     * 新增: 双边滤波
     * 保持边缘的同时平滑深度图
     */
    bilateralFilter(depth, luminance, width, height) {
        const result = [];
        const spatialSigma = 2.0;
        const rangeSigma = 0.1;
        const windowSize = 3;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x < windowSize || x >= width - windowSize ||
                    y < windowSize || y >= height - windowSize) {
                    row.push(depth[y][x]);
                    continue;
                }

                let weightSum = 0;
                let valueSum = 0;
                const centerLum = luminance[y][x];

                for (let dy = -windowSize; dy <= windowSize; dy++) {
                    for (let dx = -windowSize; dx <= windowSize; dx++) {
                        const ny = y + dy, nx = x + dx;
                        
                        // 空间权重
                        const spatialWeight = Math.exp(-(dx * dx + dy * dy) / (2 * spatialSigma * spatialSigma));
                        
                        // 范围权重 (基于亮度相似性)
                        const lumDiff = luminance[ny][nx] - centerLum;
                        const rangeWeight = Math.exp(-(lumDiff * lumDiff) / (2 * rangeSigma * rangeSigma));
                        
                        const weight = spatialWeight * rangeWeight;
                        weightSum += weight;
                        valueSum += depth[ny][nx] * weight;
                    }
                }

                row.push(weightSum > 0 ? valueSum / weightSum : depth[y][x]);
            }
            result.push(row);
        }

        return result;
    },

    /**
     * 归一化深度图
     */
    normalizeDepth(depth) {
        let min = Infinity, max = -Infinity;

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
        return depth.map(row => row.map(d => (d - min) / range));
    },

    /**
     * 平滑深度图
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
                    let sum = 0, count = 0;

                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
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
     */
    quantizeDepth(depth, layers) {
        return depth.map(row =>
            row.map(d => Math.round(d * (layers - 1)))
        );
    }
};
