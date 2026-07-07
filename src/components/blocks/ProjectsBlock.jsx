import React from 'react';
import { Typography } from 'antd';
import useCvStore from '../../store/useCvStore';

const { Title } = Typography;

const ProjectsBlock = ({ styles }) => {
    const projects = useCvStore(state => state.cvData.projects);
    const themeColor = useCvStore(state => state.layoutSettings.themeColor);
    const headingColor = styles?.headingColor || themeColor;

    if (!projects || projects.length === 0) return null;

    return (
        <div style={{ marginBottom: '32px' }}>
            {styles?.headingStyle === 'pill' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: headingColor, color: '#fff', padding: '6px 20px', borderRadius: '24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', whiteSpace: 'nowrap' }}>Dự án</div>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#d9d9d9' }}></div>
                </div>
            ) : styles?.headingStyle === 'gray-bar' ? (
                <div style={{ backgroundColor: '#f4f4f4', padding: '12px 0', textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={4} style={{ color: headingColor, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'inherit' }}>Dự án</Title>
                </div>
            ) : (
                <Title level={4} style={{ color: headingColor, borderBottom: `2px solid ${headingColor}`, display: 'inline-block', paddingBottom: '4px', marginBottom: '24px', fontFamily: 'inherit' }}>Dự án</Title>
            )}
            
            {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '1.1em', color: '#333' }}>{proj.name}</strong>
                        <span style={{ fontSize: '0.9em', color: '#666', fontWeight: 500 }}>{proj.time}</span>
                    </div>
                    {proj.role && (
                        <div style={{ color: '#555', marginBottom: '2px', fontSize: '0.95em' }}>
                            <span style={{ fontWeight: 600 }}>Vị trí:</span> {proj.role}
                        </div>
                    )}
                    {proj.technologies && (
                        <div style={{ color: '#555', marginBottom: '2px', fontSize: '0.95em' }}>
                            <span style={{ fontWeight: 600 }}>Công nghệ:</span> {proj.technologies}
                        </div>
                    )}
                    {proj.link && (
                        <div style={{ color: '#555', marginBottom: '4px', fontSize: '0.95em' }}>
                            <span style={{ fontWeight: 600 }}>Link:</span> <a href={proj.link} target="_blank" rel="noreferrer" style={{ color: headingColor, textDecoration: 'none' }}>{proj.link}</a>
                        </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#444', textAlign: 'justify', marginTop: '6px' }}>
                        {proj.description}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectsBlock;