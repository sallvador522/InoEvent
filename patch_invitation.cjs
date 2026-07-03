const fs = require('fs');
let code = fs.readFileSync('features/invitation/InvitationView.tsx', 'utf8');

code = code.replace(
`    navigate(
      \`/invite/\${newId}?edit=true&new=true&template=\${activeEvent.layoutMode}&theme=\${activeEvent.type}\`,
    );`,
`    navigate(
      \`/invite/\${newId}?edit=true&new=true&baseId=\${activeEvent.id}&template=\${activeEvent.layoutMode}&theme=\${activeEvent.type}\`,
    );`
);

code = code.replace(
`      const templateParam =
        (urlParams.get("template") as LayoutMode) || "CLASSIC";
      const themeParam =
        (urlParams.get("theme") as ThemeType) || ThemeType.WEDDING;

      if (isNew) {
        const baseTpl =
          EVENTS.find((e) => e.layoutMode === templateParam) || EVENTS[0];`,
`      const templateParam =
        (urlParams.get("template") as LayoutMode) || "CLASSIC";
      const themeParam =
        (urlParams.get("theme") as ThemeType) || ThemeType.WEDDING;
      const baseIdParam = urlParams.get("baseId");

      if (isNew) {
        let baseTpl = EVENTS.find((e) => e.layoutMode === templateParam) || EVENTS[0];
        if (baseIdParam) {
           const specific = EVENTS.find((e) => e.id === baseIdParam);
           if (specific) baseTpl = specific;
        }`
);

fs.writeFileSync('features/invitation/InvitationView.tsx', code);
