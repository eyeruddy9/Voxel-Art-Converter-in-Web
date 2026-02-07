/**
 * 深度估计模块 - 增强版
 * 结合传统 CV 算法和前景/背景分割
 * 确保背景下凹，主体上凸
 */

const DepthEstimator = {
    /**
     * 估计图像的深度图
     * @param {Object} processedImage 处理后的图像数据
     * @returns {Array} 2D 深度值数组 (0-1)
     */
    estimateDepth(processedImage) {
        const { pixels, width, height } = processedImage;

        console.log('DepthEstimator: 开始增强深度估计...');

        // 1. 基础特征提取
        const luminance = this.computeLuminance(pixels);
        const edges = this.computeEdges(luminance, width, height);
        const saturation = this.computeSaturation(pixels);

        // 2. 前景/背景分割 (核心改进)
        const foregroundMask = this.segmentForeground(pixels, luminance, edges, saturation, width, height);

        // 3. 高级特征
        const saliency = this.computeSaliency(pixels, luminance, width, height);
        const colorContrast = this.computeColorContrast(pixels, width, height);
        const centerBias = this.computeCenterBias(width, height);

        // 4. 综合生成深度图
        const depth = this.combineWithSegmentation({
            foregroundMask,
            luminance,
            edges,
            saturation,
            saliency,
            colorContrast,
            centerBias,
            pixels,
            width,
            height
        });

        // 5. 平滑处理
        const smoothed = this.edgeAwareSmooth(depth, edges, width, height);

        console.log('DepthEstimator: 深度估计完成');
        return smoothed;
    },

    /**
     * 计算亮度
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
     * Sobel 边缘检测
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
                row.push(Math.min(1, Math.sqrt(gx * gx + gy * gy) * 2));
            }
            edges.push(row);
        }
        return edges;
    },

    /**
     * 计算饱和度
     */
    computeSaturation(pixels) {
        return pixels.map(row =>
            row.map(p => {
                if (!p || p.a < 128) return 0;
                const r = p.r / 255, g = p.g / 255, b = p.b / 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                return max > 0 ? (max - min) / max : 0;
            })
        );
    },

    /**
     * 核心: 前景/背景分割
     * 使用多种线索识别主体
     */
    segmentForeground(pixels, luminance, edges, saturation, width, height) {
        console.log('DepthEstimator: 执行前景/背景分割...');

        // 1. 检测边缘区域 (通常是背景)
        const borderMask = this.computeBorderMask(width, height);

        // 2. 获取边缘区域的颜色统计 (作为背景种子)
        const bgColors = this.sampleBorderColors(pixels, width, height);

        // 3. 计算每个像素与背景颜色的相似度
        const bgSimilarity = this.computeBackgroundSimilarity(pixels, bgColors, width, height);

        // 4. 计算中心偏置 (中心更可能是前景)
        const centerWeight = this.computeCenterWeight(width, height);

        // 5. 计算颜色聚类 (找出与边缘不同的颜色区域)
        const colorDifference = this.computeColorDifferenceFromBorder(pixels, bgColors, width, height);

        // 6. 综合判断前景概率
        const foregroundProb = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const p = pixels[y][x];
                if (!p || p.a < 128) {
                    row.push(0);
                    continue;
                }

                // 背景相似度越低 = 越可能是前景
                const bgDist = 1 - bgSimilarity[y][x];

                // 中心偏置
                const center = centerWeight[y][x];

                // 颜色差异
                const colorDiff = colorDifference[y][x];

                // 饱和度 (高饱和度更可能是前景)
                const sat = saturation[y][x];

                // 边缘强度 (边缘区域是物体边界)
                const edge = edges[y][x];

                // 综合计算
                let prob = 0;
                prob += bgDist * 0.35;      // 与背景不同
                prob += center * 0.20;      // 中心偏置
                prob += colorDiff * 0.20;   // 颜色差异
                prob += sat * 0.15;         // 饱和度
                prob += edge * 0.10;        // 边缘

                row.push(Math.max(0, Math.min(1, prob)));
            }
            foregroundProb.push(row);
        }

        // 7. 应用阈值和形态学操作
        const refined = this.refineForegroundMask(foregroundProb, width, height);

        return refined;
    },

    /**
     * 计算边缘蒙版
     */
    computeBorderMask(width, height) {
        const mask = [];
        const borderWidth = Math.max(3, Math.min(width, height) * 0.1);

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const distFromBorder = Math.min(x, y, width - 1 - x, height - 1 - y);
                row.push(distFromBorder < borderWidth ? 1 : 0);
            }
            mask.push(row);
        }
        return mask;
    },

    /**
     * 采样边缘区域颜色
     */
    sampleBorderColors(pixels, width, height) {
        const colors = [];
        const borderWidth = Math.max(3, Math.min(width, height) * 0.15);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const distFromBorder = Math.min(x, y, width - 1 - x, height - 1 - y);
                if (distFromBorder < borderWidth) {
                    const p = pixels[y][x];
                    if (p && p.a >= 128) {
                        colors.push([p.r, p.g, p.b]);
                    }
                }
            }
        }

        // 返回颜色列表和平均颜色
        if (colors.length === 0) {
            return { colors: [], avgColor: [128, 128, 128] };
        }

        const avgColor = [0, 0, 0];
        for (const c of colors) {
            avgColor[0] += c[0];
            avgColor[1] += c[1];
            avgColor[2] += c[2];
        }
        avgColor[0] /= colors.length;
        avgColor[1] /= colors.length;
        avgColor[2] /= colors.length;

        return { colors, avgColor };
    },

    /**
     * 计算与背景颜色的相似度
     */
    computeBackgroundSimilarity(pixels, bgColors, width, height) {
        const similarity = [];
        const { avgColor } = bgColors;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const p = pixels[y][x];
                if (!p || p.a < 128) {
                    row.push(1); // 透明像素视为背景
                    continue;
                }

                // 计算与平均背景色的距离
                const dist = Math.sqrt(
                    Math.pow(p.r - avgColor[0], 2) +
                    Math.pow(p.g - avgColor[1], 2) +
                    Math.pow(p.b - avgColor[2], 2)
                );

                // 归一化 (越近越相似)
                const maxDist = 441.67; // sqrt(255^2 * 3)
                row.push(1 - Math.min(1, dist / (maxDist * 0.5)));
            }
            similarity.push(row);
        }
        return similarity;
    },

    /**
     * 计算中心权重 (高斯分布)
     */
    computeCenterWeight(width, height) {
        const weight = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const sigmaX = width / 3;
        const sigmaY = height / 3;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const dx = (x - centerX) / sigmaX;
                const dy = (y - centerY) / sigmaY;
                row.push(Math.exp(-(dx * dx + dy * dy) / 2));
            }
            weight.push(row);
        }
        return weight;
    },

    /**
     * 计算与边缘颜色的差异
     */
    computeColorDifferenceFromBorder(pixels, bgColors, width, height) {
        const diff = [];
        const { colors, avgColor } = bgColors;

        // 计算边缘颜色的方差
        let colorVariance = 0;
        for (const c of colors) {
            colorVariance += Math.pow(c[0] - avgColor[0], 2) +
                Math.pow(c[1] - avgColor[1], 2) +
                Math.pow(c[2] - avgColor[2], 2);
        }
        colorVariance = colors.length > 0 ? Math.sqrt(colorVariance / colors.length) : 50;
        const threshold = Math.max(30, colorVariance * 1.5);

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const p = pixels[y][x];
                if (!p || p.a < 128) {
                    row.push(0);
                    continue;
                }

                const dist = Math.sqrt(
                    Math.pow(p.r - avgColor[0], 2) +
                    Math.pow(p.g - avgColor[1], 2) +
                    Math.pow(p.b - avgColor[2], 2)
                );

                // 超过阈值才算显著不同
                row.push(Math.min(1, Math.max(0, (dist - threshold) / 100)));
            }
            diff.push(row);
        }
        return diff;
    },

    /**
     * 精细化前景蒙版
     */
    refineForegroundMask(prob, width, height) {
        // 1. 应用软阈值
        let mask = prob.map(row => row.map(p => p));

        // 2. 高斯模糊
        mask = this.gaussianBlur(mask, width, height, 2);

        // 3. 对比度增强
        mask = this.enhanceContrast(mask);

        // 4. 再次模糊以平滑边缘
        mask = this.gaussianBlur(mask, width, height, 1);

        return mask;
    },

    /**
     * 高斯模糊
     */
    gaussianBlur(data, width, height, radius) {
        const result = [];
        const kernel = this.createGaussianKernel(radius);
        const kSize = kernel.length;
        const kHalf = Math.floor(kSize / 2);

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let sum = 0, weightSum = 0;

                for (let ky = -kHalf; ky <= kHalf; ky++) {
                    for (let kx = -kHalf; kx <= kHalf; kx++) {
                        const ny = Math.max(0, Math.min(height - 1, y + ky));
                        const nx = Math.max(0, Math.min(width - 1, x + kx));
                        const weight = kernel[ky + kHalf][kx + kHalf];
                        sum += data[ny][nx] * weight;
                        weightSum += weight;
                    }
                }
                row.push(sum / weightSum);
            }
            result.push(row);
        }
        return result;
    },

    /**
     * 创建高斯核
     */
    createGaussianKernel(radius) {
        const size = radius * 2 + 1;
        const kernel = [];
        const sigma = radius / 2;

        for (let y = -radius; y <= radius; y++) {
            const row = [];
            for (let x = -radius; x <= radius; x++) {
                const g = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                row.push(g);
            }
            kernel.push(row);
        }
        return kernel;
    },

    /**
     * 对比度增强
     */
    enhanceContrast(data) {
        // 找到最小和最大值
        let min = 1, max = 0;
        for (const row of data) {
            for (const v of row) {
                if (v < min) min = v;
                if (v > max) max = v;
            }
        }

        if (max === min) return data;

        // 应用 S 曲线增强对比度
        const range = max - min;
        return data.map(row => row.map(v => {
            const normalized = (v - min) / range;
            // S 曲线: 3x^2 - 2x^3
            const enhanced = 3 * normalized * normalized - 2 * normalized * normalized * normalized;
            return enhanced;
        }));
    },

    /**
     * 计算显著性
     */
    computeSaliency(pixels, luminance, width, height) {
        const saliency = [];

        let avgR = 0, avgG = 0, avgB = 0, count = 0;
        for (const row of pixels) {
            for (const p of row) {
                if (p && p.a >= 128) {
                    avgR += p.r; avgG += p.g; avgB += p.b;
                    count++;
                }
            }
        }
        if (count > 0) {
            avgR /= count; avgG /= count; avgB /= count;
        }

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const p = pixels[y][x];
                if (!p || p.a < 128) {
                    row.push(0);
                    continue;
                }

                const dist = Math.sqrt(
                    Math.pow(p.r - avgR, 2) +
                    Math.pow(p.g - avgG, 2) +
                    Math.pow(p.b - avgB, 2)
                ) / 441.67;

                row.push(Math.min(1, dist * 1.5));
            }
            saliency.push(row);
        }
        return saliency;
    },

    /**
     * 计算颜色对比度
     */
    computeColorContrast(pixels, width, height) {
        const contrast = [];
        const radius = 2;

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
                row.push(Math.min(1, maxDiff / 150));
            }
            contrast.push(row);
        }
        return contrast;
    },

    /**
     * 计算中心偏置
     */
    computeCenterBias(width, height) {
        const bias = [];
        const centerX = width / 2, centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                row.push(1 - dist / maxDist);
            }
            bias.push(row);
        }
        return bias;
    },

    /**
     * 结合分割结果生成深度图
     */
    combineWithSegmentation(data) {
        const {
            foregroundMask, luminance, edges, saturation,
            saliency, colorContrast, centerBias,
            width, height
        } = data;

        const depth = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                // 前景蒙版是核心 (0=背景, 1=前景)
                const fg = foregroundMask[y][x];

                // 其他线索作为微调
                const sal = saliency[y][x];
                const contrast = colorContrast[y][x];
                const center = centerBias[y][x];
                const sat = saturation[y][x];
                const lum = luminance[y][x];

                // 前景深度: 基于前景蒙版
                // 背景下凹 (低深度), 主体上凸 (高深度)
                let d = fg * 0.7;  // 前景蒙版贡献70%

                // 微调线索
                d += sal * 0.10;       // 显著性
                d += contrast * 0.05;  // 对比度
                d += center * 0.05;    // 中心偏置
                d += sat * 0.05;       // 饱和度
                d += lum * 0.05;       // 亮度

                // 确保背景明显低于前景
                if (fg < 0.3) {
                    d *= 0.5; // 背景区域深度减半
                }

                row.push(Math.max(0, Math.min(1, d)));
            }
            depth.push(row);
        }

        // 增强对比度
        return this.enhanceDepthContrast(depth);
    },

    /**
     * 增强深度对比度
     */
    enhanceDepthContrast(depth) {
        // 找到前景和背景的分界
        const values = depth.flat().filter(v => v > 0);
        if (values.length === 0) return depth;

        values.sort((a, b) => a - b);
        const median = values[Math.floor(values.length / 2)];

        return depth.map(row => row.map(d => {
            if (d < median * 0.8) {
                // 背景: 压低
                return d * 0.6;
            } else {
                // 前景: 提升
                return 0.4 + d * 0.6;
            }
        }));
    },

    /**
     * 边缘感知平滑
     */
    edgeAwareSmooth(depth, edges, width, height) {
        const result = [];
        const radius = 2;
        const spatialSigma = 1.5;
        const rangeSigma = 0.15;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x < radius || x >= width - radius ||
                    y < radius || y >= height - radius) {
                    row.push(depth[y][x]);
                    continue;
                }

                let weightSum = 0;
                let valueSum = 0;
                const centerDepth = depth[y][x];
                const centerEdge = edges[y][x];

                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const ny = y + dy, nx = x + dx;

                        // 空间权重
                        const spatialWeight = Math.exp(-(dx * dx + dy * dy) / (2 * spatialSigma * spatialSigma));

                        // 深度范围权重
                        const depthDiff = depth[ny][nx] - centerDepth;
                        const rangeWeight = Math.exp(-(depthDiff * depthDiff) / (2 * rangeSigma * rangeSigma));

                        // 边缘权重 (边缘处减少平滑)
                        const edgeWeight = 1 - Math.max(centerEdge, edges[ny][nx]) * 0.8;

                        const weight = spatialWeight * rangeWeight * edgeWeight;
                        weightSum += weight;
                        valueSum += depth[ny][nx] * weight;
                    }
                }

                row.push(weightSum > 0 ? valueSum / weightSum : depth[y][x]);
            }
            result.push(row);
        }

        return this.normalizeDepth(result);
    },

    /**
     * 归一化深度
     */
    normalizeDepth(depth) {
        let min = 1, max = 0;
        for (const row of depth) {
            for (const d of row) {
                if (d < min) min = d;
                if (d > max) max = d;
            }
        }

        if (max === min) return depth.map(row => row.map(() => 0.5));

        const range = max - min;
        return depth.map(row => row.map(d => (d - min) / range));
    },

    /**
     * 平滑深度
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
     * 量化深度
     */
    quantizeDepth(depth, layers) {
        return depth.map(row =>
            row.map(d => Math.round(d * (layers - 1)))
        );
    }
};
