import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Spin, Button, message, ConfigProvider, theme } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import useCvStore from '../store/useCvStore';
import MasterTemplate from '../components/MasterTemplate';

const ViewCv = () => {
    // Nếu URL là /cv/preview, id sẽ mang giá trị 'preview'
    const { id } = useParams(); 
    
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ themeColor: '#00b14f', fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: 13.5, lineHeight: 1.5, backgroundStyle: 'none' });
    const setInitialData = useCvStore(state => state.setInitialData);

    useEffect(() => {
        const fetchCv = async () => {
            try {
                // ====================================================
                // CHẾ ĐỘ 1: XEM TRƯỚC CV CHƯA LƯU TỪ TRANG CV BUILDER
                // ====================================================
                if (id === 'preview') {
                    const previewData = localStorage.getItem('cv_live_preview');
                    if (previewData) {
                        const parsed = JSON.parse(previewData);
                        setSettings(parsed.settings || {});
                        setInitialData(parsed.layoutSchema, parsed.cvData);
                    } else {
                        message.error('Không tìm thấy dữ liệu xem trước! Vui lòng quay lại trang chỉnh sửa CV.');
                    }
                } 
                // ====================================================
                // CHẾ ĐỘ 2: XEM CV ĐÃ LƯU BẰNG DỮ LIỆU TỪ DATABASE
                // ====================================================
                else {
                    const res = await apiClient.get(`/Cv/${id}`);
                    const actualCv = res.data ? res.data : res;
                    
                    if (actualCv) {
                        setSettings({
                            themeColor: actualCv.maHex || actualCv.MaHex || '#00b14f',
                            fontFamily: actualCv.fontChu || '"Be Vietnam Pro", sans-serif',
                            backgroundStyle: actualCv.hinhNen || 'none',
                            fontSize: 13.5, 
                            lineHeight: 1.5
                        });
                        
                        const layoutJson = actualCv.customLayoutJson ? (typeof actualCv.customLayoutJson === 'string' ? JSON.parse(actualCv.customLayoutJson) : actualCv.customLayoutJson) : null;
                        const contentData = actualCv.duLieuCv ? (typeof actualCv.duLieuCv === 'string' ? JSON.parse(actualCv.duLieuCv) : actualCv.duLieuCv) : null;
                        
                        setInitialData(layoutJson, contentData);
                    }
                }
            } catch (err) {
                message.error('Không thể tải dữ liệu CV!');
            } finally {
                setLoading(false);
            }
        };
        fetchCv();
    }, [id, setInitialData]);

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#525659' }}><Spin size="large" /></div>;

    return (
        <div style={{ background: '#525659', minHeight: '100vh', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <style>{`
                .cv-a4-paper {
                    background: ${settings.backgroundStyle !== 'none' ? settings.backgroundStyle : 'white'};
                    width: 210mm;
                    min-height: 297mm;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    border-radius: 4px;
                    overflow: hidden;
                }
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .cv-a4-paper { box-shadow: none; border-radius: 0; width: 100%; min-height: auto; transform: scale(1) !important; }
                }

                /* ========================================================
                   ÉP ẨN CÁC VIỀN CHỈNH SỬA & PLACEHOLDER ĐỂ XEM NHƯ BẢN IN
                   ======================================================== */
                .is-exporting ::-webkit-input-placeholder { color: transparent !important; }
                .is-exporting ::-moz-placeholder { color: transparent !important; }
                .is-exporting :-ms-input-placeholder { color: transparent !important; }
                .is-exporting ::placeholder { color: transparent !important; }
                .is-exporting [contenteditable]:empty::before,
                .is-exporting [data-placeholder]:empty::before { content: "" !important; display: none !important; }
                .is-exporting .ProseMirror p.is-editor-empty:first-child::before,
                .is-exporting .ProseMirror .is-empty::before { content: "" !important; display: none !important; }
                .is-exporting .cv-macro-section-block.has-empty-required [contenteditable="true"], 
                .is-exporting .cv-macro-section-block.has-empty-required input { border: none !important; outline: none !important; }
                .is-exporting .cv-macro-section-block:hover { border-color: transparent !important; }
            `}</style>

            <div className="no-print" style={{ width: '210mm', display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ backgroundColor: '#00b14f', borderColor: '#00b14f' }}>
                    In / Tải PDF
                </Button>
            </div>

            <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                <div
                    /* Class is-exporting giúp trang này hiển thị bản sạch giống như file PDF */
                    className="cv-a4-paper cv-preview-page is-exporting"
                    style={{
                        '--theme-color': settings.themeColor,
                        '--font-family': settings.fontFamily,
                        '--base-font-size': `${settings.fontSize}px`,
                        '--line-height': settings.lineHeight,
                        /* Đóng băng toàn bộ thao tác click/edit của người dùng trong trang Xem */
                        pointerEvents: 'none' 
                    }}
                >
                    <MasterTemplate />
                </div>
            </ConfigProvider>
        </div>
    );
};

export default ViewCv;