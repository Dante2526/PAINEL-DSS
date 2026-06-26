const fs = require('fs');
const path = require('path');

const replacements = [
    ['ConfirmAbsentModal', 'ConfirmAusenteModal'],
    ['AbsentIcon', 'AusenteIcon'],
    ['absent:', 'ausente:'],
    ['absent =', 'ausente ='],
    ['absent.', 'ausente.'],
    ['e.absent', 'e.ausente'],
    ['employee.absent', 'employee.ausente'],
    ['data.absent', 'data.ausente'],
    ['updatedData.absent', 'updatedData.ausente'],
    ['finalStates.absent', 'finalStates.ausente'],
    ['stats.absent', 'stats.ausente'],
    ["type === 'absent'", "type === 'ausente'"],
    ["type === \"absent\"", "type === \"ausente\""],
    ["processStatusUpdate(pendingEmployeeId, 'absent')", "processStatusUpdate(pendingEmployeeId, 'ausente')"],
    ['ModalType.ConfirmAbsent', 'ModalType.ConfirmAusente'],
    ['handleConfirmAbsent', 'handleConfirmAusente'],
    ['<ConfirmAbsentModal', '<ConfirmAusenteModal']
];

const files = [
    'App.tsx',
    'components/icons.tsx',
    'components/modals/ConfirmAbsentModal.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    
    for (const [oldStr, newStr] of replacements) {
        content = content.split(oldStr).join(newStr);
    }
    
    if (file === 'App.tsx') {
        content = content.replace('ausente: data.ausente,', 'ausente: data.ausente !== undefined ? data.ausente : (data.absent || false),');
    }
    
    fs.writeFileSync(file, content, 'utf8');
}

if (fs.existsSync('components/modals/ConfirmAbsentModal.tsx')) {
    fs.renameSync('components/modals/ConfirmAbsentModal.tsx', 'components/modals/ConfirmAusenteModal.tsx');
}

console.log("Done");
