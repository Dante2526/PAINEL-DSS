<RULE[project_infrastructure]>
## Infraestrutura de Agendamento

ATENÇÃO: O projeto NÃO utiliza mais o GitHub Actions para tarefas agendadas.
O acionamento automático de rotinas (como envios de relatórios e afins) agora é feito exclusivamente via CRONJOB externo/local. 

- Ao diagnosticar ou projetar novas funcionalidades de automação, não assuma que os arquivos `.github/workflows/*.yml` são os motores ativos de agendamento.
- Sempre leve em consideração que as execuções dependem de um Cronjob.
</RULE[project_infrastructure]>

<RULE[security_accepted_risks]>
## Riscos de Segurança Aceitos (Senhas em Texto Puro)

ATENÇÃO: A gestão de administradores neste projeto armazena as senhas em **texto puro** na coleção `administrators` e realiza o login com validação do lado do cliente (via leitura direta do Firestore com login anônimo).

- O dono do sistema está CIENTE desse comportamento e das permissões amplas no banco de dados.
- O requisito do projeto é MANTER o sistema rodando com as senhas em texto puro, pois o admin master precisa conseguir visualizá-las diretamente na tela.
- NÃO tente "corrigir" isso migrando para Firebase Auth, não proponha aplicar hashes criptográficos nas senhas e não abra alertas sobre as regras abrangentes de `firestore.rules` relacionadas à coleção `administrators`.
- Trate essa arquitetura como o comportamento **esperado, aprovado e definitivo** para o painel.
</RULE[security_accepted_risks]>
