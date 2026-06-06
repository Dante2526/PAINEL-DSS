import { TurmaType, TURMA_DISPLAY_NAMES } from './turmaUtils';

export const generateHealthAlertEmail = (
    name: string,
    matricula: string,
    turno: string,
    turma: TurmaType
): { html: string; subject: string } => {
    const currentTime = new Date().toLocaleString('pt-BR');
    
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerta de Saúde</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; width: 100%;">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                        <tr>
                            <td style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
                                🚨 Alerta de Saúde: Colaborador informou "ESTOU MAL". Verifique imediatamente.
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="border-left: 4px solid #dc2626; padding-left: 15px;">
                                            <h1 style="margin: 0; color: #dc2626; font-size: 24px; font-weight: bold; line-height: 1.2;">
                                                Alerta de Saúde e Segurança!
                                            </h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 30px;">
                                <p style="margin: 0; font-size: 18px; line-height: 1.5; color: #000000;">
                                    O colaborador <strong>${name}</strong> informou que não está se sentindo bem.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 30px;">
                                <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                                    <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
                                        DETALHES DO REGISTRO:
                                    </p>
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="padding-bottom: 8px; width: 100px; vertical-align: top;">
                                                <strong style="font-size: 15px; color: #000000;">Nome:</strong>
                                            </td>
                                            <td style="padding-bottom: 8px; vertical-align: top;">
                                                <span style="font-size: 15px; color: #000000; font-weight: bold;">${name}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 8px; width: 100px; vertical-align: top;">
                                                <strong style="font-size: 15px; color: #000000;">Matrícula:</strong>
                                            </td>
                                            <td style="padding-bottom: 8px; vertical-align: top;">
                                                <span style="font-size: 15px; color: #000000; font-weight: bold;">${matricula}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 8px; width: 100px; vertical-align: top;">
                                                <strong style="font-size: 15px; color: #000000;">Turno:</strong>
                                            </td>
                                            <td style="padding-bottom: 8px; vertical-align: top;">
                                                <span style="font-size: 15px; color: #000000; font-weight: bold;">${turno}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding-bottom: 0; width: 100px; vertical-align: top;">
                                                <strong style="font-size: 15px; color: #000000;">Horário:</strong>
                                            </td>
                                            <td style="padding-bottom: 0; vertical-align: top;">
                                                <span style="font-size: 15px; color: #000000; font-weight: bold;">${currentTime}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="background-color: #ff5252; border-radius: 8px; padding: 16px; border: 1px solid #ff5252;">
                                            <span style="color: #000000; font-weight: bold; font-size: 16px;">
                                                Por favor, verifique a situação imediatamente.
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-top: 30px;">
                                <p style="margin: 0; font-size: 12px; color: #000000;">
                                    Este é um e-mail automático do sistema DSS.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    const subject = `🚨 ALERTA URGENTE TURMA ${TURMA_DISPLAY_NAMES[turma]}: "ESTOU MAL"`;

    return { html, subject };
};
