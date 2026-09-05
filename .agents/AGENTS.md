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

<RULE[domain_terminology]>
## Terminologia de Negócio: As 4 Rotas Operacionais

ATENÇÃO: A operação no mundo real é dividida estritamente em quatro contextos distintos. Nunca confunda ou misture essas nomenclaturas nas conversas com o usuário ou na lógica do código:

1. **Rota Minério**: Refere-se às turmas base de minério (Turmas A, B, C, D).
2. **Rota Carga Geral**: Refere-se às turmas base de carga geral (Turmas A CG, B CG, C CG, D CG).
3. **Rota CCP Minério**: Refere-se à área da CCP exclusiva para minério (Turmas A CCP Minério, B CCP Minério...).
4. **Rota CCP Carga Geral**: Refere-se à área da CCP exclusiva para carga geral (Turmas A CCP Carga Geral, B CCP Carga Geral...).

Sempre use "CCP" no nome se estiver lidando com as turmas/rotas da CCP, e omita o "CCP" se estiver lidando com as rotas convencionais. O termo "Minério" isolado NUNCA deve ser usado para se referir a "CCP Minério".
</RULE[domain_terminology]>

<RULE[layout_no_vertical_scroll_on_home]>
## Restrição de Rolagem Vertical nas Telas Iniciais

ATENÇÃO: O usuário NÃO DESEJA barras de rolagem vertical (`overflow-y-auto` ou `scroll`) nas telas iniciais de seleção (ex: Turma, Layout, Tema).

- Essas telas devem sempre manter `h-[100dvh]` e `overflow-hidden`.
- Se o conteúdo (como rodapés, botões ou textos) estiver sendo cortado em resoluções específicas (overflow oculto), você NÃO DEVE resolver o problema adicionando rolagem vertical.
- Para corrigir qualquer corte de layout, você deve ajustar paddings, margens (ex: reduzir `pb` ou `mt`), gap, ou usar escala/tamanhos dinâmicos nos elementos internos, garantindo que tudo caiba na viewport fixa sem gerar rolagem.
</RULE[layout_no_vertical_scroll_on_home]>

<RULE[adhd_communication_style]>
## Estilo de Comunicação e Foco Cognitivo (I HAVE ADHD)

ATENÇÃO: O usuário possui TDAH (ADHD) e necessita de interações diretas, limpas e de baixa carga cognitiva. Este estilo é **permanente e obrigatório** em todas as respostas:

1. **Ação ou Resposta em Primeiro Lugar:** Comece sempre pela resposta direta, código ou comando. Nunca enterre o que importa sob introduções.
2. **Zero Enrolação (No Fluff):** Elimine preâmbulos vazios (*"Com certeza!"*, *"Ótima pergunta!"*, *"Entendido, farei agora..."*).
3. **Limite Cognitivo (Máximo 5 itens):** Listas, tópicos ou checklists nunca devem passar de 5 itens por mensagem para não sobrecarregar. Se houver mais, divida em fases.
4. **Visibilidade do Progresso:** Indique com clareza o estado atual do trabalho (ex.: `[Passo 2 de 3 concluído]`).
5. **Um Único Próximo Passo:** Toda resposta deve terminar com uma única ação imediata e clara a seguir, sem dispersar em múltiplos caminhos ao mesmo tempo.
6. **Alta Escaneabilidade:** Use negrito estratégico nos pontos-chave e tabelas ou tópicos curtos em vez de parágrafos densos de texto.
7. **Detalhes Longos em Artefatos:** Deixe explicações extensas nos arquivos (`.md` de plano ou walkthrough) e mantenha a mensagem do chat compacta, acionável e focada.
8. **Decisões Simples:** Quando solicitar aprovação ou escolha, forneça no máximo 2 a 3 alternativas bem delimitadas.
</RULE[adhd_communication_style]>