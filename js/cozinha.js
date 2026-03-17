/* =============================================================
   SISTEMA KDS ABSOLUTO - COZINHA (ATUALIZAÇÃO INSTANTÂNEA E AUTO-REFRESH)
   ============================================================= */

let PEDIDOS_ATIVOS = [];
let somHabilitado = false;

// Variáveis de controle de temporizadores (Novidade)
let intervaloSomPendente = null; 
let intervaloAutoRefresh = null;

window.addEventListener('click', function(e) {
    if (e.target.id === 'modal-alerta') window.fecharAlerta();
    if (e.target.id === 'modal-confirmacao') {
        const btnNao = document.getElementById('btn-confirm-nao');
        if (btnNao) btnNao.click();
    }
});

window.atualizarBotaoTema = function() {
    const isDark = document.documentElement.classList.contains('dark');
    const icone = document.getElementById('icone-tema');
    const texto = document.getElementById('texto-tema');
    if (icone && texto) {
        if (isDark) {
            icone.className = 'ph-bold ph-sun text-xl text-yellow-500';
            texto.innerHTML = 'Modo<br>Claro';
        } else {
            icone.className = 'ph-bold ph-moon text-xl text-indigo-500';
            texto.innerHTML = 'Modo<br>Escuro';
        }
    }
}

window.toggleTema = function() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) { html.classList.remove('dark'); localStorage.setItem('temaCozinha', 'light'); } 
    else { html.classList.add('dark'); localStorage.setItem('temaCozinha', 'dark'); }
    window.atualizarBotaoTema();
}

window.sysAlert = function(titulo, texto, tipo = 'info', botoesArr = null) {
    const modal = document.getElementById('modal-alerta');
    const box = document.getElementById('modal-alerta-box');
    const icone = document.getElementById('alerta-icone');
    const containerBotoes = document.getElementById('alerta-botoes');
    
    if (!modal) return alert(titulo + ": " + texto);

    const txtTitulo = document.getElementById('alerta-titulo');
    const txtTexto = document.getElementById('alerta-texto');
    if(txtTitulo) txtTitulo.innerText = titulo;
    if(txtTexto) txtTexto.innerText = texto;
    
    if(tipo === 'erro') {
        icone.className = "w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner border border-red-200 dark:border-red-500/50";
        icone.innerHTML = "⚠️";
        if (!botoesArr) containerBotoes.innerHTML = `<button onclick="window.fecharAlerta()" class="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white py-4 rounded-xl font-black uppercase text-xs active:bg-slate-200 dark:active:bg-slate-600 transition-colors">Fechar</button>`;
    } else if (tipo === 'sucesso') {
        icone.className = "w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner border border-emerald-200 dark:border-emerald-500/50";
        icone.innerHTML = "✅";
        if (!botoesArr) containerBotoes.innerHTML = `<button onclick="window.fecharAlerta()" class="w-full bg-emerald-500 dark:bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 active:scale-95 transition-all">OK</button>`;
    } else {
        icone.className = "w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner border border-blue-200 dark:border-blue-500/50";
        icone.innerHTML = "ℹ️";
        if (!botoesArr) containerBotoes.innerHTML = `<button onclick="window.fecharAlerta()" class="w-full bg-blue-500 dark:bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-200 dark:shadow-blue-900/50 active:scale-95 transition-all">Entendi</button>`;
    }

    if (botoesArr) { containerBotoes.innerHTML = botoesArr.map(b => `<button onclick="event.stopPropagation(); ${b.onclick}" class="w-full ${b.class} py-4 rounded-xl font-black uppercase text-[10px] transition-all active:scale-95 italic tracking-widest">${b.label}</button>`).join(''); }

    modal.classList.remove('hidden'); modal.style.display = 'flex'; modal.style.opacity = '1'; modal.style.zIndex = '99999'; box.classList.remove('scale-95');
}

window.fecharAlerta = function() {
    const modal = document.getElementById('modal-alerta'), box = document.getElementById('modal-alerta-box');
    if(modal) { modal.style.opacity = '0'; box.classList.add('scale-95'); setTimeout(() => { modal.classList.add('hidden'); modal.style.display = 'none'; }, 200); }
}

