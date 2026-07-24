<RULE[project_infrastructure]>
## Infraestrutura de Agendamento

ATENÇÃO: O projeto NÃO utiliza mais o GitHub Actions para tarefas agendadas.
O acionamento automático de rotinas (como envios de relatórios e afins) agora é feito exclusivamente via CRONJOB externo/local. 

- Ao diagnosticar ou projetar novas funcionalidades de automação, não assuma que os arquivos `.github/workflows/*.yml` são os motores ativos de agendamento.
- Sempre leve em consideração que as execuções dependem de um Cronjob.
</RULE[project_infrastructure]>
