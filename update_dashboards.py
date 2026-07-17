with open('features/dashboard/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace('<SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />', '<SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} userPlan={event?.plan} />')

with open('features/dashboard/Dashboard.tsx', 'w') as f:
    f.write(content)

with open('features/dashboard/UserDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace('<SupportModal\n        isOpen={isSupportOpen}\n        onClose={() => setIsSupportOpen(false)}\n      />', '<SupportModal\n        isOpen={isSupportOpen}\n        onClose={() => setIsSupportOpen(false)}\n        userPlan={userProfile?.plan}\n      />')

with open('features/dashboard/UserDashboard.tsx', 'w') as f:
    f.write(content)