window.sysConfirm = function(titulo, texto) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmacao'), box = document.getElementById('modal-confirmacao-box');
        if(!modal) return resolve(confirm(titulo + "\n" + texto));

        const txtTitulo = document.getElementById('confirm-titulo'), txtTexto = document.getElementById('confirm-texto');
        if(txtTitulo) txtTitulo.innerText = titulo;
        if(txtTexto) txtTexto.innerText = texto;
        
        modal.classList.remove('hidden'); modal.style.display = 'flex'; modal.style.opacity = '1'; modal.style.zIndex = '99998'; box.classList.remove('scale-95');

        const fechar = (resultado) => { modal.style.opacity = '0'; box.classList.add('scale-95'); setTimeout(() => { modal.classList.add('hidden'); modal.style.display = 'none'; resolve(resultado); }, 200); };
        document.getElementById('btn-confirm-sim').onclick = () => fechar(true); document.getElementById('btn-confirm-nao').onclick = () => fechar(false);
    });
}

window.fazerLogout = async function() { 
    if(await window.sysConfirm('Sair', 'Deseja encerrar o monitor da cozinha?')) { 
        localStorage.removeItem('usuarioLogado'); 
        window.location.href = 'login.html'; 
    } 
}


window.habilitarSom = function() {
    const audio = document.getElementById('som-notificacao');
    if (!audio) return;
    audio.play().then(() => {
        audio.pause(); audio.currentTime = 0; somHabilitado = true;
        document.getElementById('icone-som').className = 'ph-bold ph-speaker-high text-xl text-emerald-500';
        document.getElementById('texto-som').innerHTML = 'Som<br>Ativo';
        const btn = document.getElementById('btn-som');
        btn.classList.replace('border-slate-200', 'border-emerald-200'); btn.classList.replace('dark:border-slate-600', 'dark:border-emerald-500/50');
        btn.classList.replace('bg-slate-100', 'bg-emerald-50'); btn.classList.replace('dark:bg-slate-700', 'dark:bg-slate-800');
        window.sysAlert('Áudio Ativado', 'A campainha vai tocar toda vez que um pedido novo chegar.', 'sucesso');
        window.verificarLoopSom(); 
    }).catch(err => { window.sysAlert('Atenção', 'Não foi possível ativar o som. Clique novamente.', 'erro'); });
}

window.tocarAlerta = function() {
    if (!somHabilitado) return;
    const audio = document.getElementById('som-notificacao');
    if (audio) { audio.currentTime = 0; audio.play().catch(e => console.log("Áudio bloqueado.")); }
}

// -------------------------------------------------------------
// FUNÇÕES DE LOOP DE SOM E AUTO-REFRESH
// -------------------------------------------------------------

window.verificarLoopSom = function() {
    if (!somHabilitado) return;
    const temPendente = PEDIDOS_ATIVOS.some(p => p.status === 'Pendente');
    
    if (temPendente) {
        if (!intervaloSomPendente) {
            window.tocarAlerta(); 
            intervaloSomPendente = setInterval(() => {
                window.tocarAlerta(); 
            }, 10000);
        }
    } else {
        if (intervaloSomPendente) {
            clearInterval(intervaloSomPendente);
            intervaloSomPendente = null;
        }
    }
}

window.toggleAutoRefresh = function() {
    const toggle = document.getElementById('toggle-auto-refresh');
    if (toggle.checked) {
        localStorage.setItem('autoRefreshCozinha', 'true');
        window.iniciarAutoRefresh(); 
    } else {
        localStorage.setItem('autoRefreshCozinha', 'false');
        if (intervaloAutoRefresh) clearInterval(intervaloAutoRefresh);
    }
}

window.iniciarAutoRefresh = function() {
    const isAtivo = localStorage.getItem('autoRefreshCozinha') === 'true';
    const toggle = document.getElementById('toggle-auto-refresh');
    if(toggle) toggle.checked = isAtivo;

    if (isAtivo) {
        if (intervaloAutoRefresh) clearInterval(intervaloAutoRefresh);
        intervaloAutoRefresh = setInterval(() => {
            window.carregarPedidosIniciais(); 
        }, 30000); 
    }
}

// -------------------------------------------------------------

