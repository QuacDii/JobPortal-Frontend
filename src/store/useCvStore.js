import { create } from 'zustand';

const useCvStore = create((set, get) => ({
    // ==========================================
    // 1. STATE CẤU TRÚC GIAO DIỆN (Từ cột CustomLayoutJson)
    // ==========================================
    layoutSettings: {
        themeColor: '#1890ff',
        fontFamily: 'Roboto, sans-serif',
        fontSize: 50,       // Đồng bộ theo tỉ lệ chuẩn % của Slider
        lineHeight: 1.5,     // Thêm khoảng cách dòng mặc định
    },

    layoutSchema: {
        templateId: "default_white_template",
        globalSettings: {
            fontFamily: "Arial, sans-serif"
        },
        layout: [
            {
                rowStyles: { display: "flex", padding: "40px", backgroundColor: "#ffffff", borderBottom: "2px solid #000000" },
                columns: [
                    {
                        columnId: "col_header_left",
                        widthPercentage: 25,
                        styles: { backgroundColor: "#ffffff", display: "flex", justifyContent: "flex-start" },
                        blocks: [
                            { id: "b1", type: "AvatarBlock", styles: { shape: "square", alignment: "left" } }
                        ]
                    },
                    {
                        columnId: "col_header_right",
                        widthPercentage: 75,
                        styles: { backgroundColor: "#ffffff", paddingLeft: "20px" },
                        blocks: [
                            { id: "b2", type: "HeaderBlock", styles: { alignment: "left", titleColor: "#000000", subtitleColor: "#000000" } },
                            { id: "b3", type: "ContactBlock", styles: { layout: "vertical", showIcons: false, showLabels: true, textColor: "#000000" } }
                        ]
                    }
                ]
            },
            {
                rowStyles: { display: "flex", padding: "20px 40px", backgroundColor: "#ffffff" },
                columns: [
                    {
                        columnId: "col_main_content",
                        widthPercentage: 100,
                        styles: { backgroundColor: "#ffffff", color: "#000000" },
                        blocks: [
                            { id: "b4", type: "SummaryBlock", styles: { headingColor: "#000000", headingStyle: "underline" } },
                            { id: "b5", type: "EducationBlock", styles: { headingColor: "#000000", headingStyle: "underline" } },
                            { id: "b6", type: "ExperienceBlock", styles: { headingColor: "#000000", headingStyle: "underline" } }
                        ]
                    }
                ]
            }
        ]
    },

    // Quản lý thứ tự và trạng thái Ẩn/Hiện của các mục
    sections: [
        { id: 'personalInfo', title: 'Thông tin cá nhân', column: 'left', order: 1, visible: true },
        { id: 'skills', title: 'Kỹ năng', column: 'left', order: 2, visible: true },
        { id: 'summary', title: 'Mục tiêu nghề nghiệp', column: 'right', order: 1, visible: true },
        { id: 'experience', title: 'Kinh nghiệm làm việc', column: 'right', order: 2, visible: true },
        { id: 'education', title: 'Học vấn', column: 'right', order: 3, visible: true },
        // 👉 Đăng ký các Section mới vào danh sách quản lý trạng thái
        { id: 'activities', title: 'Hoạt động', column: 'right', order: 4, visible: true },
        { id: 'projects', title: 'Dự án cá nhân', column: 'right', order: 5, visible: true },
        { id: 'awards', title: 'Danh hiệu & Giải thưởng', column: 'right', order: 6, visible: true },
        { id: 'references', title: 'Người giới thiệu', column: 'right', order: 7, visible: true }
    ],

    // ==========================================
    // 2. STATE NỘI DUNG (Từ cột DuLieuCv)
    // ==========================================
    cvData: {
        personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', address: '', avatar: '' },
        summary: '',
        skills: '',
        experience: [],
        education: [],
        // 👉 KHỞI TẠO CÁC MẢNG RỖNG MỚI ĐỂ TRANH LỖI MAP UNDEFINED
        activities: [],
        projects: [],
        awards: [],
        references: []
    },

    // ==========================================
    // 3. CÁC HÀM CẬP NHẬT (ACTIONS)
    // ==========================================

    // Hàm nạp toàn bộ dữ liệu từ API khi vừa mở trang
    setInitialData: (layoutConfig, contentData) => set((state) => {
        const newState = {};

        if (layoutConfig) {
            if (layoutConfig.layout) {
                newState.layoutSchema = layoutConfig;
            }
            if (layoutConfig.layoutSettings) {
                newState.layoutSettings = { ...state.layoutSettings, ...layoutConfig.layoutSettings };
            }
        }

        if (contentData) {
            // Merge an toàn dữ liệu, giữ lại mảng trống nếu DB chưa lưu trường đó
            newState.cvData = { ...state.cvData, ...contentData };
        }

        return newState;
    }),

    // Hàm cập nhật chữ khi người dùng gõ vào form
    updateCvData: (key, value) => set((state) => ({
        cvData: { ...state.cvData, [key]: value }
    })),

    // Hàm đổi vị trí các block bằng kéo thả kéo thả
    reorderBlocks: (columnId, startIndex, endIndex) => set((state) => {
        const newLayout = state.layoutSchema.layout.map(row => ({
            ...row,
            columns: row.columns.map(col => {
                if (col.columnId === columnId) {
                    const newBlocks = Array.from(col.blocks);
                    const [removed] = newBlocks.splice(startIndex, 1);
                    newBlocks.splice(endIndex, 0, removed);
                    return { ...col, blocks: newBlocks };
                }
                return col;
            })
        }));

        return { layoutSchema: { ...state.layoutSchema, layout: newLayout } };
    }),

    moveBlockAcrossColumns: (sourceColId, destColId, startIndex, endIndex) => set((state) => {
        // Clone sâu mảng layout bằng JSON để ngắt tham chiếu vùng nhớ
        const newLayout = JSON.parse(JSON.stringify(state.layoutSchema.layout));

        let draggedBlock = null;

        // Bước 1: Chui vào cột nguồn, tìm khối đang kéo và rút nó ra (splice)
        newLayout.forEach(row => {
            row.columns.forEach(col => {
                if (col.columnId === sourceColId) {
                    draggedBlock = col.blocks.splice(startIndex, 1)[0];
                }
            });
        });

        // Bước 2: Mang khối đó sang cột đích và nhét vào vị trí mới
        if (draggedBlock) {
            newLayout.forEach(row => {
                row.columns.forEach(col => {
                    if (col.columnId === destColId) {
                        col.blocks.splice(endIndex, 0, draggedBlock);
                    }
                });
            });
        }

        return { layoutSchema: { ...state.layoutSchema, layout: newLayout } };
    }),

    // Hàm thay đổi độ rộng cột (Gọi khi kéo thanh Slider từ LayoutManager)
    updateColumnWidths: (leftWidth) => set((state) => {
        const newLayout = [...state.layoutSchema.layout];

        if (newLayout[0] && newLayout[0].columns.length >= 2) {
            newLayout[0].columns[0].widthPercentage = leftWidth;
            newLayout[0].columns[1].widthPercentage = 100 - leftWidth;
        }

        return {
            layoutSchema: { ...state.layoutSchema, layout: newLayout },
            // Cập nhật song song vào layoutSettings cũ để đồng bộ thiết kế cũ
            layoutSettings: { ...state.layoutSettings, leftColumnWidth: leftWidth }
        };
    }),

    // Hàm bật/tắt hiển thị một mục (Ví dụ: Ẩn mục Học vấn)
    toggleSectionVisibility: (sectionId) => set((state) => ({
        sections: state.sections.map(sec =>
            sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
        )
    })),

    // Cập nhật cài đặt thiết kế như Màu, Font, Cỡ chữ, Khoảng cách dòng
    updateLayoutSetting: (key, value) => set((state) => ({
        layoutSettings: { ...state.layoutSettings, [key]: value }
    }))
}));

export default useCvStore;