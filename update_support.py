import re

with open('components/SupportModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'interface SupportModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n}',
    'interface SupportModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  userPlan?: string;\n}'
)
content = content.replace(
    'export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {',
    'export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userPlan }) => {\n  const isBusiness = userPlan === "Business" || userPlan === "Corporate";\n'
)

content = content.replace(
    '<span className="text-[10px] text-emerald-100 block font-bold uppercase tracking-wider">Agente Principal</span>',
    '<span className="text-[10px] text-emerald-100 block font-bold uppercase tracking-wider">{isBusiness ? "Gestor de Conta Dedicado" : "Agente Principal"}</span>'
)

with open('components/SupportModal.tsx', 'w') as f:
    f.write(content)
