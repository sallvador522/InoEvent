import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# 1. Update isTemporarilyBlocked
old_blocked = """
  // Check if event is blocked
  const isTemporarilyBlocked = !isEditing && activeEvent && (
    activeEvent.isBlocked || activeEvent.isPublished === false || 
    (activeEvent.scheduledBlockDate && new Date(activeEvent.scheduledBlockDate) <= new Date())
  );
"""

new_blocked = """
  // Check if event is blocked
  const isPast30Days = activeEvent?.isoDate ? (new Date().getTime() - new Date(activeEvent.isoDate).getTime()) > 30 * 24 * 60 * 60 * 1000 : false;
  const isTemporarilyBlocked = !isEditing && activeEvent && (
    activeEvent.isBlocked || activeEvent.isPublished === false || 
    (activeEvent.scheduledBlockDate && new Date(activeEvent.scheduledBlockDate) <= new Date()) ||
    (((activeEvent as any).plan === 'Essencial' || !(activeEvent as any).plan) && isPast30Days)
  );
"""
content = content.replace(old_blocked, new_blocked)

# 2. Update addGalleryImage
old_add_gallery = """
  const addGalleryImage = () => {
    setLocalEvent((prev) => {
"""

new_add_gallery = """
  const addGalleryImage = () => {
    const plan = userProfile?.plan || 'Essencial';
    if (plan === 'Essencial' && (localEvent?.gallery?.length || 0) >= 10) {
      toast.error("A Galeria Básica permite até 10 fotos. Faça upgrade para adicionar mais!");
      return;
    }
    setLocalEvent((prev) => {
"""
content = content.replace(old_add_gallery, new_add_gallery)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

print("Applied essential limits")