window.onload = async () => { 
    window.atualizarBotaoTema(); 
    window.iniciarAutoRefresh(); 
    await window.carregarPedidosIniciais(); 
    window.escutarNovosPedidos(); 
};

window.carregarPedidosIniciais = async function() {
    const { data } = await _supabase.from('pedidos').select('*').neq('status', 'Entregue').neq('status', 'Cancelado').order('created_at', { ascending: true });
    if (data) { PEDIDOS_ATIVOS = data; window.renderizarMonitor(); window.verificarLoopSom(); }
}

window.escutarNovosPedidos = function() {
    _supabase.channel('cozinha-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
        if (payload.eventType === 'INSERT') {
            PEDIDOS_ATIVOS.push(payload.new); window.tocarAlerta(); window.renderizarMonitor(); window.verificarLoopSom();
        } else if (payload.eventType === 'UPDATE') {
            const index = PEDIDOS_ATIVOS.findIndex(p => p.id === payload.new.id);
            if (payload.new.status === 'Entregue' || payload.new.status === 'Cancelado') {
                if (index > -1) PEDIDOS_ATIVOS.splice(index, 1);
            } else {
                if (index > -1) PEDIDOS_ATIVOS[index] = payload.new; else PEDIDOS_ATIVOS.push(payload.new);
            }
            window.renderizarMonitor();
            window.verificarLoopSom();
        }
    }).subscribe();
}

window.renderizarMonitor = function() {
    const monitor = document.getElementById('monitor-pedidos');
    const contador = document.getElementById('contador-pedidos');
    if(contador) contador.innerText = PEDIDOS_ATIVOS.length;

    if (PEDIDOS_ATIVOS.length === 0) {
        monitor.innerHTML = `<div class="col-span-full py-32 text-center opacity-50"><div class="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-600 transition-colors"><i class="ph-bold ph-cooking-pot text-5xl"></i></div><h3 class="text-slate-700 dark:text-white font-black text-xl uppercase tracking-widest transition-colors">Tudo limpo por aqui!</h3><p class="text-slate-500 text-xs font-bold uppercase mt-2">Aguardando novos pedidos...</p></div>`;
        return;
    }

    monitor.innerHTML = PEDIDOS_ATIVOS.map(p => {
        const hora = new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        let statusClass = p.status === 'Em Preparo' ? 'status-preparo' : (p.status === 'Em Rota' ? 'status-rota' : 'status-pendente');
        const seloNovo = p.status === 'Pendente' ? `<div class="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full border-4 border-white dark:border-slate-800 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)] z-10 tracking-widest uppercase transition-colors">Novo!</div>` : '';
        
        let badgeColor = '';
        if(p.status === 'Pendente') badgeColor = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
        else if(p.status === 'Em Preparo') badgeColor = 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
        else if(p.status === 'Em Rota') badgeColor = 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';

        const listaItens = p.itens.map(item => `
            <div class="py-2 border-b border-slate-200 dark:border-slate-700/50 last:border-0 transition-colors">
                <div class="flex items-start gap-3">
                    <span class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white text-[10px] font-black px-2 py-1 rounded w-6 text-center transition-colors">${item.qtd}</span>
                    <div class="flex-1">
                        <p class="text-slate-700 dark:text-slate-200 text-sm font-black uppercase leading-tight transition-colors">${item.nome}</p>
                        ${item.detalhes ? `<p class="text-[10px] text-red-500 dark:text-red-400 font-bold mt-1 italic bg-red-50 dark:bg-red-900/20 p-1.5 rounded inline-block transition-colors">⚠️ ${item.detalhes}</p>` : ''}
                    </div>
                </div>
            </div>`).join('');

        let botoesAcaoHtml = '';
        if (p.status === 'Pendente') {
            botoesAcaoHtml = `
            <div class="grid grid-cols-2 gap-3 mt-2">
                <button onclick="window.abrirPreviaPedido(${p.id})" class="w-full bg-blue-50 text-blue-500 border border-blue-200 py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-sm hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-500/50 dark:hover:bg-blue-900/50">👁️ VER PEDIDO</button>
                <button onclick="window.atualizarStatus(${p.id}, 'Cancelado')" class="w-full bg-red-50 text-red-500 border border-red-200 py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-sm hover:bg-red-100 dark:bg-red-900/30 dark:border-red-500/50 dark:hover:bg-red-900/50">✕ RECUSAR</button>
            </div>`;
        } else if (p.status === 'Em Preparo') {
            botoesAcaoHtml = `
            <div class="mt-2">
                <button onclick="window.atualizarStatus(${p.id}, 'Em Rota')" class="w-full bg-blue-50 text-blue-500 border border-blue-200 py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-sm hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-500/50 dark:hover:bg-blue-900/50">🛵 ENTREGAR</button>
            </div>`;
        } else if (p.status === 'Em Rota') {
            botoesAcaoHtml = `
            <div class="mt-2">
                <button onclick="window.atualizarStatus(${p.id}, 'Entregue')" class="w-full bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-md hover:bg-emerald-600">✓ FINALIZAR</button>
            </div>`;
        }

        return `
            <div class="card-pedido bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-between h-full relative transition-colors duration-300 ${statusClass}">
                ${seloNovo}
                <div class="flex justify-between items-start mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 transition-colors">
                    <div class="flex-1 min-w-0 pr-2">
                        <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Pedido #${p.id}</span>
                        <h3 class="text-slate-800 dark:text-white font-black text-lg uppercase italic truncate transition-colors" title="${p.cliente_nome}">${p.cliente_nome}</h3>
                    </div>
                    <div class="flex flex-col items-end gap-2 shrink-0">
                        <span class="text-slate-500 dark:text-slate-400 font-bold text-xs transition-colors">${hora}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[8px] font-black uppercase px-2 py-1 rounded-md ${badgeColor} transition-colors tracking-widest">${p.status}</span>
                            <button onclick="window.imprimirPedido(${p.id})" class="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-sm active:scale-95 border border-slate-200 dark:border-slate-600" title="Imprimir Comanda"><i class="ph-bold ph-printer text-xl"></i></button>
                        </div>
                    </div>
                </div>
                <div class="space-y-1 mb-4 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-2xl max-h-48 overflow-y-auto custom-scrollbar transition-colors">${listaItens}</div>
                <div class="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700 transition-colors">
                    <p class="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1 text-center transition-colors">AÇÕES:</p>
                    ${botoesAcaoHtml}
                </div>
            </div>`;
    }).join('');
}

