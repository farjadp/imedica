const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/web/src/features/home/pages/HomePage.tsx',
  'apps/web/src/features/marketing/components/MarketingNavbar.tsx',
  'apps/web/src/features/marketing/components/MarketingFooter.tsx',
  'apps/web/src/features/marketing/pages/AboutUsPage.tsx',
  'apps/web/src/features/marketing/pages/ClinicalScenariosPage.tsx',
  'apps/web/src/features/marketing/pages/ContactUsPage.tsx',
  'apps/web/src/features/marketing/pages/PlatformFeaturesPage.tsx',
  'apps/web/src/features/marketing/pages/ProductPage.tsx',
  'apps/web/src/features/marketing/pages/RoadmapPage.tsx'
];

filesToFix.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace text-text with text-white
  content = content.replace(/text-text /g, 'text-white ');
  content = content.replace(/text-text"/g, 'text-white"');
  
  // Replace text-text-muted with text-white/70
  content = content.replace(/text-text-muted/g, 'text-white/70');

  // Replace placeholder-text-muted with placeholder-white/50
  content = content.replace(/placeholder-text-muted/g, 'placeholder-white/50');
  
  // Also adjust text-white/60 in Navbar to text-white/70 for better contrast
  if (filePath.includes('MarketingNavbar.tsx')) {
    content = content.replace(/text-white\/60/g, 'text-white/70');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed colors in ${filePath}`);
});
