/**
 * Schematic 导出器模块
 * 将体素网格导出为 Minecraft Schematic 格式 (.schematic)
 * 使用 NBT 格式，兼容 MCEdit/WorldEdit
 */

const SchematicExporter = {
    /**
     * 导出体素网格为 Schematic 格式
     * @param {Object} voxelGrid 体素网格数据
     * @param {Object} options 导出选项
     * @returns {Uint8Array} Schematic 文件的二进制数据
     */
    export(voxelGrid, options = {}) {
        const { filename = 'voxel_model' } = options;
        const { voxels, bounds } = voxelGrid;

        // 计算尺寸
        const width = bounds.sizeX;
        const height = bounds.sizeY;
        const length = bounds.sizeZ;

        // 创建方块和数据数组
        const size = width * height * length;
        const blocks = new Uint8Array(size);
        const data = new Uint8Array(size);

        // 填充数组
        const voxelMap = Voxelizer.createVoxelMap(voxels);

        for (let y = 0; y < height; y++) {
            for (let z = 0; z < length; z++) {
                for (let x = 0; x < width; x++) {
                    // 转换坐标 (相对于边界)
                    const key = `${x + bounds.minX},${y + bounds.minY},${z + bounds.minZ}`;
                    const voxel = voxelMap.get(key);

                    // 计算数组索引 (Minecraft 使用 YZX 顺序)
                    const index = (y * length + z) * width + x;

                    if (voxel) {
                        blocks[index] = voxel.block.id || 35;  // 默认使用羊毛
                        data[index] = voxel.block.data || 0;
                    } else {
                        blocks[index] = 0;  // 空气
                        data[index] = 0;
                    }
                }
            }
        }

        // 创建 NBT 数据
        const nbtData = this.createNBT({
            width,
            height,
            length,
            blocks,
            data
        });

        // 压缩
        const compressed = pako.gzip(nbtData);

        return {
            data: compressed,
            filename: `${filename}.schematic`
        };
    },

    /**
     * 创建 NBT 格式数据
     * @param {Object} schematic Schematic 数据
     * @returns {Uint8Array} NBT 二进制数据
     */
    createNBT(schematic) {
        const { width, height, length, blocks, data } = schematic;

        // NBT 写入器
        const writer = new NBTWriter();

        // 根标签: Schematic (Compound)
        writer.writeTagType(10); // TAG_Compound
        writer.writeString('Schematic');

        // Width (Short)
        writer.writeTag(2, 'Width', width);

        // Height (Short)
        writer.writeTag(2, 'Height', height);

        // Length (Short)
        writer.writeTag(2, 'Length', length);

        // Materials (String) - 标识这是 Alpha 格式
        writer.writeTag(8, 'Materials', 'Alpha');

        // Blocks (Byte Array)
        writer.writeTagType(7); // TAG_Byte_Array
        writer.writeString('Blocks');
        writer.writeInt(blocks.length);
        writer.writeBytes(blocks);

        // Data (Byte Array)
        writer.writeTagType(7); // TAG_Byte_Array
        writer.writeString('Data');
        writer.writeInt(data.length);
        writer.writeBytes(data);

        // Entities (List) - 空列表
        writer.writeTagType(9); // TAG_List
        writer.writeString('Entities');
        writer.writeByte(10); // 元素类型: TAG_Compound
        writer.writeInt(0);   // 元素数量

        // TileEntities (List) - 空列表
        writer.writeTagType(9); // TAG_List
        writer.writeString('TileEntities');
        writer.writeByte(10); // 元素类型: TAG_Compound
        writer.writeInt(0);   // 元素数量

        // 结束根标签
        writer.writeTagType(0); // TAG_End

        return writer.getBuffer();
    },

    /**
     * 下载导出的文件
     * @param {Object} exportData 导出数据
     */
    download(exportData) {
        const { data, filename } = exportData;

        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

/**
 * NBT 写入器类
 * 用于生成 NBT 格式的二进制数据
 */
class NBTWriter {
    constructor() {
        this.buffer = [];
    }

    /**
     * 写入一个字节
     * @param {number} value 
     */
    writeByte(value) {
        this.buffer.push(value & 0xFF);
    }

    /**
     * 写入多个字节
     * @param {Uint8Array} bytes 
     */
    writeBytes(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            this.buffer.push(bytes[i]);
        }
    }

    /**
     * 写入 16 位整数 (大端序)
     * @param {number} value 
     */
    writeShort(value) {
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push(value & 0xFF);
    }

    /**
     * 写入 32 位整数 (大端序)
     * @param {number} value 
     */
    writeInt(value) {
        this.buffer.push((value >> 24) & 0xFF);
        this.buffer.push((value >> 16) & 0xFF);
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push(value & 0xFF);
    }

    /**
     * 写入字符串 (带长度前缀)
     * @param {string} str 
     */
    writeString(str) {
        const bytes = new TextEncoder().encode(str);
        this.writeShort(bytes.length);
        this.writeBytes(bytes);
    }

    /**
     * 写入标签类型
     * @param {number} type 
     */
    writeTagType(type) {
        this.writeByte(type);
    }

    /**
     * 写入完整标签
     * @param {number} type 标签类型
     * @param {string} name 标签名
     * @param {*} value 标签值
     */
    writeTag(type, name, value) {
        this.writeTagType(type);
        this.writeString(name);

        switch (type) {
            case 1: // TAG_Byte
                this.writeByte(value);
                break;
            case 2: // TAG_Short
                this.writeShort(value);
                break;
            case 3: // TAG_Int
                this.writeInt(value);
                break;
            case 8: // TAG_String
                this.writeString(value);
                break;
            default:
                throw new Error(`Unsupported tag type: ${type}`);
        }
    }

    /**
     * 获取最终的缓冲区
     * @returns {Uint8Array}
     */
    getBuffer() {
        return new Uint8Array(this.buffer);
    }
}
