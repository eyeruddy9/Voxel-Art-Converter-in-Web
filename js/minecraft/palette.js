/**
 * Minecraft 方块调色板
 * 包含常见方块的颜色和对应的 block ID
 */

const MinecraftPalette = {
    // 预设调色板
    palettes: {
        // 原版基础方块
        minecraft: [
            { name: 'white_wool', color: [233, 236, 236], id: 35, data: 0 },
            { name: 'orange_wool', color: [234, 126, 53], id: 35, data: 1 },
            { name: 'magenta_wool', color: [189, 68, 179], id: 35, data: 2 },
            { name: 'light_blue_wool', color: [58, 175, 217], id: 35, data: 3 },
            { name: 'yellow_wool', color: [248, 198, 39], id: 35, data: 4 },
            { name: 'lime_wool', color: [112, 185, 25], id: 35, data: 5 },
            { name: 'pink_wool', color: [237, 141, 172], id: 35, data: 6 },
            { name: 'gray_wool', color: [62, 68, 71], id: 35, data: 7 },
            { name: 'light_gray_wool', color: [142, 142, 134], id: 35, data: 8 },
            { name: 'cyan_wool', color: [21, 137, 145], id: 35, data: 9 },
            { name: 'purple_wool', color: [121, 42, 172], id: 35, data: 10 },
            { name: 'blue_wool', color: [53, 57, 157], id: 35, data: 11 },
            { name: 'brown_wool', color: [114, 71, 40], id: 35, data: 12 },
            { name: 'green_wool', color: [84, 109, 27], id: 35, data: 13 },
            { name: 'red_wool', color: [161, 39, 34], id: 35, data: 14 },
            { name: 'black_wool', color: [20, 21, 25], id: 35, data: 15 },
            { name: 'stone', color: [125, 125, 125], id: 1, data: 0 },
            { name: 'granite', color: [149, 103, 85], id: 1, data: 1 },
            { name: 'diorite', color: [188, 188, 188], id: 1, data: 3 },
            { name: 'andesite', color: [136, 136, 136], id: 1, data: 5 },
            { name: 'dirt', color: [134, 96, 67], id: 3, data: 0 },
            { name: 'oak_planks', color: [162, 130, 78], id: 5, data: 0 },
            { name: 'spruce_planks', color: [104, 78, 47], id: 5, data: 1 },
            { name: 'birch_planks', color: [196, 179, 123], id: 5, data: 2 },
            { name: 'jungle_planks', color: [160, 115, 80], id: 5, data: 3 },
            { name: 'acacia_planks', color: [168, 90, 50], id: 5, data: 4 },
            { name: 'dark_oak_planks', color: [66, 43, 20], id: 5, data: 5 },
            { name: 'cobblestone', color: [127, 127, 127], id: 4, data: 0 },
            { name: 'sand', color: [219, 207, 163], id: 12, data: 0 },
            { name: 'red_sand', color: [190, 102, 33], id: 12, data: 1 },
            { name: 'gravel', color: [131, 127, 126], id: 13, data: 0 },
            { name: 'gold_block', color: [246, 208, 61], id: 41, data: 0 },
            { name: 'iron_block', color: [220, 220, 220], id: 42, data: 0 },
            { name: 'diamond_block', color: [97, 219, 213], id: 57, data: 0 },
            { name: 'lapis_block', color: [38, 67, 138], id: 22, data: 0 },
            { name: 'emerald_block', color: [42, 176, 67], id: 133, data: 0 },
            { name: 'redstone_block', color: [171, 26, 10], id: 152, data: 0 },
            { name: 'coal_block', color: [21, 21, 21], id: 173, data: 0 },
            { name: 'obsidian', color: [15, 10, 24], id: 49, data: 0 },
            { name: 'netherrack', color: [111, 54, 53], id: 87, data: 0 },
            { name: 'soul_sand', color: [81, 62, 50], id: 88, data: 0 },
            { name: 'glowstone', color: [171, 131, 84], id: 89, data: 0 },
            { name: 'nether_brick', color: [44, 22, 26], id: 112, data: 0 },
            { name: 'end_stone', color: [221, 223, 165], id: 121, data: 0 },
            { name: 'purpur_block', color: [169, 125, 169], id: 201, data: 0 },
            { name: 'prismarine', color: [99, 156, 151], id: 168, data: 0 },
            { name: 'sea_lantern', color: [172, 199, 190], id: 169, data: 0 },
            { name: 'hay_block', color: [166, 139, 12], id: 170, data: 0 },
            { name: 'bone_block', color: [209, 206, 179], id: 216, data: 0 },
            { name: 'quartz_block', color: [235, 229, 222], id: 155, data: 0 },
            { name: 'brick', color: [150, 97, 83], id: 45, data: 0 },
            { name: 'bookshelf', color: [162, 130, 78], id: 47, data: 0 },
            { name: 'mossy_cobblestone', color: [110, 118, 94], id: 48, data: 0 },
            { name: 'ice', color: [145, 183, 253], id: 79, data: 0 },
            { name: 'packed_ice', color: [141, 180, 250], id: 174, data: 0 },
            { name: 'snow', color: [249, 254, 254], id: 80, data: 0 },
            { name: 'clay', color: [160, 166, 179], id: 82, data: 0 },
            { name: 'pumpkin', color: [198, 118, 24], id: 86, data: 0 },
            { name: 'melon', color: [111, 145, 30], id: 103, data: 0 },
            { name: 'mycelium', color: [111, 99, 105], id: 110, data: 0 },
            { name: 'sponge', color: [195, 192, 74], id: 19, data: 0 },
        ],

        // 陶瓦系列 (更丰富的棕色和暖色调)
        terracotta: [
            { name: 'terracotta', color: [152, 94, 67], id: 172, data: 0 },
            { name: 'white_terracotta', color: [209, 178, 161], id: 159, data: 0 },
            { name: 'orange_terracotta', color: [161, 83, 37], id: 159, data: 1 },
            { name: 'magenta_terracotta', color: [149, 88, 108], id: 159, data: 2 },
            { name: 'light_blue_terracotta', color: [113, 108, 137], id: 159, data: 3 },
            { name: 'yellow_terracotta', color: [186, 133, 35], id: 159, data: 4 },
            { name: 'lime_terracotta', color: [103, 117, 52], id: 159, data: 5 },
            { name: 'pink_terracotta', color: [161, 78, 78], id: 159, data: 6 },
            { name: 'gray_terracotta', color: [57, 42, 35], id: 159, data: 7 },
            { name: 'light_gray_terracotta', color: [135, 106, 97], id: 159, data: 8 },
            { name: 'cyan_terracotta', color: [86, 91, 91], id: 159, data: 9 },
            { name: 'purple_terracotta', color: [118, 70, 86], id: 159, data: 10 },
            { name: 'blue_terracotta', color: [74, 59, 91], id: 159, data: 11 },
            { name: 'brown_terracotta', color: [77, 51, 35], id: 159, data: 12 },
            { name: 'green_terracotta', color: [76, 83, 42], id: 159, data: 13 },
            { name: 'red_terracotta', color: [143, 61, 46], id: 159, data: 14 },
            { name: 'black_terracotta', color: [37, 22, 16], id: 159, data: 15 },
        ],

        // 羊毛系列
        wool: [
            { name: 'white_wool', color: [233, 236, 236], id: 35, data: 0 },
            { name: 'orange_wool', color: [234, 126, 53], id: 35, data: 1 },
            { name: 'magenta_wool', color: [189, 68, 179], id: 35, data: 2 },
            { name: 'light_blue_wool', color: [58, 175, 217], id: 35, data: 3 },
            { name: 'yellow_wool', color: [248, 198, 39], id: 35, data: 4 },
            { name: 'lime_wool', color: [112, 185, 25], id: 35, data: 5 },
            { name: 'pink_wool', color: [237, 141, 172], id: 35, data: 6 },
            { name: 'gray_wool', color: [62, 68, 71], id: 35, data: 7 },
            { name: 'light_gray_wool', color: [142, 142, 134], id: 35, data: 8 },
            { name: 'cyan_wool', color: [21, 137, 145], id: 35, data: 9 },
            { name: 'purple_wool', color: [121, 42, 172], id: 35, data: 10 },
            { name: 'blue_wool', color: [53, 57, 157], id: 35, data: 11 },
            { name: 'brown_wool', color: [114, 71, 40], id: 35, data: 12 },
            { name: 'green_wool', color: [84, 109, 27], id: 35, data: 13 },
            { name: 'red_wool', color: [161, 39, 34], id: 35, data: 14 },
            { name: 'black_wool', color: [20, 21, 25], id: 35, data: 15 },
        ],

        // 混凝土系列 (更鲜艳的颜色)
        concrete: [
            { name: 'white_concrete', color: [207, 213, 214], id: 251, data: 0 },
            { name: 'orange_concrete', color: [224, 97, 0], id: 251, data: 1 },
            { name: 'magenta_concrete', color: [169, 48, 159], id: 251, data: 2 },
            { name: 'light_blue_concrete', color: [35, 137, 198], id: 251, data: 3 },
            { name: 'yellow_concrete', color: [241, 175, 21], id: 251, data: 4 },
            { name: 'lime_concrete', color: [94, 169, 24], id: 251, data: 5 },
            { name: 'pink_concrete', color: [214, 101, 143], id: 251, data: 6 },
            { name: 'gray_concrete', color: [54, 57, 61], id: 251, data: 7 },
            { name: 'light_gray_concrete', color: [125, 125, 115], id: 251, data: 8 },
            { name: 'cyan_concrete', color: [21, 119, 136], id: 251, data: 9 },
            { name: 'purple_concrete', color: [100, 31, 156], id: 251, data: 10 },
            { name: 'blue_concrete', color: [44, 46, 143], id: 251, data: 11 },
            { name: 'brown_concrete', color: [96, 59, 31], id: 251, data: 12 },
            { name: 'green_concrete', color: [73, 91, 36], id: 251, data: 13 },
            { name: 'red_concrete', color: [142, 32, 32], id: 251, data: 14 },
            { name: 'black_concrete', color: [8, 10, 15], id: 251, data: 15 },
        ],

        // 完整调色板 (合并所有)
        full: [] // 将在初始化时填充
    },

    /**
     * 初始化完整调色板
     */
    init() {
        // 合并所有调色板到 full
        const allBlocks = new Map();
        
        for (const paletteName of ['minecraft', 'terracotta', 'wool', 'concrete']) {
            for (const block of this.palettes[paletteName]) {
                allBlocks.set(block.name, block);
            }
        }
        
        this.palettes.full = Array.from(allBlocks.values());
    },

    /**
     * 获取指定调色板
     * @param {string} name 调色板名称
     * @returns {Array} 方块数组
     */
    getPalette(name) {
        return this.palettes[name] || this.palettes.minecraft;
    },

    /**
     * 找到与给定颜色最接近的方块
     * @param {Array} rgb [r, g, b] 颜色值
     * @param {string} paletteName 调色板名称
     * @returns {Object} 最接近的方块
     */
    findClosestBlock(rgb, paletteName = 'minecraft') {
        const palette = this.getPalette(paletteName);
        let minDistance = Infinity;
        let closestBlock = palette[0];

        for (const block of palette) {
            const distance = this.colorDistance(rgb, block.color);
            if (distance < minDistance) {
                minDistance = distance;
                closestBlock = block;
            }
        }

        return closestBlock;
    },

    /**
     * 计算两个颜色之间的距离 (使用加权欧几里得距离)
     * 人眼对绿色更敏感，所以绿色权重更高
     * @param {Array} c1 颜色1 [r, g, b]
     * @param {Array} c2 颜色2 [r, g, b]
     * @returns {number} 距离值
     */
    colorDistance(c1, c2) {
        const rMean = (c1[0] + c2[0]) / 2;
        const r = c1[0] - c2[0];
        const g = c1[1] - c2[1];
        const b = c1[2] - c2[2];
        
        // 加权颜色距离 (考虑人眼感知)
        const rWeight = 2 + rMean / 256;
        const gWeight = 4;
        const bWeight = 2 + (255 - rMean) / 256;
        
        return Math.sqrt(rWeight * r * r + gWeight * g * g + bWeight * b * b);
    },

    /**
     * 使用中位切分法进行颜色量化
     * @param {Array} pixels 像素数组 [[r,g,b], ...]
     * @param {number} numColors 目标颜色数量
     * @returns {Array} 量化后的调色板
     */
    quantizeColors(pixels, numColors = 16) {
        if (pixels.length === 0) return [];
        
        // 简化版中位切分
        let buckets = [pixels.slice()];
        
        while (buckets.length < numColors) {
            // 找到最大的桶
            let maxBucketIdx = 0;
            let maxRange = 0;
            
            for (let i = 0; i < buckets.length; i++) {
                const range = this.getColorRange(buckets[i]);
                if (range.maxRange > maxRange) {
                    maxRange = range.maxRange;
                    maxBucketIdx = i;
                }
            }
            
            if (maxRange === 0) break;
            
            // 沿最大范围的通道切分
            const bucket = buckets[maxBucketIdx];
            const range = this.getColorRange(bucket);
            
            bucket.sort((a, b) => a[range.maxChannel] - b[range.maxChannel]);
            
            const mid = Math.floor(bucket.length / 2);
            buckets.splice(maxBucketIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
        }
        
        // 计算每个桶的平均颜色
        return buckets.map(bucket => {
            const avg = [0, 0, 0];
            for (const pixel of bucket) {
                avg[0] += pixel[0];
                avg[1] += pixel[1];
                avg[2] += pixel[2];
            }
            return [
                Math.round(avg[0] / bucket.length),
                Math.round(avg[1] / bucket.length),
                Math.round(avg[2] / bucket.length)
            ];
        });
    },

    /**
     * 获取颜色范围
     * @param {Array} pixels 像素数组
     * @returns {Object} 范围信息
     */
    getColorRange(pixels) {
        const mins = [255, 255, 255];
        const maxs = [0, 0, 0];
        
        for (const pixel of pixels) {
            for (let i = 0; i < 3; i++) {
                mins[i] = Math.min(mins[i], pixel[i]);
                maxs[i] = Math.max(maxs[i], pixel[i]);
            }
        }
        
        const ranges = [maxs[0] - mins[0], maxs[1] - mins[1], maxs[2] - mins[2]];
        const maxChannel = ranges.indexOf(Math.max(...ranges));
        
        return {
            ranges,
            maxChannel,
            maxRange: ranges[maxChannel]
        };
    }
};

// 初始化
MinecraftPalette.init();
