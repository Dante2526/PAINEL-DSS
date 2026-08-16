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

<RULE[adding_new_teams]>
## Procedimentos ao Adicionar Novas Turmas

Sempre que uma nova turma for adicionada ao sistema, o agente deve instruir o usuário a realizar as seguintes ações manuais para garantir o funcionamento correto das automações e filtros:

1. **Configuração de Rotas de E-mail (Outlook/Gmail):**
   Lembre o usuário que o assunto do e-mail é gerado com colchetes ao redor do nome da turma (ex: `[TURMA NOVA_TURMA]`). As regras de encaminhamento e filtro no provedor de e-mail devem usar essa string exata (com os colchetes) para evitar conflitos de nomes parecidos.

2. **Ativação do Turno Secundário (18H/6H):**
   Por padrão, todas as novas turmas nascem com o turno secundário desativado no e-mail (para não mover funcionários inadvertidamente via painel). Se a turma precisar do turno secundário ativo desde o início sem efeitos colaterais:
   - Instrua o usuário a ir ao Firebase Console (Firestore).
   - Acessar a coleção da turma recém-criada (ex: `registrosDSS NOVA_TURMA`).
   - Criar manualmente um documento com ID exato `config_6H`.
   - Adicionar o campo `ativado` do tipo `boolean` (booleano) com valor `true` (verdadeiro).

3. **Configuração do Cronjob:**
   Forneça ao usuário os links prontos para ele copiar e colar no serviço de cronjob (ex: cron-job.org), substituindo a letra/nome da turma:
   - URL para Disparo de Relatório: `https://[SEU-DOMINIO]/api/relatorio?team=[LETRA_DA_TURMA]&token=[SEU_TOKEN]`
   - URL para Limpeza Diária: `https://[SEU-DOMINIO]/api/limpar?team=[LETRA_DA_TURMA]&token=[SEU_TOKEN]`
</RULE[adding_new_teams]>

<RULE[layout_width_constraint]>
## Restrição de Largura do Layout (Design Intencional)

ATENÇÃO: A largura do contêiner principal no layout (ex: `minWidth: '2658px'` em `App.tsx` para o layout customizado) é fixada em tamanhos grandes de forma PROPOSITAL, mesmo para turmas com poucos colaboradores.

- O espaço em branco que sobra à direita em turmas pequenas é uma decisão de design aceita pelo usuário.
- O objetivo dessa largura estendida é impedir que o cabeçalho superior "encolha" e achate os botões (como "TROCAR TURMA", "TUTORIAL", "ACESSO ADM") contra o texto do título.
- NÃO proponha refatorações ou aponte problemas ("Issues") para tornar essa largura estritamente proporcional ao número exato de colunas/cards se isso resultar na redução da largura do painel. Trate esse comportamento de esticar a interface como definitivo e esperado.
</RULE[layout_width_constraint]>