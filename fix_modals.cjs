const fs = require('fs');

// ManageAdminsModal
let file = 'components/modals/ManageAdminsModal.tsx';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/ShieldCheckIcon/g, 'InfoIcon');
    content = content.replace(/UserAddIcon/g, 'UserPlusIcon');
    fs.writeFileSync(file, content, 'utf8');
}

// AuditLogModal
file = 'components/modals/AuditLogModal.tsx';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/size="xl"/g, 'size="lg"');
    fs.writeFileSync(file, content, 'utf8');
}

console.log('Fixed additional errors');
