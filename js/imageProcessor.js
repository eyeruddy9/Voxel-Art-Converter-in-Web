/**
 * 图像处理模块
 * 负责加载、缩放和预处理图像
 */

const ImageProcessor = {
    /**
     * 从文件加载图像
     * @param {File} file 图像文件
     * @returns {Promise<HTMLImageElement>} 加载的图像元素
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('无法加载图像'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('无法读取文件'));
            reader.readAsDataURL(file);
        });
    },

    /**
     * 将图像缩放到指定分辨率并提取像素数据
     * @param {HTMLImageElement} image 源图像
     * @param {number} resolution 目标分辨率（最大边的像素数）
     * @returns {Object} 包含像素数据和尺寸的对象
     */
    processImage(image, resolution) {
        // 计算缩放后的尺寸，保持宽高比
        let width, height;
        if (image.width > image.height) {
            width = resolution;
            height = Math.round(resolution * image.height / image.width);
        } else {
            height = resolution;
            width = Math.round(resolution * image.width / image.height);
        }

        // 确保最小尺寸为 1
        width = Math.max(1, width);
        height = Math.max(1, height);

        // 创建临时画布进行缩放
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 使用像素化缩放（禁用平滑）
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, width, height);

        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = this.extractPixels(imageData);

        return {
            width,
            height,
            pixels,      // 2D 数组 [y][x] = {r, g, b, a}
            imageData    // 原始 ImageData
        };
    },

    /**
     * 从 ImageData 提取像素为 2D 数组
     * @param {ImageData} imageData 
     * @returns {Array} 2D 像素数组
     */
    extractPixels(imageData) {
        const { width, height, data } = imageData;
        const pixels = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                row.push({
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2],
                    a: data[idx + 3]
                });
            }
            pixels.push(row);
        }

        return pixels;
    },

    /**
     * 将像素颜色映射到 Minecraft 方块
     * @param {Array} pixels 2D 像素数组
     * @param {string} paletteName 调色板名称
     * @returns {Array} 2D 方块数组
     */
    mapToBlocks(pixels, paletteName) {
        const result = [];

        for (let y = 0; y < pixels.length; y++) {
            const row = [];
            for (let x = 0; x < pixels[y].length; x++) {
                const pixel = pixels[y][x];

                // 透明像素跳过
                if (pixel.a < 128) {
                    row.push(null);
                    continue;
                }

                const rgb = [pixel.r, pixel.g, pixel.b];
                const block = MinecraftPalette.findClosestBlock(rgb, paletteName);

                row.push({
                    ...block,
                    originalColor: rgb
                });
            }
            result.push(row);
        }

        return result;
    },

    /**
     * 应用抖动算法减少色带
     * @param {Array} pixels 2D 像素数组
     * @param {string} paletteName 调色板名称
     * @returns {Array} 处理后的方块数组
     */
    mapToBlocksWithDithering(pixels, paletteName) {
        // 深拷贝像素数组用于误差扩散
        const working = pixels.map(row =>
            row.map(p => ({ r: p.r, g: p.g, b: p.b, a: p.a }))
        );

        const result = [];
        const height = pixels.length;
        const width = pixels[0].length;

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const pixel = working[y][x];

                if (pixel.a < 128) {
                    row.push(null);
                    continue;
                }

                // 限制颜色值范围
                const oldColor = [
                    Math.max(0, Math.min(255, Math.round(pixel.r))),
                    Math.max(0, Math.min(255, Math.round(pixel.g))),
                    Math.max(0, Math.min(255, Math.round(pixel.b)))
                ];

                const block = MinecraftPalette.findClosestBlock(oldColor, paletteName);
                const newColor = block.color;

                // 计算误差
                const error = [
                    oldColor[0] - newColor[0],
                    oldColor[1] - newColor[1],
                    oldColor[2] - newColor[2]
                ];

                // Floyd-Steinberg 误差扩散
                this.distributeError(working, x, y, width, height, error);

                row.push({
                    ...block,
                    originalColor: oldColor
                });
            }
            result.push(row);
        }

        return result;
    },

    /**
     * Floyd-Steinberg 误差扩散
     */
    distributeError(pixels, x, y, width, height, error) {
        const distribution = [
            { dx: 1, dy: 0, factor: 7 / 16 },
            { dx: -1, dy: 1, factor: 3 / 16 },
            { dx: 0, dy: 1, factor: 5 / 16 },
            { dx: 1, dy: 1, factor: 1 / 16 }
        ];

        for (const { dx, dy, factor } of distribution) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const neighbor = pixels[ny][nx];
                if (neighbor.a >= 128) {
                    neighbor.r += error[0] * factor;
                    neighbor.g += error[1] * factor;
                    neighbor.b += error[2] * factor;
                }
            }
        }
    },

    /**
     * 创建缩略图预览
     * @param {HTMLImageElement} image 源图像
     * @param {number} maxSize 最大尺寸
     * @returns {string} Data URL
     */
    createThumbnail(image, maxSize = 300) {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);

        return canvas.toDataURL('image/jpeg', 0.8);
    }
};
