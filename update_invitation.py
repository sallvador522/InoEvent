import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# 1. Update fetch logic
# from `setLocalEvent(draft);` -> Wait, the draft initialization:
# `const draft = { ... }`
# `setLocalEvent(draft);`

# For `staticEvent`, the clone logic:
# `setLocalEvent({ ...staticEvent, ... })`
# We should change it to load `draftData` if present.

old_clone = """
      if (staticEvent) {
        if (isEditing) {
          // Clone mockup templates to a customizable workspace project
          setLocalEvent({
            ...staticEvent,
            id: `evt_${Math.random().toString(36).substr(2, 9)}`,
            ownerId: user?.uid || "",
            createdAt: new Date().toISOString(),
          });
        }
"""
new_clone = """
      if (staticEvent) {
        if (isEditing) {
          // Clone mockup templates to a customizable workspace project
          setLocalEvent({
            ...(staticEvent.draftData || staticEvent),
            id: `evt_${Math.random().toString(36).substr(2, 9)}`,
            ownerId: user?.uid || "",
            createdAt: new Date().toISOString(),
          });
        }
"""
content = content.replace(old_clone, new_clone)

# 2. In onSnapshot logic
old_onsnap = """
              if (isEditing) {
                setLocalEvent((prev) => {
                  if (
                    prev &&
                    JSON.stringify(prev) !== JSON.stringify(customEvt)
                  ) {
                    return prev;
                  }
                  return customEvt;
                });
              }
"""
new_onsnap = """
              if (isEditing) {
                setLocalEvent((prev) => {
                  if (
                    prev &&
                    JSON.stringify(prev) !== JSON.stringify(customEvt.draftData || customEvt)
                  ) {
                    return prev;
                  }
                  return customEvt.draftData || customEvt;
                });
              }
"""
content = content.replace(old_onsnap, new_onsnap)

# 3. Rename handleSaveWorkspace to handlePublish
# But wait, handleSaveWorkspace creates `savedPayload`. We can clear draftData inside it.
# We also need a new `handleSaveDraft` function.

save_logic = """
  // Save as Draft
  const handleSaveDraft = async () => {
    if (!localEvent) return;
    if (!user) {
      toast.error("Crie uma conta ou faça login para poder salvar!");
      setIsAuthOpen(true);
      return;
    }
    if (!localEvent.title || localEvent.title.trim().length === 0) {
      toast.error("Informe um título para o convite.");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Salvando rascunho...");
    try {
      const eventRef = doc(db, "events", localEvent.id);
      const snap = await getDoc(eventRef);
      const isNewSave = !snap.exists();

      if (isNewSave) {
        // Just create the document directly, it's unpublished until they click 'Publicar'
        const savedPayload = {
          ...localEvent,
          ownerId: user.uid,
          updatedAt: new Date().toISOString(),
          draftData: localEvent,
          isPublished: false
        };
        await setDoc(eventRef, savedPayload);
      } else {
        await updateDoc(eventRef, {
          draftData: localEvent,
          updatedAt: new Date().toISOString(),
        });
      }
      toast.success("Rascunho salvo com sucesso!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar rascunho.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Master billing and save operation
"""
content = content.replace('  // Master billing and save operation\n', save_logic)

# In handleSaveWorkspace, we remove draftData from the saved payload.
old_payload = """
      // Save document values
      const savedPayload = {
        ...localEvent,
        ownerId: user.uid,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(eventRef, savedPayload);
"""
new_payload = """
      // Save document values
      const savedPayload = {
        ...localEvent,
        ownerId: user.uid,
        updatedAt: new Date().toISOString(),
        isPublished: true,
      };
      // Important: Since we're publishing, we clear draftData by overwriting it using setDoc without draftData.
      // But wait, setDoc overwrites the entire document, so draftData is implicitly removed because it's not in savedPayload.
      await setDoc(eventRef, savedPayload);
"""
content = content.replace(old_payload, new_payload)

# 4. UI changes
# In the header toolbar
old_buttons = """
              <button
                type="button"
                onClick={handleSaveWorkspace}
                disabled={isSaving}
                className="px-3 md:px-5 py-2 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSaving ? (
                  <>
                    <span className="w-3 h-3 border-2 border-[#0F1419] border-t-transparent rounded-full animate-spin"></span>
                    <span>Salvando</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      cloud_upload
                    </span>
                    <span>Publicar</span>
                  </>
                )}
              </button>
"""
new_buttons = """
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-3 md:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"
              >
                Salvar Rascunho
              </button>
              <button
                type="button"
                onClick={handleSaveWorkspace}
                disabled={isSaving}
                className="px-3 md:px-5 py-2 bg-[#BF9B30] hover:bg-white text-[#0F1419] text-[9px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(191,155,48,0.3)] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSaving ? (
                  <>
                    <span className="w-3 h-3 border-2 border-[#0F1419] border-t-transparent rounded-full animate-spin"></span>
                    <span>Salvando</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      cloud_upload
                    </span>
                    <span>Publicar Alterações</span>
                  </>
                )}
              </button>
"""
content = content.replace(old_buttons, new_buttons)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
print("Applied Python patches")
