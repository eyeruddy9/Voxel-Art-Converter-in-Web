# 🧱 Voxel Art Converter

> [English Version](README.md)

将任意照片转换为 **Minecraft 风格的 3D 体素艺术**，支持导出 `.obj` 和 `.schematic` 格式。

![Demo](https://raw.githubusercontent.com/eyeruddy9/Voxel-Art-Converter-in-Web/main/demo.png)

## ✨ 功能特点

- 📷 **拖拽上传** - 支持 PNG/JPG 图片
- 🎨 **智能颜色映射** - 5 种 Minecraft 调色板 + Floyd-Steinberg 抖动
- 📊 **深度估计** - 传统 CV 算法分析图像景深
- 🎮 **实时 3D 预览** - Three.js 渲染，支持旋转/缩放
- 📦 **OBJ 导出** - 可导入 Blender、Unity 等
- 🏗️ **Schematic 导出** - 兼容 MCEdit/WorldEdit

## 🚀 在线体验

(https://voxel-art-converter-in-web.vercel.app/)

## 🛠️ 本地运行

```bash
# 克隆项目
git clone https://github.com/eyeruddy9/Voxel-Art-Converter-in-Web.git
cd Voxel-Art-Converter-in-Web

# 启动本地服务器
npx http-server . -p 8080

# 打开浏览器访问 http://localhost:8080
```

## 🎯 使用方法

1. **上传图片** - 拖拽或点击上传区域
2. **调整参数**
   - 分辨率: 16-128 方块
   - 深度强度: 1-20 层
   - 调色板: Minecraft 原版 / 陶瓦 / 羊毛 / 混凝土
   - 填充模式: 仅表面 / 实心 / 空心
3. **开始转换** - 点击按钮生成 3D 模型
4. **导出** - 下载 OBJ 或 Schematic 文件

## 📁 项目结构

```
├── index.html              # 主页面
├── css/style.css           # 样式文件
└── js/
    ├── app.js              # 应用入口
    ├── imageProcessor.js   # 图像处理
    ├── depthEstimator.js   # 深度估计算法
    ├── voxelizer.js        # 体素化核心
    ├── voxelRenderer.js    # Three.js 渲染器
    ├── minecraft/palette.js # Minecraft 调色板
    └── exporters/
        ├── objExporter.js      # OBJ 导出
        └── schematicExporter.js # Schematic 导出
```

## 🔧 技术栈

- **Three.js** - WebGL 3D 渲染
- **Pako** - Gzip 压缩 (用于 Schematic)
- **Vanilla JS** - 无框架依赖

## 🧠 深度估计算法

使用传统计算机视觉算法分析图像深度:

| 线索 | 权重 | 描述 |
|------|------|------|
| 亮度 | 25% | 较亮区域通常更近 |
| 清晰度 | 25% | Laplacian 方差检测模糊 |
| 边缘 | 15% | Sobel 算子检测边缘 |
| 饱和度 | 15% | 高饱和度通常是前景 |
| 位置 | 20% | 图像底部通常是前景 |

## 📄 License

GPLv2 License

## 🙏 致谢

- [Three.js](https://threejs.org/)
- [Minecraft](https://www.minecraft.net/) - 方块调色板灵感来源
