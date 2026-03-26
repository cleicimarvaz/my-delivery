/**
 * SISTEMA CLIENTE ABSOLUTO - MY-DELIVERY
 * VERSÃO FINAL COM TAXAS DE ENTREGA DINÂMICAS E NOME RESPONSIVO
 */

// =============================================================
// MÓDULO 0: ESTADO GLOBAL DO SISTEMA
// =============================================================
let PRODUTOS = [];
let CARRINHO = [];
let ATUAL = null; 
let QTD = 1;
let ADICIONAIS_SELECIONADOS = [];
let PRECO_BASE_ATUAL = 0;
let SABORES_GLOBAIS = [];
let SABOR_SELECIONADO = null;
let TAXAS_GLOBAIS = []; // Guarda as taxas vindas do banco de dados

let CLIENTE_LOGADO = null;
let TELEFONE_TEMP = "";
let LOJA_ABERTA = true;
let ACAO_POS_LOGIN = null;

let TIMELINE_NOTIFICACOES = [];
let MEUS_PEDIDOS_IDS = []; 
let HISTORICO_PEDIDOS_CLIENTE = [];
let FILTRO_HISTORICO_ATUAL = 'andamento';

// =============================================================
// MÓDULO 1: UTILITÁRIOS E MODAIS
// =============================================================
window.mascaraTelefone = function(i) {
    let v = i.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    else if (v.length > 5) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (v.length > 0) v = v.replace(/^(\d*)/, "($1");
    i.value = v;
}

window.fecharAlerta = function() {
    const modal = document.getElementById('modal-alerta');
    if(modal) { 
        modal.style.opacity = '0'; 
        setTimeout(() => { 
            modal.classList.add('hidden'); 
            modal.style.setProperty('display', 'none', 'important'); 
        }, 200); 
    }
}

window.fecharTodosModais = function() {
    const modaisId = ['modal-auth', 'modal-perfil', 'modal-detalhes', 'modal-carrinho', 'modal-pedidos-hist', 'modal-pedido-sucesso', 'modal-pedido-historico', 'modal-alterar-pin'];
    modaisId.forEach(id => {
        const m = document.getElementById(id);
        if (m) { m.classList.add('hidden'); m.style.setProperty('display', 'none', 'important'); }
    });
}

window.addEventListener('click', function(event) {
    const id = event.target.id;
    if (id === 'modal-auth') window.fecharAuth();
    if (id === 'modal-perfil') window.fecharPerfil();
    if (id === 'modal-carrinho') window.fecharCarrinho();
    if (id === 'modal-pedidos-hist') window.fecharMeusPedidos();
    if (id === 'modal-detalhes') window.fecharDetalhes();
    if (id === 'modal-pedido-sucesso') window.fecharModalSucesso();
    if (id === 'modal-pedido-historico') window.fecharHistoricoPedido();
    if (id === 'modal-alterar-pin') window.fecharModalPin();
    if (id === 'modal-alerta') window.fecharAlerta();
});

// =============================================================
// MÓDULO 2: SISTEMA DE ALERTAS
// =============================================================
window.sysAlert = function(titulo, texto, tipo = 'info', botoesArr = null) {
    const modal = document.getElementById('modal-alerta');
    const icone = document.getElementById('alerta-icone');
    const containerBotoes = document.getElementById('alerta-botoes');
    const txtTitulo = document.getElementById('alerta-titulo');
    const txtTexto = document.getElementById('alerta-texto');
    
    if (!modal || !txtTitulo || !txtTexto) { alert(titulo + "\n" + texto); return; }
    
    txtTitulo.innerText = titulo;
    txtTexto.innerText = texto;
    
    if (tipo === 'erro') {
        if(icone) { icone.innerHTML = '<i class="ph-bold ph-x"></i>'; icone.className = "w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2 text-3xl shadow-inner border-4 border-red-50"; }
        if (!botoesArr && containerBotoes) containerBotoes.innerHTML = `<button onclick="event.stopPropagation(); window.fecharAlerta();" class="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all italic tracking-widest">ENTENDI!</button>`;
    } else if (tipo === 'sucesso') {
        if(icone) { icone.innerHTML = '<i class="ph-bold ph-check"></i>'; icone.className = "w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2 text-3xl shadow-inner border-4 border-emerald-50"; }
        if (!botoesArr && containerBotoes) containerBotoes.innerHTML = `<button onclick="event.stopPropagation(); window.fecharAlerta();" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all italic tracking-widest">MARAVILHA!</button>`;
    } else {
        if(icone) { icone.innerHTML = '<i class="ph-bold ph-info"></i>'; icone.className = "w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-2 text-3xl shadow-inner border-4 border-blue-50"; }
        if (!botoesArr && containerBotoes) containerBotoes.innerHTML = `<button onclick="event.stopPropagation(); window.fecharAlerta();" class="w-full bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all italic tracking-widest">OK, CONTINUAR</button>`;
    }

    if (botoesArr && containerBotoes) {
        containerBotoes.innerHTML = botoesArr.map(botao => {
            return `<button onclick="event.stopPropagation(); ${botao.onclick}" class="w-full ${botao.class} py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 tracking-widest italic">${botao.label}</button>`;
        }).join('');
    }

    modal.classList.remove('hidden'); 
    modal.style.setProperty('display', 'flex', 'important'); 
    setTimeout(() => { modal.style.opacity = '1'; }, 10);
}

// =============================================================
// MÓDULO 3: SESSÃO E LOGIN
// =============================================================
window.onload = async () => { 
    window.verificarSessao();
    await window.carregarDados(); 
};

window.verificarSessao = function() {
    const dadosSessao = localStorage.getItem('sessaoCliente');
    if (dadosSessao) {
        CLIENTE_LOGADO = JSON.parse(dadosSessao);
        const saudacao = document.getElementById('saudacao-cliente');
        if(saudacao) saudacao.innerText = `OI, ${CLIENTE_LOGADO.nome.split(' ')[0].toUpperCase()}! 🍔`;
        window.atualizarResumoEndereco();
        window.carregarMeusPedidosIds(); 
        window.verificarPedidosAtivos();
        TIMELINE_NOTIFICACOES = JSON.parse(localStorage.getItem('timeline_notificacoes')) || [];
        window.atualizarBadgePerfil();
    }
}

window.carregarMeusPedidosIds = async function() {
    if (!CLIENTE_LOGADO) return;
    const { data } = await _supabase.from('pedidos').select('id').eq('cliente_tel', CLIENTE_LOGADO.telefone);
    if (data) MEUS_PEDIDOS_IDS = data.map(p => p.id);
}

window.atualizarResumoEndereco = function() {
    if (CLIENTE_LOGADO) {
        const txtNome = document.getElementById('resumo-end-nome');
        const txtRua = document.getElementById('resumo-end-rua');
        if (txtNome) txtNome.innerText = CLIENTE_LOGADO.nome;
        if (CLIENTE_LOGADO.rua && CLIENTE_LOGADO.num && CLIENTE_LOGADO.cidade) { 
            if (txtRua) {
                txtRua.innerText = `${CLIENTE_LOGADO.rua}, ${CLIENTE_LOGADO.num} - ${CLIENTE_LOGADO.cidade}`;
                txtRua.className = "text-[10px] font-bold text-emerald-600 truncate mt-0.5 italic leading-tight";
            } 
        } else { 
            if (txtRua) {
                txtRua.innerText = "Endereço incompleto (Clique no lápis)";
                txtRua.className = "text-[10px] font-bold text-red-400 mt-0.5 italic";
            } 
        }
    }
    if(typeof window.validarCheckout === 'function') window.validarCheckout();
}

