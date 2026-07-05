const fs = require('fs');

let file = fs.readFileSync('features/checkin/CheckinScanner.tsx', 'utf8');

// Insert Search and Users icons if not present
if (!file.includes('Users')) {
    file = file.replace("import { CheckCircle, XCircle, ArrowLeft, ScanLine, Clock, CheckCircle2 } from 'lucide-react';", "import { CheckCircle, XCircle, ArrowLeft, ScanLine, Clock, CheckCircle2, Users, Search } from 'lucide-react';");
}

fs.writeFileSync('features/checkin/CheckinScanner.tsx', file);
