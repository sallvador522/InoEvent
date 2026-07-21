const fs = require('fs');
const path = require('path');

const galleryPath = path.join(process.cwd(), 'features', 'landing', 'TemplateGalleryPage.tsx');
if (fs.existsSync(galleryPath)) {
  let code = fs.readFileSync(galleryPath, 'utf8');

  // Insert imports
  code = code.replace(
    /import React, \{ useState, useEffect \} from 'react';/,
    "import React, { useState, useEffect } from 'react';\nimport { Sparkles, Heart, Gift, Baby, Briefcase, Hourglass, Sparkle } from 'lucide-react';"
  );

  // Replace category icon rendering
  code = code.replace(
    /<span className="material-symbols-outlined text-\[20px\]">\{cat\.icon\}<\/span>/,
    `{cat.id === 'all' && <Sparkles className="w-4 h-4" />}
                            {cat.id === 'wedding' && <Heart className="w-4 h-4" />}
                            {cat.id === 'bridal' && <Gift className="w-4 h-4" />}
                            {cat.id === 'birthday' && <Sparkle className="w-4 h-4" />}
                            {cat.id === 'baby' && <Baby className="w-4 h-4" />}
                            {cat.id === 'corporate' && <Briefcase className="w-4 h-4" />}`
  );

  // Replace empty state icon
  code = code.replace(
    /<span className="material-symbols-outlined text-6xl text-slate-300 mb-6">hourglass_empty<\/span>/,
    "<Hourglass className=\"w-16 h-16 text-slate-300 mb-6\" />"
  );

  fs.writeFileSync(galleryPath, code);
  console.log('Successfully patched TemplateGalleryPage.tsx!');
} else {
  console.error('TemplateGalleryPage.tsx not found!');
}
