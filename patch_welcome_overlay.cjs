const fs = require('fs');
let code = fs.readFileSync('features/invitation/InvitationView.tsx', 'utf8');

// 1. Inject state
const searchStr = `const [isRSVPOpen, setRSVPOpen] = useState(false);`;
if (!code.includes('const [hasOpened, setHasOpened] = useState(false);')) {
    code = code.replace(
        searchStr,
        `const [isRSVPOpen, setRSVPOpen] = useState(false);\n  const [hasOpened, setHasOpened] = useState(false);`
    );
}

// 2. Inject overlay render right after `return (` of the main block
// Let's find the main return which has:
// return (
//    <>
//      <SEO 
const returnStr = `return (
    <>
      <SEO `;

const overlayJSX = `return (
    <>
      {/* WELCOME ENVELOPE OVERLAY */}
      <AnimatePresence>
        {!hasOpened && !isEditing && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white"
            style={{
               backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(' + getImageUrl(activeEvent.heroImage) + ')',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center px-6 flex flex-col items-center max-w-md"
            >
              <span className="material-symbols-outlined text-5xl mb-6 text-brand-gold opacity-80">mail</span>
              <h1 className="font-serif text-3xl md:text-5xl mb-4 font-bold leading-tight">{activeEvent.title}</h1>
              <p className="text-slate-300 mb-10 font-sans text-sm md:text-base tracking-widest uppercase">
                Você tem um convite
              </p>
              <button 
                  onClick={() => {
                      setHasOpened(true);
                      // Trigger audio play if TocaPlayer didn't autoplay
                      const audioEls = document.getElementsByTagName('audio');
                      for (let i = 0; i < audioEls.length; i++) {
                          audioEls[i].play().catch(e => console.log('Audio play failed on open', e));
                      }
                  }}
                  className="bg-white text-slate-900 px-12 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-2xl"
              >
                  Abrir Convite
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SEO `;

if (!code.includes('WELCOME ENVELOPE OVERLAY')) {
    code = code.replace(returnStr, overlayJSX);
    fs.writeFileSync('features/invitation/InvitationView.tsx', code);
    console.log('Patched Welcome Overlay');
} else {
    console.log('Already patched');
}
