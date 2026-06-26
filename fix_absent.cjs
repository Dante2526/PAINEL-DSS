const fs = require('fs');

function replaceInFile(file, regex, replacement) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(regex, replacement);
        fs.writeFileSync(file, content, 'utf8');
    }
}

replaceInFile('components/EmployeeCard.tsx', /AbsentIcon/g, 'AusenteIcon');
replaceInFile('components/EmployeeCard.tsx', /'absent'/g, "'ausente'");
replaceInFile('components/EmployeeCard.tsx', /employee\.absent/g, 'employee.ausente');

replaceInFile('components/SpecialTeamPanel.tsx', /e\.absent/g, 'e.ausente');

replaceInFile('components/modals/ImportEmployeeModal.tsx', /absent:/g, 'ausente:');

console.log('Fixed additional files');