window.verificarPedidosAtivos = async function() {
    if (!CLIENTE_LOGADO) return;
    const { data } = await _supabase.from('pedidos').select('status').eq('cliente_tel', CLIENTE_LOGADO.telefone).in('status', ['Pendente', 'Em Preparo', 'Em Rota']);
    const badge = document.getElementById('badge-pedidos');
    if (badge) {
        if (data && data.length > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

window.atualizarBadgePerfil = function() {
    const naoLidas = TIMELINE_NOTIFICACOES.filter(t => !t.lida).length;
    const badge = document.getElementById('badge-perfil');
    if (badge) {
        if (naoLidas > 0) { badge.classList.remove('hidden'); badge.innerText = naoLidas; } 
        else badge.classList.add('hidden');
    }
}

window.verificarTelefone = async function() {
    const tel = document.getElementById('auth-telefone').value.replace(/\D/g, '');
    if (tel.length < 10) return window.sysAlert("Número Inválido", "Informe o celular com DDD.", "erro");
    TELEFONE_TEMP = tel;
    const { data } = await _supabase.from('clientes').select('*').eq('telefone', tel).single();
    document.getElementById('auth-step-1').classList.add('hidden');
    if (data) document.getElementById('auth-step-login').classList.remove('hidden'); 
    else document.getElementById('auth-step-cadastro').classList.remove('hidden'); 
}

window.fazerLogin = async function() {
    const pin = document.getElementById('auth-login-pin').value;
    if (pin.length < 4) return window.sysAlert("PIN Incompleto", "Sua senha possui 4 números.", "erro");
    const { data } = await _supabase.from('clientes').select('*').eq('telefone', TELEFONE_TEMP).eq('senha', pin).single();
    if (data) {
        CLIENTE_LOGADO = data;
        localStorage.setItem('sessaoCliente', JSON.stringify(data));
        window.fecharAuth();
        window.verificarSessao();
        if (ACAO_POS_LOGIN) { window.abrirPerfil(ACAO_POS_LOGIN); ACAO_POS_LOGIN = null; } 
        else window.abrirPerfil();
    } else window.sysAlert("Senha Incorreta", "O PIN digitado não confere.", "erro");
}

window.fazerCadastro = async function() {
    const n = document.getElementById('auth-cad-nome').value.trim().toUpperCase();
    const p = document.getElementById('auth-cad-pin').value;
    if (n.length < 3 || p.length < 4) return window.sysAlert("Dados Incompletos", "Informe seu nome e crie um PIN.", "erro");
    const { data } = await _supabase.from('clientes').insert([{ nome: n, telefone: TELEFONE_TEMP, senha: p }]).select().single();
    if (data) {
        CLIENTE_LOGADO = data;
        localStorage.setItem('sessaoCliente', JSON.stringify(data));
        window.fecharAuth();
        window.verificarSessao();
        window.abrirPerfil(ACAO_POS_LOGIN);
        ACAO_POS_LOGIN = null;
    } else window.sysAlert("Erro no Cadastro", "Não conseguimos criar sua conta.", "erro");
}

window.fecharAuth = function() { 
    const m = document.getElementById('modal-auth'); 
    if(m) { m.classList.add('hidden'); m.style.setProperty('display', 'none', 'important'); } 
}

window.fazerLogoutCliente = function() { 
    localStorage.removeItem('sessaoCliente'); 
    localStorage.removeItem('timeline_notificacoes'); 
    location.reload(); 
}

// =============================================================
// MÓDULO 4: PERFIL E ENDEREÇO
// =============================================================
window.abrirPerfil = function(origem = '') {
    window.fecharTodosModais();
    if (!CLIENTE_LOGADO) { 
        ACAO_POS_LOGIN = (typeof origem === 'string') ? origem : ''; 
        const m = document.getElementById('modal-auth');
        m.classList.remove('hidden');
        m.style.setProperty('display', 'flex', 'important');
        document.getElementById('auth-step-1').classList.remove('hidden');
        document.getElementById('auth-step-login').classList.add('hidden');
        document.getElementById('auth-step-cadastro').classList.add('hidden');
        return; 
    }
    
    let alterou = false;
    TIMELINE_NOTIFICACOES.forEach(t => { if(!t.lida) { t.lida = true; alterou = true; }});
    if(alterou) { localStorage.setItem('timeline_notificacoes', JSON.stringify(TIMELINE_NOTIFICACOES)); window.atualizarBadgePerfil(); }

    const c = CLIENTE_LOGADO;
    document.getElementById('perf-nome').value = c.nome || '';
    
    let telFormatado = c.telefone || '';
    if(telFormatado.length === 11) telFormatado = `(${telFormatado.slice(0,2)}) ${telFormatado.slice(2,3)} ${telFormatado.slice(3,7)}-${telFormatado.slice(7)}`;
    else if(telFormatado.length === 10) telFormatado = `(${telFormatado.slice(0,2)}) ${telFormatado.slice(2,6)}-${telFormatado.slice(6)}`;
    document.getElementById('perf-tel').value = telFormatado;
    
    let cepVal = c.cep || '';
    if(cepVal.length === 8 && !cepVal.includes('-')) cepVal = cepVal.slice(0,5) + '-' + cepVal.slice(5);
    document.getElementById('perf-cep').value = cepVal;
    
    document.getElementById('perf-rua').value = c.rua || '';
    document.getElementById('perf-num').value = c.num || '';
    document.getElementById('perf-bairro').value = c.bairro || '';
    document.getElementById('perf-cidade').value = c.cidade || '';
    document.getElementById('perf-comp').value = c.comp || '';
    document.getElementById('modal-perfil').dataset.origem = (typeof origem === 'string') ? origem : '';

    const mp = document.getElementById('modal-perfil');
    mp.classList.remove('hidden');
    mp.style.setProperty('display', 'flex', 'important');
}

window.salvarPerfil = async function() {
    const campos = { 
        nome: document.getElementById('perf-nome').value.trim().toUpperCase(), 
        cep: document.getElementById('perf-cep').value.replace(/\D/g, ''), 
        rua: document.getElementById('perf-rua').value.trim().toUpperCase(), 
        num: document.getElementById('perf-num').value.trim().toUpperCase(), 
        bairro: document.getElementById('perf-bairro').value.trim().toUpperCase(), 
        cidade: document.getElementById('perf-cidade').value.trim().toUpperCase(), 
        comp: document.getElementById('perf-comp').value.trim().toUpperCase() 
    };
    if (!campos.nome || !campos.rua || !campos.num || !campos.cidade) return window.sysAlert("Atenção", "Preencha a Cidade, Rua e Número.", "erro");
    
    const { data } = await _supabase.from('clientes').update(campos).eq('id', CLIENTE_LOGADO.id).select().single();
    if (data) {
        CLIENTE_LOGADO = data;
        localStorage.setItem('sessaoCliente', JSON.stringify(data));
        window.verificarSessao();
        window.sysAlert("Dados Salvos", "Endereço atualizado com sucesso!", "sucesso", [{label: "OK", class: "bg-emerald-500 text-white shadow-lg", onclick: "window.fecharPerfil()"}]);
    } else window.sysAlert("Erro", "Falha ao salvar no banco.", "erro");
}

window.fecharPerfil = function() {
    const origem = document.getElementById('modal-perfil').dataset.origem;
    const mp = document.getElementById('modal-perfil');
    mp.classList.add('hidden');
    mp.style.setProperty('display', 'none', 'important');
    window.fecharAlerta();
    if (origem === 'carrinho') window.abrirCarrinho(); 
}

window.abrirModalPin = function() {
    document.getElementById('modal-perfil').classList.add('hidden'); 
    document.getElementById('modal-perfil').style.setProperty('display', 'none', 'important');
    document.getElementById('pin-confirma-tel').value = ''; 
    document.getElementById('pin-novo-codigo').value = '';
    const m = document.getElementById('modal-alterar-pin'); 
    m.classList.remove('hidden'); 
    m.style.setProperty('display', 'flex', 'important');
}

window.fecharModalPin = function() {
    const m = document.getElementById('modal-alterar-pin'); 
    m.classList.add('hidden'); 
    m.style.setProperty('display', 'none', 'important');
    window.abrirPerfil(); 
}

window.confirmarAlteracaoPin = async function() {
    const telInput = document.getElementById('pin-confirma-tel').value.replace(/\D/g, '');
    const novoPin = document.getElementById('pin-novo-codigo').value.trim();

    if(String(telInput) !== String(CLIENTE_LOGADO.telefone)) return window.sysAlert("Acesso Negado", "O telefone não confere com a conta.", "erro");
    if(novoPin.length !== 4) return window.sysAlert("Atenção", "O novo PIN deve ter 4 números.", "erro");

    const btn = document.querySelector('#modal-alterar-pin button.bg-emerald-500');
    if(btn) btn.innerText = "SALVANDO...";

    const { data, error } = await _supabase.from('clientes').update({ senha: novoPin }).eq('id', CLIENTE_LOGADO.id).select().single();
        
    if(btn) btn.innerText = "SALVAR NOVO PIN"; 
    if(error) return window.sysAlert("Erro", "Problema de conexão. Tente novamente.", "erro");

    if(data) {
        CLIENTE_LOGADO = data; 
        localStorage.setItem('sessaoCliente', JSON.stringify(data));
        window.fecharModalPin(); 
        window.sysAlert("Segurança", "PIN atualizado com sucesso!", "sucesso");
    }
}

window.buscarCEP = async function(valor) {
    const cep = valor.replace(/\D/g, '');
    if (cep.length === 8) {
        document.getElementById('status-cep').classList.remove('hidden');
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const d = await res.json();
            if (!d.erro) {
                document.getElementById('perf-rua').value = d.logradouro.toUpperCase();
                document.getElementById('perf-bairro').value = d.bairro.toUpperCase();
                
                // Validação inteligente da cidade do CEP com o Banco de Dados
                const cidadeCEP = d.localidade.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const selectCidade = document.getElementById('perf-cidade');
                const opcaoValida = Array.from(selectCidade.options).find(opt => opt.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cidadeCEP);
                
                if (opcaoValida) {
                    selectCidade.value = opcaoValida.value;
                } else {
                    window.sysAlert("Área não coberta", `Seu CEP é de ${d.localidade}, mas parece que ainda não entregamos nessa região.`, "info");
                    selectCidade.value = "";
                }
                
                document.getElementById('perf-num').focus();
            } else window.sysAlert("CEP Inválido", "Não encontramos esse endereço.", "erro");
        } catch (e) {}
        document.getElementById('status-cep').classList.add('hidden');
    }
}

// =============================================================
// MÓDULO 5: PRODUTOS E CARDÁPIO
// =============================================================
window.carregarDados = async function() {
    // 1. Busca todos os dados necessários no Supabase em paralelo (mais rápido)
    const [resP, resS, resC, resT] = await Promise.all([ 
        _supabase.from('produtos').select('*').eq('ativo', true).order('nome'), 
        _supabase.from('sabores_lista').select('*').eq('ativo', true), 
        _supabase.from('configuracoes').select('loja_aberta, banner_url').eq('id', 1).single(),
        _supabase.from('taxas_entrega').select('*').eq('ativo', true).order('cidade')
    ]);
    
    // 2. Lógica de Configurações (Status e Banner)
    if (resC.data) { 
        LOJA_ABERTA = resC.data.loja_aberta; 
        
        // Atualiza Banner Principal (caso exista o elemento na tela atual)
        const imgBannerIndex = document.getElementById('img-banner-index');
        const imgBannerLoja = document.getElementById('img-banner-loja');
        const areaBannerLoja = document.getElementById('area-banner-loja');

        if (resC.data.banner_url) {
            if (imgBannerIndex) imgBannerIndex.src = resC.data.banner_url;
            if (imgBannerLoja) imgBannerLoja.src = resC.data.banner_url;
            if (areaBannerLoja) areaBannerLoja.classList.remove('hidden');
        }

        // Atualiza o Badge de Status (Aberto/Fechado)
        const containerStatus = document.getElementById('status-funcionamento-badge');
        if (containerStatus) {
            if (LOJA_ABERTA) {
                containerStatus.innerHTML = `
                    <div class="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-emerald-100">
                        <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                        <span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 pt-px">Aberto Agora</span>
                    </div>`;
            } else {
                containerStatus.innerHTML = `
                    <div class="inline-flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-slate-700">
                        <span class="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"></span>
                        <span class="text-[10px] font-black uppercase tracking-widest text-white pt-px">Fechado no Momento</span>
                    </div>`;
            }
        }
        
        // Banner de aviso (se a loja estiver fechada e o elemento existir)
        const bannerFechado = document.getElementById('banner-fechado');
        if (!LOJA_ABERTA && bannerFechado) {
            bannerFechado.classList.remove('hidden'); 
        }
    }

    // 3. Carrega Sabores
    if (resS.data) {
        SABORES_GLOBAIS = resS.data.map(s => s.nome);
    }

    // 4. Carrega Taxas de Entrega e preenche o Select no Perfil/Carrinho
    if (resT.data) { 
        TAXAS_GLOBAIS = resT.data; 
        const selectCidade = document.getElementById('perf-cidade');
        if (selectCidade) {
            selectCidade.innerHTML = '<option value="">Selecione sua cidade...</option>' + 
                TAXAS_GLOBAIS.map(t => `<option value="${t.cidade.toUpperCase()}">${t.cidade.toUpperCase()}</option>`).join('');
        }
    }

    // 5. Carrega e renderiza os Produtos
    if (resP.data) { 
        PRODUTOS = resP.data; 
        if (typeof window.render === 'function') {
            window.render(PRODUTOS); 
        }
    }
}

// DESENHO DOS PRODUTOS NA TELA (OTIMIZADO PARA MOBILE)
window.render = function(lista) {
    const container = document.getElementById('cardapio');
    if (!container) return;
    if (lista.length === 0) { container.innerHTML = `<p class="col-span-2 text-center py-20 font-black text-slate-300 uppercase italic">Nenhum item encontrado</p>`; return; }
    
    container.innerHTML = lista.map(p => `
        <div onclick="window.abrirDetalhes(${p.id})" class="bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100 active:scale-95 transition-all cursor-pointer group hover:border-red-100 flex flex-col h-full">
            <div class="h-32 sm:h-36 bg-slate-50 rounded-[1.5rem] overflow-hidden relative mb-3 shrink-0">
                ${p.foto ? `<img src="${p.foto}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-4xl">🍔</div>`}
            </div>
            <div class="px-2 pb-2 flex flex-col flex-1 justify-between">
                <div class="mb-2">
                    <p class="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">${p.categoria}</p>
                    <h4 class="font-black text-xs uppercase text-slate-800 leading-tight italic break-words">${p.nome}</h4>
                </div>
                <div>
                    <span class="bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-md italic inline-block">R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>`).join('');
}

window.abrirDetalhes = function(id) {
    if (!LOJA_ABERTA) return window.sysAlert("Loja Fechada", "Não aceitamos pedidos agora. Volte em breve!", "info");
    
    ATUAL = PRODUTOS.find(p => p.id === id);
    QTD = 1;
    PRECO_BASE_ATUAL = ATUAL.preco;
    ADICIONAIS_SELECIONADOS = [];
    SABOR_SELECIONADO = null;

    // 1. Montagem da Galeria de Fotos
    const galeriaContainer = document.getElementById('galeria-fotos-container');
    const indicador = document.getElementById('indicador-fotos');
    
    // Junta a foto de capa com as fotos da galeria em um único array
    let todasAsFotos = [];
    if (ATUAL.foto) todasAsFotos.push(ATUAL.foto);
    
    if (ATUAL.galeria) {
        const fotosExtra = typeof ATUAL.galeria === 'string' ? JSON.parse(ATUAL.galeria) : ATUAL.galeria;
        if (Array.isArray(fotosExtra)) {
            todasAsFotos = [...todasAsFotos, ...fotosExtra];
        }
    }

    // Se não tiver nenhuma foto, coloca o emoji de lanche
    if (todasAsFotos.length === 0) {
        galeriaContainer.innerHTML = `<div class="w-full h-full flex items-center justify-center text-6xl snap-center bg-slate-100">🍔</div>`;
        indicador.classList.add('hidden');
    } else {
        // Gera o HTML de cada slide
        galeriaContainer.innerHTML = todasAsFotos.map(url => `
            <div class="min-w-full h-full snap-center shrink-0">
                <img src="${url}" class="w-full h-full object-cover">
            </div>
        `).join('');

        // Configura o indicador (Ex: 1 / 3)
        if (todasAsFotos.length > 1) {
            indicador.innerText = `1 / ${todasAsFotos.length}`;
            indicador.classList.remove('hidden');
            
            // Lógica para atualizar o número conforme o usuário desliza
            galeriaContainer.onscroll = () => {
                const index = Math.round(galeriaContainer.scrollLeft / galeriaContainer.offsetWidth);
                indicador.innerText = `${index + 1} / ${todasAsFotos.length}`;
            };
        } else {
            indicador.classList.add('hidden');
        }
    }

    // Restante das informações (Nome, Preço, etc)
    document.getElementById('det-nome').innerText = ATUAL.nome;
    document.getElementById('det-desc').innerText = ATUAL.descricao || '';
    document.getElementById('det-preco').innerText = `R$ ${parseFloat(ATUAL.preco).toFixed(2).replace('.', ',')}`;
    document.getElementById('det-obs').value = '';
    document.getElementById('det-qtd').innerText = QTD;

    // Renderiza as opções (Sabores, Insumos, Adicionais)
    // (O código dos sabores/insumos/adicionais continua o mesmo aqui abaixo...)
    const bS = document.getElementById('box-sabores'), lS = document.getElementById('lista-sabores');
    lS.innerHTML = '';
    if (ATUAL.sabores) {
        const arr = ATUAL.sabores.split(',').map(s => s.trim()).filter(s => s && SABORES_GLOBAIS.includes(s));
        if (arr.length > 0) {
            lS.innerHTML = arr.map(s => `<label class="cursor-pointer"><input type="radio" name="radio-sabor" value="${s}" onchange="SABOR_SELECIONADO = this.value" class="peer sr-only"><div class="p-3 rounded-xl bg-white border-2 border-slate-100 text-[10px] font-black text-slate-500 peer-checked:bg-blue-500 peer-checked:text-white peer-checked:border-blue-600 text-center uppercase transition-all shadow-sm italic">${s}</div></label>`).join('');
            bS.classList.remove('hidden');
        } else bS.classList.add('hidden');
    } else bS.classList.add('hidden');

    const bR = document.getElementById('box-retirar'), lR = document.getElementById('lista-retirar');
    lR.innerHTML = '';
    if (ATUAL.ingredientes) {
        ATUAL.ingredientes.split(',').forEach(i => { if(i.trim()) lR.innerHTML += `<label class="cursor-pointer"><input type="checkbox" value="${i.trim()}" class="chk-retirar peer sr-only"><div class="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-400 peer-checked:bg-red-50 peer-checked:text-red-500 uppercase flex items-center gap-2 italic"><i class="ph-bold ph-x"></i> Sem ${i.trim()}</div></label>`; });
        bR.classList.remove('hidden');
    } else bR.classList.add('hidden');

    const bA = document.getElementById('box-adicionar'), lA = document.getElementById('lista-adicionar');
    lA.innerHTML = '';
    if (ATUAL.adicionais) {
        ATUAL.adicionais.split(',').forEach(item => {
            const p = item.split(':');
            if (p.length === 2) {
                const n = p[0].trim(), pr = parseFloat(p[1]);
                lA.innerHTML += `<label class="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer active:bg-white"><div class="flex items-center gap-3"><input type="checkbox" onchange="window.toggleAdicional(${pr}, this.checked, '${n}')" class="w-5 h-5 accent-emerald-500 rounded"><span class="text-[11px] font-black text-slate-600 uppercase italic">${n}</span></div><span class="text-[10px] font-black text-emerald-500">+ R$ ${pr.toFixed(2)}</span></label>`;
            }
        });
        bA.classList.remove('hidden');
    } else bA.classList.add('hidden');

    window.atualizarBtnTotal();
    const m = document.getElementById('modal-detalhes');
    m.classList.remove('hidden');
    m.style.display = 'flex';
}

window.toggleAdicional = function(v, m, n) { 
    if (m) { PRECO_BASE_ATUAL += v; ADICIONAIS_SELECIONADOS.push(n); } 
    else { PRECO_BASE_ATUAL -= v; ADICIONAIS_SELECIONADOS = ADICIONAIS_SELECIONADOS.filter(x => x !== n); } 
    window.atualizarBtnTotal(); 
}

window.mudarQtd = function(v) { 
    if (QTD + v > 0) { QTD += v; document.getElementById('det-qtd').innerText = QTD; window.atualizarBtnTotal(); } 
}

window.atualizarBtnTotal = function() { 
    const total = (PRECO_BASE_ATUAL * QTD).toFixed(2);
    document.getElementById('det-total-btn').innerText = `R$ ${total.replace('.', ',')}`; 
}

window.fecharDetalhes = function() { 
    const m = document.getElementById('modal-detalhes'); 
    if(m) { m.classList.add('hidden'); m.style.setProperty('display', 'none', 'important'); }
}

// =============================================================
// MÓDULO 6: CARRINHO E CHECKOUT COM TAXA DINÂMICA
// =============================================================

// Função blindada para evitar erros caso falte informação do cliente
window.calcularFreteAtual = function() {
    try {
        if (!CLIENTE_LOGADO || !CLIENTE_LOGADO.cidade) return 0;
        
        // Remove acentos e joga tudo para maiúsculo para garantir a comparação
        const cidadeNormalizada = String(CLIENTE_LOGADO.cidade).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const taxaEncontrada = (TAXAS_GLOBAIS || []).find(t => {
            if(!t || !t.cidade) return false;
            return String(t.cidade).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cidadeNormalizada;
        });

        // Retorna a taxa cadastrada ou R$ 5,00 padrão caso não ache a cidade
        return taxaEncontrada ? parseFloat(taxaEncontrada.taxa) : 5.00;
    } catch (error) {
        console.error("Erro ao calcular frete:", error);
        return 5.00; // Taxa padrão em caso de erro
    }
}

window.addCarrinho = function() {
    const boxSab = document.getElementById('box-sabores');
    if (!boxSab.classList.contains('hidden') && !SABOR_SELECIONADO) return window.sysAlert("Sabor Obrigatório", "Escolha um sabor para continuar.", "erro");
    
    const obs = document.getElementById('det-obs').value.trim(); 
    const ret = Array.from(document.querySelectorAll('.chk-retirar:checked')).map(el => `S/${el.value}`);
    
    let detalhes = []; 
    if (SABOR_SELECIONADO) detalhes.push(`Sabor: ${SABOR_SELECIONADO}`); 
    if (ret.length > 0) detalhes.push(...ret); 
    if (ADICIONAIS_SELECIONADOS.length > 0) detalhes.push(`Add: ${ADICIONAIS_SELECIONADOS.join(', ')}`); 
    if (obs) detalhes.push(`OBS: ${obs}`);
    
    const obsFinal = detalhes.join(' | ');

    const indexExistente = CARRINHO.findIndex(item => item.produto.id === ATUAL.id && item.obs === obsFinal);

    if (indexExistente !== -1) {
        CARRINHO[indexExistente].qtd += QTD;
    } else {
        CARRINHO.push({ produto: ATUAL, qtd: QTD, precoUnitario: PRECO_BASE_ATUAL, obs: obsFinal });
    }
    
    window.atualizarBadge(); 
    window.fecharDetalhes();
    
    window.sysAlert("ITEM NA SACOLA!", "Deseja ver a sacola ou continuar comprando?", "sucesso", [
        {label: "🍔 CONTINUAR", class: "bg-slate-100 text-slate-800 font-black shadow-sm", onclick: "window.fecharAlerta()"},
        {label: "🛍️ VER SACOLA", class: "bg-red-600 text-white font-black shadow-lg", onclick: "window.abrirCarrinho()"}
    ]);
}

window.atualizarBadge = function() {
    const t = CARRINHO.reduce((acc, i) => acc + i.qtd, 0);
    const b = document.getElementById('badge-carrinho');
    if(b) { b.innerText = t; if (t > 0) b.classList.remove('hidden'); else b.classList.add('hidden'); }
}

window.abrirCarrinho = function() {
    window.fecharAlerta();
    window.fecharTodosModais();
    if (CARRINHO.length === 0) return window.sysAlert("Sacola Vazia", "Sua sacola está vazia. Adicione itens!", "info");
    
    const container = document.getElementById('lista-carrinho');
    container.innerHTML = CARRINHO.map((item, index) => `
        <div class="flex justify-between items-start bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div class="flex gap-4">
                <span class="bg-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border border-slate-200 text-slate-600">${item.qtd}x</span>
                <div><p class="text-xs font-black uppercase text-slate-700 italic">${item.produto.nome}</p>${item.obs ? `<p class="text-[9px] font-bold text-red-400 mt-1 uppercase italic">${item.obs}</p>` : ''}<p class="text-[10px] font-black text-emerald-600 mt-1 italic">R$ ${(item.precoUnitario * item.qtd).toFixed(2).replace('.', ',')}</p></div>
            </div>
            <button onclick="window.removerItem(${index})" class="text-slate-300 hover:text-red-500 transition-colors text-xl">✕</button>
        </div>`).join('');
    
    // Cálculo de Valores
    const vTotalProdutos = CARRINHO.reduce((acc, i) => acc + (i.precoUnitario * i.qtd), 0);
    const taxaEntrega = window.calcularFreteAtual();
    const vTotalFinal = vTotalProdutos + taxaEntrega;

    const elSubtotal = document.getElementById('resumo-subtotal');
    if (elSubtotal) elSubtotal.innerText = `R$ ${vTotalProdutos.toFixed(2).replace('.', ',')}`;
    
    const elTaxa = document.getElementById('resumo-taxa');
    if (elTaxa) {
        if (taxaEntrega === 0) {
            elTaxa.innerText = "Grátis";
            elTaxa.className = "text-xs font-black text-emerald-500 uppercase";
        } else {
            elTaxa.innerText = `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`;
            elTaxa.className = "text-xs font-black text-orange-500";
        }
    }

    document.getElementById('resumo-final').innerText = `R$ ${vTotalFinal.toFixed(2).replace('.', ',')}`;
    
    window.atualizarResumoEndereco();
    window.validarCheckout();
    
    const m = document.getElementById('modal-carrinho');
    m.classList.remove('hidden');
    m.style.setProperty('display', 'flex', 'important');
}

window.removerItem = function(i) { 
    CARRINHO.splice(i, 1); 
    if (CARRINHO.length === 0) { window.fecharCarrinho(); window.sysAlert("Atenção", "Sua sacola ficou vazia.", "info"); } 
    else window.abrirCarrinho(); 
    window.atualizarBadge(); 
}

window.fecharCarrinho = function() { 
    const m = document.getElementById('modal-carrinho'); 
    if(m) { m.classList.add('hidden'); m.style.setProperty('display', 'none', 'important'); } 
}

window.validarCheckout = function() {
    const btn = document.getElementById('btn-confirmar-pedido');
    const pgto = document.getElementById('forma-pagamento');
    if(!btn || !pgto) return;
    let ok = (CARRINHO.length > 0 && CLIENTE_LOGADO && CLIENTE_LOGADO.rua && CLIENTE_LOGADO.num && CLIENTE_LOGADO.cidade && pgto.value);
    if (ok) {
        btn.disabled = false;
        btn.className = "w-full bg-emerald-500 text-white h-16 rounded-2xl text-sm font-black uppercase shadow-xl active:scale-95 flex justify-between items-center px-8 transition-all italic";
        btn.innerHTML = `<span>Confirmar Pedido</span><i class="ph-bold ph-paper-plane-right text-xl"></i>`;
    } else {
        btn.disabled = true;
        btn.className = "w-full bg-slate-300 text-slate-500 h-16 rounded-2xl text-sm font-black uppercase opacity-50 cursor-not-allowed flex justify-between items-center px-8 italic";
        btn.innerHTML = `<span>Preencha os Dados</span><i class="ph-bold ph-lock-key text-xl"></i>`;
    }
}

// =============================================================
// MÓDULO 7: ENVIO DO PEDIDO E HISTÓRICO
// =============================================================
window.enviarPedido = async function() {
    if (!LOJA_ABERTA) return window.sysAlert("Loja Fechada", "Não aceitamos pedidos no momento.", "erro");

    const fp = document.getElementById('forma-pagamento').value;
    const vtProdutos = CARRINHO.reduce((acc, i) => acc + (i.precoUnitario * i.qtd), 0);
    const taxa = window.calcularFreteAtual();
    const vtFinalComFrete = vtProdutos + taxa;

    const enderecoFormatado = `${CLIENTE_LOGADO.rua}, ${CLIENTE_LOGADO.num} - ${CLIENTE_LOGADO.bairro}, ${CLIENTE_LOGADO.cidade}`.toUpperCase();

    const payload = { 
        cliente_nome: CLIENTE_LOGADO.nome, 
        cliente_tel: CLIENTE_LOGADO.telefone, 
        endereco: enderecoFormatado,
        forma_pagamento: fp.toUpperCase(),
        taxa_entrega: taxa,
        referencia: (CLIENTE_LOGADO.referencia || CLIENTE_LOGADO.ponto_referencia || "-").toUpperCase(),
        
        itens: CARRINHO.map(i => ({ 
            nome: i.produto.nome, 
            qtd: i.qtd, 
            preco: i.precoUnitario, 
            detalhes: i.obs || "",
            removidos: i.removidos || [],
            adicionais: i.adicionais || [],
            sabor: i.sabor || ""
        })), 
        total: vtFinalComFrete, 
        // --- AQUI ESTÁ A MÁGICA DO STATUS ---
        status: fp.toUpperCase() === 'PIX' ? 'Aguardando PIX' : 'Pendente',
        // ------------------------------------
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await _supabase.from('pedidos').insert([payload]).select().single();

    if (error) {
        console.error("Erro ao enviar pedido:", error);
        return window.sysAlert("Erro", "Falha de conexão. Tente novamente.", "erro");
    }

    if (data) { 
        CARRINHO = []; 
        window.atualizarBadge(); 
        window.fecharCarrinho(); 
        
        MEUS_PEDIDOS_IDS.push(data.id);
        
        if (fp.toUpperCase() === 'PIX') {
            window.abrirModalPix(data.id, vtFinalComFrete);
        } else {
            document.getElementById('sucesso-pedido-id').innerText = `Pedido #${data.id}`;
            document.getElementById('sucesso-endereco').innerText = `${CLIENTE_LOGADO.rua}, ${CLIENTE_LOGADO.num}`;
            document.getElementById('sucesso-pgto').innerText = fp.toUpperCase();
            document.getElementById('sucesso-total').innerText = `R$ ${vtFinalComFrete.toFixed(2).replace('.', ',')}`;
            
            const modS = document.getElementById('modal-pedido-sucesso');
            if (modS) {
                modS.classList.remove('hidden'); 
                modS.style.setProperty('display', 'flex', 'important');
            }
        }
        
        window.verificarPedidosAtivos();
    }
}

window.fecharModalSucesso = function() { 
    const m = document.getElementById('modal-pedido-sucesso'); 
    if(m) { m.classList.add('hidden'); m.style.setProperty('display', 'none', 'important'); } 
}

window.fecharSucessoAbrirHistorico = function() { window.fecharModalSucesso(); window.abrirMeusPedidos(); }

window.abrirMeusPedidos = async function() {
    window.fecharTodosModais();
    if (!CLIENTE_LOGADO) return window.abrirPerfil();
    
    const m = document.getElementById('modal-pedidos-hist');
    m.classList.remove('hidden'); m.style.setProperty('display', 'flex', 'important');
    
    const c = document.getElementById('lista-meus-pedidos');
    c.innerHTML = '<div class="py-20 text-center opacity-50"><i class="ph-bold ph-spinner animate-spin text-3xl"></i></div>';
    
    const { data } = await _supabase.from('pedidos').select('*').eq('cliente_tel', CLIENTE_LOGADO.telefone).order('created_at', { ascending: false });
    if (data) { 
        HISTORICO_PEDIDOS_CLIENTE = data; 
        window.renderizarListaPedidos(); 
    } else {
        c.innerHTML = `<div class="text-center py-20 opacity-40 italic"><p class="text-xs font-black uppercase">Nenhum pedido</p></div>`;
    }
}

window.filtrarHistorico = function(tipo) {
    FILTRO_HISTORICO_ATUAL = tipo;
    const btnA = document.getElementById('btn-filtro-andamento'), btnF = document.getElementById('btn-filtro-finalizado');
    if (tipo === 'andamento') {
        btnA.className = "flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase shadow-md transition-all";
        btnF.className = "flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase transition-all";
    } else {
        btnF.className = "flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase shadow-md transition-all";
        btnA.className = "flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase transition-all";
    }
    window.renderizarListaPedidos();
}

window.renderizarListaPedidos = function() {
    const container = document.getElementById('lista-meus-pedidos');
    
    // ADICIONADO 'Aguardando PIX' no filtro de pedidos em andamento
    const pFiltrados = FILTRO_HISTORICO_ATUAL === 'andamento' 
        ? HISTORICO_PEDIDOS_CLIENTE.filter(p => ['Aguardando PIX', 'Pendente', 'Em Preparo', 'Em Rota'].includes(p.status)) 
        : HISTORICO_PEDIDOS_CLIENTE.filter(p => ['Entregue', 'Cancelado'].includes(p.status));
    
    if (pFiltrados.length === 0) { 
        container.innerHTML = `<div class="text-center py-20 opacity-40 italic"><p class="text-xs font-black uppercase tracking-widest">Nada por aqui</p></div>`; 
        return; 
    }
    
    container.innerHTML = pFiltrados.map(pedido => {
        const pagStr = pedido.forma_pagamento || (pedido.endereco.split('PGTO: ')[1] || '---');
        
        // ADICIONADA a cor amarela para o status 'Aguardando PIX'
        const cores = { 
            'Aguardando PIX': 'bg-yellow-500 text-white',
            'Pendente': 'bg-slate-800 text-white', 
            'Em Preparo': 'bg-orange-500 text-white', 
            'Em Rota': 'bg-blue-500 text-white', 
            'Entregue': 'bg-emerald-500 text-white', 
            'Cancelado': 'bg-red-500 text-white' 
        };
        
        return `
        <div onclick="window.abrirHistoricoPedido(${pedido.id}, '${pedido.status}', '${pedido.created_at}')" class="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 animate-pop cursor-pointer hover:border-blue-200 group">
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-black text-slate-400 uppercase italic">Pedido #${pedido.id}</span>
                <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full ${cores[pedido.status] || 'bg-slate-400 text-white'}">${pedido.status}</span>
            </div>
            <div class="space-y-2">
                ${pedido.itens.map(i => `<div class="text-[11px] font-bold text-slate-600 leading-snug"><span class="text-slate-800 font-black">${i.qtd}x</span> ${i.nome}</div>`).join('')}
            </div>
            <div class="mt-2 pt-3 border-t border-slate-200/60 flex justify-between items-center">
                <div class="flex flex-col">
                    <span class="text-[8px] font-black text-slate-400 uppercase">Pagamento</span>
                    <span class="text-[10px] font-black text-slate-700 uppercase italic">${pagStr}</span>
                </div>
                <div class="bg-blue-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl italic flex items-center gap-2 shadow-md group-hover:bg-blue-600 transition-all">
                    <i class="ph-bold ph-chat-teardrop-text"></i> Acompanhar
                </div>
            </div>
        </div>`;
    }).join('');
}

window.fecharMeusPedidos = function() { 
    const m = document.getElementById('modal-pedidos-hist'); 
    if(m) { m.classList.add('hidden'); m.style.setProperty('display', 'none', 'important'); } 
}

// =============================================================
// MÓDULO 8: CHAT DE ACOMPANHAMENTO (RECONCILIAÇÃO)
// =============================================================
window.abrirHistoricoPedido = function(id, statusAtual, createdAt = null) {
    const pOrig = HISTORICO_PEDIDOS_CLIENTE.find(x => x.id === id);
    
    // Adicionamos os textos e cores para o status de Aguardando PIX
    const ux = {
        'Aguardando PIX': { msg: 'Aguardando pagamento. Anexe o comprovante abaixo! ⏳', icone: '💠', bg: 'bg-yellow-500 text-white' },
        'Aguardando PIX Recebido': { msg: 'Comprovante recebido! Estamos conferindo para liberar seu pedido na cozinha. ✅', icone: '🔍', bg: 'bg-emerald-500 text-white' },
        'Pendente': { msg: 'Pedido Enviado! Aguardando aceite da loja.', icone: '🛒', bg: 'bg-slate-800 text-white' },
        'Em Preparo': { msg: 'Eba! Seu pedido foi aceito e já está em produção! 🔥', icone: '👨‍🍳', bg: 'bg-orange-500 text-white' },
        'Em Rota': { msg: 'Tudo pronto! Seu pedido saiu para entrega. 🛵💨', icone: '🛵', bg: 'bg-blue-500 text-white' },
        'Entregue': { msg: 'Pedido Finalizado! Bom apetite! 🎉', icone: '😋', bg: 'bg-emerald-500 text-white' },
        'Cancelado': { msg: 'Infelizmente não foi possível aceitar seu pedido. 😔', icone: '❌', bg: 'bg-red-500 text-white' }
    };

    let chat = [];
    const hCriacao = createdAt ? new Date(createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '--:--';
    const hAgora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    
    chat.push({ side: 'client', msg: 'Pedido Enviado!', hora: hCriacao });

    if(pOrig) {
        const resumoProdutos = pOrig.itens.map(i => `${i.qtd}x ${i.nome}`).join('<br>');
        const pag = pOrig.forma_pagamento || pOrig.endereco.split('PGTO: ')[1] || '---';
        const obsFinal = pOrig.itens.map(i => i.detalhes).filter(d => d).join(' | ');
        
        let msgDetalhes = `<div class="text-[10px] space-y-1 text-left">
                            <p class="border-b border-slate-100 pb-1 text-slate-800"><strong class="text-slate-500">ITENS:</strong><br>${resumoProdutos}</p>
                            <p class="border-b border-slate-100 pb-1 text-slate-800"><strong class="text-slate-500">PAGAMENTO:</strong> ${pag}</p>`;
        if(obsFinal) msgDetalhes += `<p class="text-slate-800"><strong class="text-slate-500">OBS:</strong> ${obsFinal}</p>`;
        msgDetalhes += `</div>`;
        
        chat.push({ side: 'client', msg: msgDetalhes, hora: hCriacao });

        // Se o cliente já anexou o comprovante, mostra no chat dele
        if (pOrig.comprovante_url) {
            chat.push({ side: 'client', msg: `<a href="${pOrig.comprovante_url}" target="_blank" class="text-blue-500 underline flex items-center gap-1 font-black uppercase tracking-widest text-[10px]"><i class="ph-bold ph-receipt"></i> Ver Comprovante</a>`, hora: hCriacao });
        }
    }

    // --- LÓGICA DE STATUS DO PIX ---
    if (statusAtual === 'Aguardando PIX') {
        if (pOrig && pOrig.comprovante_url) {
             chat.push({ side: 'store', status: 'Aguardando PIX Recebido', msg: ux['Aguardando PIX Recebido'].msg, icone: ux['Aguardando PIX Recebido'].icone, hora: hAgora });
        } else {
             chat.push({ side: 'store', status: 'Aguardando PIX', msg: ux['Aguardando PIX'].msg, icone: ux['Aguardando PIX'].icone, hora: hAgora });
        }
    }
    // --------------------------------

    if (statusAtual === 'Pendente') chat.push({ side: 'store', status: 'Pendente', msg: ux['Pendente'].msg, icone: ux['Pendente'].icone, hora: hCriacao });
    if (statusAtual === 'Em Preparo' || statusAtual === 'Em Rota' || statusAtual === 'Entregue') chat.push({ side: 'store', status: 'Em Preparo', msg: ux['Em Preparo'].msg, icone: ux['Em Preparo'].icone, hora: hAgora });
    if (statusAtual === 'Em Rota' || statusAtual === 'Entregue') chat.push({ side: 'store', status: 'Em Rota', msg: ux['Em Rota'].msg, icone: ux['Em Rota'].icone, hora: hAgora });
    if (statusAtual === 'Entregue') chat.push({ side: 'store', status: 'Entregue', msg: ux['Entregue'].msg, icone: ux['Entregue'].icone, hora: hAgora });
    if (statusAtual === 'Cancelado') chat.push({ side: 'store', status: 'Cancelado', msg: ux['Cancelado'].msg, icone: ux['Cancelado'].icone, hora: hAgora });

    // --- CAIXA DE UPLOAD (Só aparece se o pedido é PIX e NÃO tem comprovante ainda) ---
    let blocoUploadHtml = '';
    if (statusAtual === 'Aguardando PIX' && pOrig && !pOrig.comprovante_url) {
        blocoUploadHtml = `
            <div class="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl animate-pop text-center shadow-sm">
                <p class="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-3 italic">Finalize seu pedido</p>
                <label class="w-full bg-yellow-500 text-white py-4 rounded-xl font-black uppercase text-[10px] cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30 hover:bg-yellow-600 transition-colors tracking-widest active:scale-95">
                    <i class="ph-bold ph-upload-simple text-lg"></i> Anexar Comprovante PIX
                    <input type="file" accept="image/*" class="hidden" onchange="window.enviarComprovantePix(${id}, event)">
                </label>
            </div>
        `;
    }

    const container = document.getElementById('conteudo-historico-pedido');
    container.innerHTML = `
        <div class="flex flex-col space-y-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-200 min-h-[50vh] max-h-[65vh] overflow-y-auto shadow-inner" id="chat-historico">
            ${chat.map(ev => ev.side==='client' ? 
                `<div class="self-start max-w-[85%] animate-pop"><p class="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">${ev.hora} • Você</p><div class="bg-white p-4 rounded-2xl rounded-tl-sm border shadow-sm text-slate-700 text-xs font-black uppercase italic">${ev.msg}</div></div>` : 
                `<div class="self-end max-w-[85%] animate-pop"><p class="text-[8px] font-black text-slate-400 uppercase mb-1 mr-1 text-right">${ev.hora} • Loja</p><div class="${ux[ev.status].bg} p-4 rounded-2xl rounded-tr-sm shadow-md text-white text-xs font-black uppercase italic text-right flex flex-col items-end gap-1"><span>${ev.msg}</span><span class="text-xl">${ev.icone}</span></div></div>`
            ).join('')}
            ${blocoUploadHtml}
        </div>`;
    
    document.getElementById('modal-pedido-historico').classList.remove('hidden');
    document.getElementById('modal-pedido-historico').style.setProperty('display', 'flex', 'important');
    setTimeout(() => { const c = document.getElementById('chat-historico'); if(c) c.scrollTop = c.scrollHeight; }, 50);
}

window.fecharHistoricoPedido = function() { 
    const m = document.getElementById('modal-pedido-historico'); 
    if(m) { m.classList.add('hidden'); m.style.setProperty('display', 'none', 'important'); } 
}

// =============================================================
// MÓDULO 9: FILTROS E BUSCA
// =============================================================
window.buscarProduto = function() { 
    const t = document.getElementById('campo-busca').value.toLowerCase(); 
    window.render(PRODUTOS.filter(p => p.nome.toLowerCase().includes(t))); 
}

window.filtrar = function(cat, b) { 
    document.querySelectorAll('.btn-filtro').forEach(x => x.className = "btn-filtro px-6 py-2.5 rounded-full bg-white text-slate-400 border border-slate-100 text-[10px] font-black uppercase transition-all whitespace-nowrap"); 
    b.className = "btn-filtro px-6 py-2.5 rounded-full bg-slate-800 text-white text-[10px] font-black uppercase shadow-md transition-all whitespace-nowrap"; 
    window.render(cat === 'Todos' ? PRODUTOS : PRODUTOS.filter(p => p.categoria === cat)); 
}

// =============================================================
// MÓDULO 10: REALTIME
// =============================================================
_supabase.channel('status-cliente').on('postgres_changes', {event:'UPDATE', schema:'public', table:'pedidos'}, payload => {
    if (CLIENTE_LOGADO && MEUS_PEDIDOS_IDS.includes(payload.new.id)) {
        window.verificarPedidosAtivos();
        
        const modChat = document.getElementById('modal-pedido-historico');
        if (modChat && !modChat.classList.contains('hidden')) { 
            window.abrirHistoricoPedido(payload.new.id, payload.new.status, payload.new.created_at); 
        }
        
        const area = document.getElementById('status-area'); 
        if(area) {
            const cfg = { 'Em Preparo': {m:'Pedido Aceito! 🔥', b:'bg-orange-500'}, 'Em Rota': {m:'Saiu pra Entrega! 🛵', b:'bg-blue-500'}, 'Entregue': {m:'Pedido Entregue! 🎉', b:'bg-emerald-500'}, 'Cancelado': {m:'Pedido Cancelado ❌', b:'bg-red-500'} }[payload.new.status] || {m:'Status Atualizado', b:'bg-slate-800'};
            area.innerHTML = `<div class="${cfg.b} text-white p-5 rounded-3xl shadow-2xl animate-pop border-2 border-white/20 mt-2 cursor-pointer" onclick="window.abrirHistoricoPedido(${payload.new.id}, '${payload.new.status}')"><div><p class="text-[9px] font-black uppercase opacity-70">Pedido #${payload.new.id}</p><p class="text-lg font-black uppercase italic">${cfg.m}</p></div></div>`;
            setTimeout(() => area.innerHTML = '', 8000);
        }
        
        const hist = document.getElementById('modal-pedidos-hist');
        if (hist && !hist.classList.contains('hidden')) { window.abrirMeusPedidos(); }
    }
}).subscribe();

/* =============================================================
   MÓDULO: PAGAMENTO VIA PIX E COMPROVANTE WHATSAPP
   ============================================================= */

let PEDIDO_ATUAL_PIX = null;

window.abrirModalPix = async function(pedidoId, valorTotal) {
    PEDIDO_ATUAL_PIX = pedidoId;
    
    document.getElementById('pix-valor-total').innerText = `R$ ${parseFloat(valorTotal).toFixed(2).replace('.', ',')}`;
    
    // --- BUSCA OS DADOS DINÂMICOS DO PIX NO BANCO ---
    try {
        const { data: cfg } = await _supabase.from('configuracoes').select('chave_pix, qr_code_pix').eq('id', 1).single();
        if (cfg) {
            // Se tiver chave PIX cadastrada, preenche o Input
            if (cfg.chave_pix) {
                document.getElementById('pix-chave-input').value = cfg.chave_pix;
            }
            
            // Se tiver Imagem do QR Code cadastrada, mostra a imagem
            const qrContainer = document.getElementById('pix-qr-container');
            const qrImg = qrContainer.querySelector('img'); 
            
            if (cfg.qr_code_pix) {
                qrImg.src = cfg.qr_code_pix;
                qrContainer.classList.remove('hidden'); // Revela a div da imagem
            } else {
                qrContainer.classList.add('hidden'); // Esconde se não tiver
            }
        }
    } catch(e) { console.error("Erro ao carregar dados do Pix", e); }
    // ------------------------------------------------

    const modal = document.getElementById('modal-pix');
    const box = document.getElementById('modal-pix-box');
    
    document.getElementById('modal-pedido-sucesso').classList.add('hidden');
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        box.classList.remove('scale-95');
    }, 10);
};

window.fecharModalPix = function() {
    const modal = document.getElementById('modal-pix');
    const box = document.getElementById('modal-pix-box');
    
    modal.style.opacity = '0';
    box.classList.add('scale-95');
    setTimeout(() => { 
        modal.classList.add('hidden'); 
        modal.style.display = 'none'; 
        // Quando fechar o pix, abre a tela de "Pedido Enviado" ou o Histórico
        window.fecharSucessoAbrirHistorico();
    }, 300);
};

window.copiarChavePix = function() {
    const inputChave = document.getElementById('pix-chave-input');
    
    inputChave.select();
    inputChave.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(inputChave.value).then(() => {
        window.sysAlert('Chave Copiada!', 'Abra o app do seu banco e cole a chave para transferir o valor.', 'sucesso');
    }).catch(err => {
        alert("Erro ao copiar a chave. Selecione o texto e copie manualmente.");
    });
};

window.enviarComprovanteWpp = async function() {
    let telLoja = "5527999999999"; // <-- COLOQUE SEU NUMERO AQUI COMO PLANO B
    
    try {
        const { data: cfg } = await _supabase.from('configuracoes').select('telefone_loja').eq('id', 1).single();
        if (cfg && cfg.telefone_loja) {
            telLoja = "55" + cfg.telefone_loja.replace(/\D/g, ''); 
        }
    } catch(e) {}

    const mensagem = `Olá! Segue o comprovante do pagamento via PIX referente ao meu *Pedido #${PEDIDO_ATUAL_PIX}*.`;
    const url = `https://wa.me/${telLoja}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
    window.fecharModalPix();
};

window.enviarComprovantePix = async function(pedidoId, event) {
    const file = event.target.files[0];
    if (!file) return;

    window.sysAlert('Enviando...', 'Aguarde enquanto salvamos seu comprovante.', 'info');

    const fileExt = file.name.split('.').pop();
    const fileName = `comprovante_${pedidoId}_${Date.now()}.${fileExt}`;
    const filePath = `comprovantes/${fileName}`; // Vai salvar na pasta "comprovantes" do seu bucket imagens

    // 1. Faz o upload da imagem
    const { error: uploadError } = await _supabase.storage.from('imagens').upload(filePath, file);

    if (uploadError) {
        window.fecharAlerta();
        return window.sysAlert('Erro', 'Falha ao enviar comprovante. Tente novamente.', 'erro');
    }

    // 2. Pega o link público da imagem
    const { data: publicUrlData } = _supabase.storage.from('imagens').getPublicUrl(filePath);
    const comprovanteUrl = publicUrlData.publicUrl;

    // 3. Salva no pedido
    const { error: updateError } = await _supabase.from('pedidos').update({ 
        comprovante_url: comprovanteUrl 
    }).eq('id', pedidoId);

    if (updateError) {
        window.fecharAlerta();
        return window.sysAlert('Erro', 'Comprovante enviado, mas não foi possível vincular ao pedido.', 'erro');
    }

    window.sysAlert('Sucesso!', 'Comprovante anexado! Em breve seu pedido será confirmado.', 'sucesso');
    
    // Atualiza a tela de histórico para mostrar que o comprovante foi recebido
    if (typeof window.abrirDetalhesPedidoHistorico === 'function') {
        window.abrirDetalhesPedidoHistorico(pedidoId);
    }
};