window.formatarTelTicket = function(tel) {
    if (!tel) return 'Não informado';
    let t = tel.replace(/\D/g, '');
    if (t.startsWith('55') && t.length >= 12) t = t.slice(2);
    if (t.length === 11) return `(${t.slice(0,2)}) ${t.slice(2,3)} ${t.slice(3,7)}-${t.slice(7)}`;
    else if (t.length === 10) return `(${t.slice(0,2)}) ${t.slice(2,6)}-${t.slice(6)}`;
    return tel;
}

window.imprimirPedido = function(id) {
    const p = PEDIDOS_ATIVOS.find(x => x.id === id);
    if (!p) return;

    const config = JSON.parse(localStorage.getItem('ticketConfig')) || { width: '58mm', footer: 'Obrigado pela preferência!' };
    const maxLargura = config.width === '80mm' ? '300px' : '220px';
    const fontSize = config.width === '80mm' ? '14px' : '12px';

    let enderecoLimpo = (p.endereco || '-').split(' | ')[0];
    let formaPgto = p.forma_pagamento || p.pagamento || '-';

    const itensHtml = p.itens.map(i => {
        let extras = "";
        if (i.removidos && i.removidos.length > 0) extras += ` [!] SEM: ${i.removidos.join(', ')}`;
        if (i.adicionais && i.adicionais.length > 0) extras += ` [+] ADD: ${i.adicionais.map(a => a.nome).join(', ')}`;
        if (i.sabor) extras += ` [>] SABOR: ${i.sabor}`;
        if (!extras && i.detalhes) extras = ` OBS: ${i.detalhes}`;

        return `
            <div style="margin-bottom: 4px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; font-weight: 900;">
                    <span style="font-size: 1.1em;">${i.qtd}x ${i.nome.toUpperCase()}</span>
                    <span>R$ ${(i.preco * i.qtd).toFixed(2)}</span>
                </div>
                ${extras ? `<div style="font-size: 10px; margin-top: 2px; font-weight: 900;">${extras.toUpperCase()}</div>` : ''}
            </div>
        `;
    }).join('');

    // Prepara o visual da taxa de entrega, caso exista
    let taxaEntregaHtml = '';
    if (p.taxa_entrega && parseFloat(p.taxa_entrega) > 0) {
        taxaEntregaHtml = `
            <div style="display: flex; justify-content: space-between; font-size: 1.1em; font-weight: 900; margin-top: 5px;">
                <span>TAXA ENTREGA:</span>
                <span>R$ ${parseFloat(p.taxa_entrega).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }

    const html = `
    <html>
    <head>
        <title>Pedido #${p.id}</title>
        <style>
            @page { margin: 0; }
            body { 
                font-family: monospace; 
                width: ${maxLargura}; 
                margin: 0; 
                padding: 10px; 
                color: #000; 
                font-size: ${fontSize}; 
                font-weight: bold; 
                line-height: 1.3;
            }
            .text-center { text-align: center; }
            .hr { border-bottom: 1px dashed #000; margin: 8px 0; }
        </style>
    </head>
    <body>
        <h2 class="text-center" style="margin: 0; font-size: 18px;">MY-DELIVERY</h2>
        <div class="text-center" style="font-size: 16px; font-weight: 900;">PEDIDO #${p.id}</div>
        
        <div class="hr"></div>

        <div style="margin-bottom: 8px;">
            <strong>HORA:</strong> ${new Date(p.created_at).toLocaleString('pt-BR')}<br>
            <strong>CLIENTE:</strong> ${p.cliente_nome.toUpperCase()}<br>
            <strong>TELEFONE:</strong> ${window.formatarTelTicket ? window.formatarTelTicket(p.cliente_tel) : p.cliente_tel}<br>
            <strong>ENDEREÇO:</strong> ${enderecoLimpo.toUpperCase()}<br>
            <strong>PAGAMENTO:</strong> ${formaPgto.toUpperCase()}<br>
            <strong>REFERÊNCIA:</strong> ${(p.referencia || p.ponto_referencia || '-').toUpperCase()}
        </div>

        <div class="hr"></div>
        <div style="margin-bottom: 5px; font-weight: 900;">ITENS DO PEDIDO:</div>
        ${itensHtml}

        <div style="margin-top: 10px;">
            ${taxaEntregaHtml}
            <div style="display: flex; justify-content: space-between; font-size: 1.3em; font-weight: 900; border-top: 1.5px solid #000; padding-top: 5px;">
                <span>TOTAL:</span>
                <span>R$ ${parseFloat(p.total).toFixed(2).replace('.', ',')}</span>
            </div>
        </div>

        <div class="hr"></div>
        
        <div class="text-center" style="font-size: 10px; margin-top: 15px;">
            ${config.footer.toUpperCase()}
        </div>

        <script>
            window.onload = function() { 
                window.print(); 
                setTimeout(function(){ window.close(); }, 500); 
            }
        <\/script>
    </body>
    </html>`;

    const win = window.open('', '_blank', `width=450,height=700`);
    win.document.write(html);
    win.document.close();
}

window.atualizarStatus = async function(id, novoStatus) {
    if(novoStatus === 'Cancelado') {
        const resp = await window.sysConfirm('Recusar Pedido', 'Tem certeza que deseja recusar este pedido? O cliente será notificado.');
        if(!resp) return;
    }
    
    const index = PEDIDOS_ATIVOS.findIndex(p => p.id === id);
    let pedidoParaNotificar = null;

    if (index > -1) {
        pedidoParaNotificar = { ...PEDIDOS_ATIVOS[index] }; 

        if (novoStatus === 'Entregue' || novoStatus === 'Cancelado') {
            PEDIDOS_ATIVOS.splice(index, 1);
        } else {
            PEDIDOS_ATIVOS[index].status = novoStatus;
        }
        window.renderizarMonitor();
        window.verificarLoopSom();
    }

    const dadosUpdate = { status: novoStatus };

    if (novoStatus === 'Entregue') {
        dadosUpdate.concluido_at = new Date().toISOString();
    }

    const { error } = await _supabase.from('pedidos').update(dadosUpdate).eq('id', id);

    if (error) {
        window.sysAlert("Erro", "Falha de conexão. O status voltará ao normal.", "erro");
        await window.carregarPedidosIniciais(); 
        return;
    }

    if (pedidoParaNotificar && pedidoParaNotificar.cliente_tel) {
        window.dispararNotificacaoWhatsApp(pedidoParaNotificar, novoStatus);
    }
}

window.dispararNotificacaoWhatsApp = function(pedido, status) {
    if(!pedido.cliente_nome) return;
    let mensagem = ""; const primeiroNome = pedido.cliente_nome.split(' ')[0];
    if (status === 'Em Preparo') mensagem = `Olá *${primeiroNome}*! 🍔\nSeu pedido *#${pedido.id}* foi *aceito* e já está na cozinha.\n\n📍 *Entrega em:* ${pedido.endereco}`;
    else if (status === 'Em Rota') mensagem = `Boas notícias, *${primeiroNome}*! 🛵\nSeu pedido *#${pedido.id}* saiu para entrega. Fique atento!`;
    else if (status === 'Entregue') mensagem = `Oba, *${primeiroNome}*! 🎉\nO pedido *#${pedido.id}* foi entregue. Agradecemos a preferência!`;
    else if (status === 'Cancelado') mensagem = `Olá *${primeiroNome}*. Infelizmente não conseguiremos atender seu pedido *#${pedido.id}* no momento. Foi cancelado.`;
    if (mensagem) window.enviarWhatsAppAPI(pedido.cliente_tel, mensagem);
}

window.enviarWhatsAppAPI = async function(telefone, mensagem) {
    let telFormatado = telefone.replace(/\D/g, '');
    if (!telFormatado.startsWith('55')) telFormatado = '55' + telFormatado;
    console.log(`Disparando WA para: ${telFormatado}\nMsg: ${mensagem}`);
}

window.abrirPreviaPedido = function(id) {
    const p = PEDIDOS_ATIVOS.find(x => x.id === id);
    if (!p) return;

    // Atualiza cabeçalho do modal
    const elId = document.getElementById('previa-id');
    if (elId) elId.innerText = `PEDIDO #${p.id}`;

    // Atualiza informações do cliente (nome e endereço) no modal
    const elClienteNome = document.getElementById('previa-cliente-nome');
    if (elClienteNome) elClienteNome.innerText = p.cliente_nome;
    
    const elEndereco = document.getElementById('previa-endereco');
    if (elEndereco) elEndereco.innerText = p.endereco;
    
    // Lista os itens no modal
    const elListaItens = document.getElementById('previa-lista-itens');
    if (elListaItens) {
        elListaItens.innerHTML = p.itens.map(i => `
            <div class="flex justify-between items-start border-b border-slate-50 dark:border-slate-700/50 pb-3 transition-colors">
                <div>
                    <p class="text-xs font-black uppercase text-slate-700 dark:text-slate-200 transition-colors">${i.qtd}x ${i.nome}</p>
                    <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase transition-colors">${i.detalhes || 'Sem observações'}</p>
                </div>
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500 italic transition-colors">R$ ${(i.preco * i.qtd).toFixed(2)}</span>
            </div>
        `).join('');
    }

    // Preenche os valores financeiros
    const subtotal = p.total - (p.taxa_entrega || 0);
    const elSubtotal = document.getElementById('previa-subtotal');
    if (elSubtotal) elSubtotal.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    
    const elTaxa = document.getElementById('previa-taxa');
    if (elTaxa) elTaxa.innerText = `R$ ${(p.taxa_entrega || 0).toFixed(2).replace('.', ',')}`;
    
    const elTotal = document.getElementById('previa-total');
    if (elTotal) elTotal.innerText = `R$ ${p.total.toFixed(2).replace('.', ',')}`;

    // Ação do botão "Aceitar"
    const btnAceitar = document.getElementById('btn-confirmar-preparo');
    if (btnAceitar) {
        btnAceitar.onclick = async () => {
            await window.atualizarStatus(p.id, 'Em Preparo');
            window.fecharPrevia();
        };
    }

    // Abre o Modal
    const modal = document.getElementById('modal-previa-pedido');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.fecharPrevia = () => {
    const modal = document.getElementById('modal-previa-pedido');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Faltava essa linha para o modal sumir de verdade!
    }
}