import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
import_statement = "import Joyride, { CallBackProps, STATUS } from 'react-joyride';"
if 'react-joyride' not in content:
    content = content.replace("import { motion } from \"framer-motion\";", f"import {{ motion }} from \"framer-motion\";\n{import_statement}")

# 2. Add state
state_code = """
  // Tour state
  const [runTour, setRunTour] = useState(() => {
    return isEditing && isNew && localStorage.getItem('hasSeenTour') !== 'true';
  });

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  const tourSteps = [
    {
      target: '.tour-editor-header',
      content: 'Bem-vindo ao Estúdio de Criação! Aqui no topo você encontra o painel principal para salvar e gerenciar seu convite.',
      disableBeacon: true,
    },
    {
      target: '.tour-wysiwyg',
      content: 'Para personalizar, basta clicar em qualquer texto ou imagem! Você edita diretamente na tela e vê o resultado na hora.',
    },
    {
      target: '.tour-save-draft',
      content: 'Ainda não terminou? Salve como rascunho para continuar depois sem que ninguém veja.',
    },
    {
      target: '.tour-publish',
      content: 'Tudo pronto? Clique em Publicar para que seus convidados possam acessar e confirmar presença!',
    }
  ];

"""

if 'const [runTour, setRunTour] = useState' not in content:
    content = content.replace('const editParam = new URLSearchParams(window.location.search).get("edit") === "true";', state_code + 'const editParam = new URLSearchParams(window.location.search).get("edit") === "true";')


# 3. Add classes to elements
old_header = '<div\n          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ease-in-out ${isEditorBarExpanded ? "w-[95%] md:w-fit max-w-[95vw] md:max-w-4xl translate-y-0" : "w-auto -translate-y-2 hover:translate-y-0"}`}\n        >'
new_header = '<div\n          className={`tour-editor-header fixed top-4 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ease-in-out ${isEditorBarExpanded ? "w-[95%] md:w-fit max-w-[95vw] md:max-w-4xl translate-y-0" : "w-auto -translate-y-2 hover:translate-y-0"}`}\n        >'
content = content.replace(old_header, new_header)

old_save_draft = 'className="px-3 md:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"'
new_save_draft = 'className="tour-save-draft px-3 md:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"'
content = content.replace(old_save_draft, new_save_draft)

old_publish = 'className="px-3 md:px-5 py-2 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"'
new_publish = 'className="tour-publish px-3 md:px-5 py-2 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"'
content = content.replace(old_publish, new_publish)

old_wysiwyg = '<div className="flex-1 overflow-y-auto bg-slate-100/90 relative pb-36 px-2 md:px-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">'
new_wysiwyg = '<div className="tour-wysiwyg flex-1 overflow-y-auto bg-slate-100/90 relative pb-36 px-2 md:px-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">'
content = content.replace(old_wysiwyg, new_wysiwyg)

# 4. Add Joyride component
joyride_component = """
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous={true}
          showSkipButton={true}
          showProgress={true}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#3B82F6',
              textColor: '#334155',
              zIndex: 10000,
            },
            tooltip: {
              borderRadius: '16px',
              fontFamily: 'Inter, sans-serif',
              padding: '24px',
            },
            buttonNext: {
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              padding: '8px 16px',
            },
            buttonBack: {
              marginRight: '8px',
              color: '#64748B',
            },
            buttonSkip: {
              color: '#94A3B8',
              fontSize: '14px',
            }
          }}
          locale={{
            back: 'Anterior',
            close: 'Fechar',
            last: 'Entendi!',
            next: 'Próximo',
            skip: 'Pular Tour'
          }}
        />
"""
content = content.replace('<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">', joyride_component)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

print("Tour script ready.")
