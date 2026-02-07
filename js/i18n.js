/**
 * Internationalization (i18n) Module
 * Handles language switching and translations
 */

const i18n = {
    // Current language
    lang: 'en', // Default to English

    // Translation dictionary
    translations: {
        en: {
            title: "Voxel Art Converter",
            tagline: "Convert photos into Minecraft-style 3D voxel art",
            upload_title: "📷 Upload Image",
            drop_hint: "Drag & Drop imaga here",
            click_hint: "or click to select file",
            settings_title: "⚙️ Settings",
            resolution: "Resolution (Blocks)",
            depth_scale: "Depth Scale",
            palette: "Palette",
            palette_minecraft: "Minecraft Default",
            palette_terracotta: "Terracotta",
            palette_wool: "Wool",
            palette_concrete: "Concrete",
            palette_full: "Full Palette",
            fill_mode: "Fill Mode",
            fill_surface: "Surface Only",
            fill_solid: "Solid Fill",
            fill_hollow: "Hollow",
            btn_convert: "✨ Convert",
            export_title: "💾 Export",
            btn_obj: "📦 Export .OBJ",
            btn_schematic: "🎮 Export .schematic",
            export_hint: "Export available after conversion",
            preview_title: "🎨 3D Preview",
            loading_processing: "Processing Image...",
            loading_depth: "Estimating Depth...",
            loading_color: "Mapping Colors...",
            loading_voxel: "Generating Voxels...",
            loading_optimize: "Optimizing Model...",
            loading_render: "Rendering...",
            loading_obj: "Generating OBJ...",
            loading_schematic: "Generating Schematic...",
            ready: "Ready",
            stats_blocks: "Blocks: ",
            stats_size: "Size: ",
            error_image_type: "Please select an image file",
            error_load: "Failed to load image: ",
            footer: "Voxel Art Converter © 2026 | 3D Voxel Art Generator compatible with Minecraft"
        },
        zh: {
            title: "Voxel Art Converter",
            tagline: "将照片转换为 Minecraft 风格的 3D 体素艺术",
            upload_title: "📷 上传图片",
            drop_hint: "拖拽图片到这里",
            click_hint: "或点击选择文件",
            settings_title: "⚙️ 转换设置",
            resolution: "分辨率 (方块数)",
            depth_scale: "深度强度",
            palette: "调色板",
            palette_minecraft: "Minecraft 原版",
            palette_terracotta: "陶瓦系列",
            palette_wool: "羊毛系列",
            palette_concrete: "混凝土系列",
            palette_full: "完整调色板",
            fill_mode: "填充模式",
            fill_surface: "仅表面",
            fill_solid: "实心填充",
            fill_hollow: "空心结构",
            btn_convert: "✨ 开始转换",
            export_title: "💾 导出",
            btn_obj: "📦 导出 .OBJ",
            btn_schematic: "🎮 导出 .schematic",
            export_hint: "转换完成后可导出文件",
            preview_title: "🎨 3D 预览",
            loading_processing: "正在处理图像...",
            loading_depth: "正在估计深度...",
            loading_color: "正在映射颜色...",
            loading_voxel: "正在生成体素...",
            loading_optimize: "正在优化模型...",
            loading_render: "正在渲染...",
            loading_obj: "正在生成 OBJ 文件...",
            loading_schematic: "正在生成 Schematic 文件...",
            ready: "准备就绪",
            stats_blocks: "方块数: ",
            stats_size: "尺寸: ",
            error_image_type: "请选择图像文件",
            error_load: "加载图像失败: ",
            footer: "Voxel Art Converter © 2026 | 支持导入 Minecraft 的 3D 体素艺术生成器"
        }
    },

    /**
     * Initialize i18n
     */
    init() {
        // Check for saved language preference
        const savedLang = localStorage.getItem('voxel_art_lang');
        if (savedLang && this.translations[savedLang]) {
            this.lang = savedLang;
        }

        this.applyLanguage();
        this.bindEvents();
    },

    /**
     * Bind language switcher events
     */
    bindEvents() {
        const btnEn = document.getElementById('langEn');
        const btnZh = document.getElementById('langZh');

        if (btnEn) btnEn.addEventListener('click', () => this.setLanguage('en'));
        if (btnZh) btnZh.addEventListener('click', () => this.setLanguage('zh'));
    },

    /**
     * Set current language
     * @param {string} lang 'en' or 'zh'
     */
    setLanguage(lang) {
        if (!this.translations[lang]) return;

        this.lang = lang;
        localStorage.setItem('voxel_art_lang', lang);
        this.applyLanguage();

        // Update basic UI elements that might need forced redraw or logic updates
        if (typeof App !== 'undefined' && App.updateUI) {
            App.updateUI();
        }
    },

    /**
     * Apply translations to the DOM
     */
    applyLanguage() {
        // Update active state of buttons
        const btnEn = document.getElementById('langEn');
        const btnZh = document.getElementById('langZh');
        if (btnEn && btnZh) {
            btnEn.classList.toggle('active', this.lang === 'en');
            btnZh.classList.toggle('active', this.lang === 'zh');
        }

        // Translate elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[this.lang][key]) {
                // Handle inputs and regular elements
                if (el.tagName === 'INPUT' && el.type === 'button') {
                    el.value = this.translations[this.lang][key];
                } else {
                    el.textContent = this.translations[this.lang][key];
                }
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.lang === 'en' ? 'en' : 'zh-CN';
    },

    /**
     * Get translation for a key
     * @param {string} key 
     * @returns {string} Translated text
     */
    t(key) {
        return this.translations[this.lang][key] || key;
    }
};
