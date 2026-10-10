const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/web/src/features/home/pages/HomePage.tsx',
  'apps/web/src/features/marketing/pages/AboutUsPage.tsx',
  'apps/web/src/features/marketing/pages/ClinicalScenariosPage.tsx',
  'apps/web/src/features/marketing/pages/ContactUsPage.tsx',
  'apps/web/src/features/marketing/pages/PlatformFeaturesPage.tsx',
  'apps/web/src/features/marketing/pages/ProductPage.tsx',
  'apps/web/src/features/marketing/pages/RoadmapPage.tsx'
];

filesToFix.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace bg-background with bg-[#050505]
  content = content.replace(/bg-background/g, 'bg-[#050505]');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed bg in ${filePath}`);
});
