MY-DELIVERY SYSTEM
Sistema de Gestão de Vendas e Entregas em Tempo Real
O My-Delivery é uma plataforma completa desenvolvida para facilitar o fluxo de pedidos entre clientes e estabelecimentos, unindo uma interface de compra intuitiva com um painel administrativo robusto e seguro.

🚀 FUNCIONALIDADES
1. Módulo do Cliente (Front-end)
Cardápio interativo com suporte a sabores, ingredientes removíveis e adicionais pagos.

Sistema de carrinho de compras dinâmico.

Acompanhamento de pedido em tempo real via Barra de Progresso (Pendente -> Preparo -> Entrega -> Entregue).

PWA (Progressive Web App): Instalável em dispositivos Android e iOS.

2. Painel da Cozinha (Operacional)
Gestão centralizada de pedidos ativos.

Impressão térmica otimizada para bobinas de 58mm e 80mm.

Layout de ticket limpo com fontes de alta visibilidade e abreviações operacionais.

3. Painel Administrativo (Gestão)
Dashboard Financeiro: Gráficos de faturamento semanal via Chart.js.

Gestão de Produtos: Cadastro, edição e controle de estoque visual.

Gestão de Usuários: Controle de acesso para administradores e colaboradores com status Ativo/Inativo.

Sistema de Auditoria: Logs detalhados de todas as ações críticas para segurança do negócio.

Backup: Ferramentas de exportação e importação da base de dados via JSON.

🛠️ TECNOLOGIAS UTILIZADAS
Linguagem: JavaScript (Vanilla JS).

Estilização: Tailwind CSS (via CDN).

Banco de Dados: Supabase (PostgreSQL) com Realtime Engine.

Gráficos: Chart.js.

Ícones: Phosphor Icons.

Hospedagem: Netlify.

📂 ESTRUTURA DO BANCO DE DADOS (SUPABASE)
O sistema opera com as seguintes tabelas principais:

pedidos: Armazena os dados da venda, itens, total, forma_pagamento e referência.

produtos: Itens do cardápio e configurações de preço.

usuarios: Credenciais de acesso e níveis de permissão (admin/funcionario).

auditoria: Registro cronológico de atividades administrativas.

ingredientes_lista / adicionais_lista / sabores_lista: Gestão global de insumos.

configuracoes: Parâmetros do sistema (ex: loja aberta/fechada).

🔧 COMO CONFIGURAR
Clone o repositório para sua máquina local.

Crie um projeto no Supabase e execute os comandos SQL presentes na pasta /sql para criar a estrutura das tabelas.

Insira suas credenciais (URL e Anon Key) no arquivo js/supabase-config.js.

Abra o arquivo index.html em um servidor local (ex: Live Server do VS Code).

Para publicar, suba os arquivos no Netlify e configure o deploy contínuo via GitHub.

👤 AUTOR
Desenvolvido por Cleicimar da Silva Vaz
Estudante de Análise e Desenvolvimento de Sistemas.