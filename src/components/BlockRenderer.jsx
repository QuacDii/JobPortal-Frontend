import React from 'react';
import AvatarBlock from './blocks/AvatarBlock';
import ExperienceBlock from './blocks/ExperienceBlock';
import HeaderBlock from './blocks/HeaderBlock';
import ContactBlock from './blocks/ContactBlock';
import SummaryBlock from './blocks/SummaryBlock';
import SkillsBlock from './blocks/SkillsBlock';
import HobbiesBlock from './blocks/HobbiesBlock';
import CertificatesBlock from './blocks/CertificatesBlock';
import EducationBlock from './blocks/EducationBlock';
import ActivitiesBlock from './blocks/ActivitiesBlock';
import ProjectsBlock from './blocks/ProjectsBlock';
import AwardsBlock from './blocks/AwardsBlock';
import ReferencesBlock from './blocks/ReferencesBlock';

const BlockComponents = {
    AvatarBlock: AvatarBlock,
    ExperienceBlock: ExperienceBlock,
    HeaderBlock: HeaderBlock,
    ContactBlock: ContactBlock,
    SummaryBlock: SummaryBlock,
    SkillsBlock: SkillsBlock,
    HobbiesBlock: HobbiesBlock,
    CertificatesBlock: CertificatesBlock,
    EducationBlock: EducationBlock,
    ActivitiesBlock: ActivitiesBlock,
    ProjectsBlock: ProjectsBlock,
    AwardsBlock: AwardsBlock,
    ReferencesBlock: ReferencesBlock,
};

const BlockRenderer = ({ blockConfig }) => {
    const Component = BlockComponents[blockConfig.type];
    if (!Component) {
        return <div style={{ color: 'red', padding: '10px' }}>⚠️ Thiếu component: {blockConfig.type}</div>;
    }
    return <Component styles={blockConfig.styles} />;
};

export default BlockRenderer;