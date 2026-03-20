/* =============================================================
   MÓDULO: UX, MODAIS E CORREÇÃO DE TELA (FORÇA BRUTA)
   ============================================================= */
window.addEventListener('click', function(e) {
    if (e.target.id === 'modal-alerta') window.fecharAlerta();
    if (e.target.id === 'modal-confirmacao') {
        const btnNao = document.getElementById('btn-confirm-nao');
        if (btnNao) btnNao.click();
    }
});

window.sysAlert = function(titulo, texto, tipo = 'info') {
    const modal = document.getElementById('modal-alerta');
    const box = document.getElementById('modal-alerta-box');
    const icone = document.getElementById('alerta-icone');
    const botoes = document.getElementById('alerta-botoes');
    
    if(!modal) return alert(titulo + ": " + texto);

    document.getElementById('alerta-titulo').innerText = titulo;
    document.getElementById('alerta-texto').innerText = texto;
    
    if(tipo === 'erro') { 
        icone.className = "w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner border border-red-100"; 
        icone.innerHTML = "⚠️"; 
        botoes.innerHTML = `<button onclick="window.fecharAlerta()" class="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-black uppercase text-xs active:bg-slate-200 transition-colors">Voltar</button>`; 
    } 
    else if (tipo === 'sucesso') { 
        icone.className = "w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner border border-emerald-100"; 
        icone.innerHTML = "✅"; 
        botoes.innerHTML = `<button onclick="window.fecharAlerta()" class="w-full bg-emerald-500 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all">OK</button>`; 
    } 
    else { 
        icone.className = "w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner border border-blue-100"; 
        icone.innerHTML = "ℹ️"; 
        botoes.innerHTML = `<button onclick="window.fecharAlerta()" class="w-full bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all">Entendi</button>`; 
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.zIndex = '99999';
    box.classList.remove('scale-95');
}

window.fecharAlerta = function() { 
    const modal = document.getElementById('modal-alerta');
    const box = document.getElementById('modal-alerta-box');
    if(modal) {
        modal.style.opacity = '0';
        box.classList.add('scale-95'); 
        setTimeout(() => { modal.classList.add('hidden'); modal.style.display = 'none'; }, 200); 
    }
}

window.sysConfirm = function(titulo, texto) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmacao');
        const box = document.getElementById('modal-confirmacao-box');
        
        if(!modal) return resolve(confirm(titulo + "\n" + texto));

        document.getElementById('confirm-titulo').innerText = titulo; 
        document.getElementById('confirm-texto').innerText = texto;
        
        modal.classList.remove('hidden'); 
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.zIndex = '99998';
        box.classList.remove('scale-95');

        const fechar = (resultado) => { 
            modal.style.opacity = '0'; 
            box.classList.add('scale-95'); 
            setTimeout(() => { modal.classList.add('hidden'); modal.style.display = 'none'; resolve(resultado); }, 200); 
        };
        
        document.getElementById('btn-confirm-sim').onclick = () => fechar(true); 
        document.getElementById('btn-confirm-nao').onclick = () => fechar(false);
    });
}

/* =============================================================
   ESTADO GLOBAL E INICIALIZAÇÃO
   ============================================================= */
let PRODUTOS_CACHE = [], PEDIDOS_LISTA = [], LISTA_ING = [], LISTA_ADD = [], LISTA_SAB = [], ID_EDICAO = null; 
let CHART_SEMANA = null;
let IMAGENS_TEMP_PROD = [];
let NOME_LOJA = 'MY-DELIVERY';

window.onload = async () => {
    const userJson = localStorage.getItem('usuarioLogado'); 
    if (!userJson) { window.location.href = 'login.html'; return; }
    
    const usuario = JSON.parse(userJson); 
    if (usuario.role !== 'admin') { 
        window.sysAlert('Acesso Negado', 'Área exclusiva.', 'erro'); 
        setTimeout(() => window.location.href = 'cozinha.html', 2000); 
        return; 
    }
    
    document.getElementById('header-usuario').innerText = "OLÁ, " + usuario.nome.toUpperCase();
    const hoje = new Date().toISOString().split('T')[0];
    if(document.getElementById('data-inicio-rel')) document.getElementById('data-inicio-rel').value = hoje;
    if(document.getElementById('data-fim-rel')) document.getElementById('data-fim-rel').value = hoje;
    
    await Promise.all([window.carregarCatalogo(), window.carregarListasInsumos(), window.carregarStatusLoja()]);
};

/* =============================================================
   MÓDULO: STATUS DA LOJA (ABERTA/FECHADA)
   ============================================================= */
window.carregarStatusLoja = async function() {
    const { data } = await _supabase.from('configuracoes').select('loja_aberta, nome_loja').eq('id', 1).single();
    if(data) {
        window.atualizarUIStatusLoja(data.loja_aberta);
        if(data.nome_loja) NOME_LOJA = data.nome_loja.toUpperCase();
    }
}

window.atualizarUIStatusLoja = function(aberta) {
    const txt = document.getElementById('txt-status-loja'), bg = document.getElementById('bg-toggle-loja'), bolinha = document.getElementById('bolinha-toggle-loja'), chk = document.getElementById('chk-loja');
    if(!chk) return;
    chk.checked = aberta;
    if(aberta) {
        txt.innerText = 'ABERTA'; txt.className = "text-[8px] font-black text-emerald-200 uppercase tracking-widest mb-1";
        bg.classList.replace('bg-slate-400', 'bg-emerald-500'); bolinha.classList.add('translate-x-4');
    } else {
        txt.innerText = 'FECHADA'; txt.className = "text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1";
        bg.classList.replace('bg-emerald-500', 'bg-slate-400'); bolinha.classList.remove('translate-x-4');
    }
}

window.toggleLoja = async function() {
    const aberta = document.getElementById('chk-loja').checked;
    window.atualizarUIStatusLoja(aberta);
    await _supabase.from('configuracoes').update({ loja_aberta: aberta }).eq('id', 1);
    await window.registrarAuditoria("STATUS LOJA", `Alterou status da loja para: ${aberta ? 'ABERTA' : 'FECHADA'}`);
    window.sysAlert('Status da Loja', `A loja agora está ${aberta ? 'ABERTA' : 'FECHADA'} no aplicativo do cliente.`, 'sucesso');
}

/* NAVEGAÇÃO INTERNA */
window.abrirSubSecao = function(s) { 
    document.getElementById('admin-menu-principal').classList.add('hidden'); 
    document.querySelectorAll('[id^="secao-"]').forEach(el => el.classList.add('hidden')); 
    document.getElementById(`secao-${s}`).classList.remove('hidden'); 
    if (s === 'produtos') window.alternarAbas('lista'); 
    if (s === 'relatorios') window.carregarDashboard(); 
    if (s === 'estorno') window.carregarHistoricoEstorno(); 
    if (s === 'configuracoes') window.voltarMenuConfig(); 
    if (s === 'auditoria') window.carregarAuditoria(); 
}

window.voltarAoMenuAdmin = function() { 
    document.querySelectorAll('[id^="secao-"]').forEach(el => el.classList.add('hidden')); 
    document.getElementById('admin-menu-principal').classList.remove('hidden'); 
}

window.abrirConfigEspecifica = async function(tipo) { 
    document.getElementById('menu-config-cards').classList.add('hidden'); 
    document.querySelectorAll('[id^="view-cfg-"]').forEach(el => el.classList.add('hidden')); 
    document.getElementById(`view-cfg-${tipo}`).classList.remove('hidden'); 
    
    if (tipo === 'insumos' || tipo === 'sabores') window.carregarListasInsumos(); 
    if (tipo === 'usuarios') window.carregarUsuariosSistema(); 
    if (tipo === 'auditoria') window.carregarAuditoria();
    if (tipo === 'taxas') window.carregarTaxasEntrega();
    if (tipo === 'clientes') window.carregarClientesPainel(); 
    if (tipo === 'loja') {
        const { data } = await _supabase.from('configuracoes').select('*').eq('id', 1).single();
        if (data) {
            if (data.banner_url) document.getElementById('preview-banner-loja').innerHTML = `<img src="${data.banner_url}" class="w-full h-full object-cover">`;
            if (document.getElementById('cfg-nome-loja')) document.getElementById('cfg-nome-loja').value = data.nome_loja || '';
            if (document.getElementById('cfg-tel-loja')) document.getElementById('cfg-tel-loja').value = data.telefone_loja || '';
        }
    }
}

// NOVA FUNÇÃO PARA SALVAR OS DADOS DA LOJA
window.salvarDadosLoja = async function() {
    const nome = document.getElementById('cfg-nome-loja').value.trim();
    const tel = document.getElementById('cfg-tel-loja').value.trim();
    
    await _supabase.from('configuracoes').update({ nome_loja: nome, telefone_loja: tel }).eq('id', 1);
    
    NOME_LOJA = nome || 'MY-DELIVERY'; // Atualiza imediatamente na memória
    await window.registrarAuditoria("CONFIGURAÇÃO", "Alterou os dados cadastrais da loja");
    window.sysAlert('Sucesso!', 'Os dados da loja foram atualizados com sucesso.', 'sucesso');
}

window.voltarMenuConfig = function() { 
    document.querySelectorAll('[id^="view-cfg-"]').forEach(el => el.classList.add('hidden')); 
    document.getElementById('menu-config-cards').classList.remove('hidden'); 
}

/* =============================================================
   MÓDULO: PRODUTOS E CARDÁPIO
   ============================================================= */
window.carregarCatalogo = async function() {
    const { data } = await _supabase.from('produtos').select('*').order('nome');
    PRODUTOS_CACHE = data || [];
    document.getElementById('lista-catalogo').innerHTML = PRODUTOS_CACHE.map(p => `
        <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between mb-2">
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 border shrink-0 overflow-hidden">
                    ${p.foto ? `<img src="${p.foto}" class="w-full h-full object-cover">` : '<span class="flex items-center justify-center h-full text-xl">🍔</span>'}
                </div>
                <div class="min-w-0">
                    <h4 class="font-black text-xs uppercase text-slate-700 truncate">${p.nome}</h4>
                    <p class="text-[10px] font-bold text-red-500">R$ ${parseFloat(p.preco).toFixed(2)}</p>
                    ${!p.ativo ? '<span class="text-[8px] bg-slate-200 px-2 rounded text-slate-500 font-bold uppercase">Inativo</span>' : ''}
                </div>
            </div>
            <div class="flex gap-2 shrink-0">
                <div onclick="window.toggleAtivo(${p.id}, ${p.ativo})" class="w-10 h-8 rounded-xl flex items-center justify-center cursor-pointer border transition-all ${p.ativo ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'bg-slate-100 border-slate-200 text-slate-400'}"><i class="ph-bold ${p.ativo ? 'ph-toggle-right' : 'ph-toggle-left'} text-xl"></i></div>
                <button onclick="window.prepararEdicao(${p.id})" class="w-8 h-8 rounded-xl border border-blue-100 text-blue-400 flex items-center justify-center hover:bg-blue-50 transition-colors"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                <button onclick="window.excluirProduto(${p.id})" class="w-8 h-8 rounded-xl border border-red-100 text-red-400 flex items-center justify-center hover:bg-red-50 transition-colors"><i class="ph-bold ph-trash text-lg"></i></button>
            </div>
        </div>`).join('');
}

window.toggleAtivo = async function(id, status) { 
    const p = PRODUTOS_CACHE.find(x => x.id === id);
    await _supabase.from('produtos').update({ ativo: !status }).eq('id', id); 
    await window.registrarAuditoria("STATUS PRODUTO", `Alterou visibilidade de ${p ? p.nome : id} para ${!status ? 'ATIVO' : 'INATIVO'}`);
    await window.carregarCatalogo(); 
}

window.excluirProduto = async function(id) { 
    const p = PRODUTOS_CACHE.find(x => x.id === id);
    if(await window.sysConfirm('Excluir Produto', 'Certeza que deseja excluir este produto permanentemente?')) { 
        await _supabase.from('produtos').delete().eq('id', id); 
        await window.registrarAuditoria("EXCLUSÃO PRODUTO", `Removeu permanentemente o produto: ${p ? p.nome : id}`);
        await window.carregarCatalogo(); 
    } 
}

window.salvarProduto = async function() {
    const nome = document.getElementById('p-nome').value.trim().toUpperCase();
    const preco = window.convMoedaFloat(document.getElementById('p-preco').value);
    
    if (!nome || preco <= 0) return window.sysAlert('Erro', 'Preencha o Nome e o Preço.', 'erro');
    
    const capaAtual = IMAGENS_TEMP_PROD.find(i => i.isCapa);
    const fotoFinal = capaAtual ? capaAtual.url : '';
    const galeriaFinal = IMAGENS_TEMP_PROD.filter(i => !i.isCapa).map(i => i.url);

    const dados = { 
        nome, 
        preco, 
        categoria: document.getElementById('p-categoria').value, 
        descricao: document.getElementById('p-desc').value, 
        sabores: Array.from(document.querySelectorAll('.chk-sab:checked')).map(el => el.value).join(', '), 
        ingredientes: Array.from(document.querySelectorAll('.chk-ing:checked')).map(el => el.value).join(', '), 
        adicionais: Array.from(document.querySelectorAll('.chk-add:checked')).map(el => el.value).join(', '), 
        foto: fotoFinal,
        galeria: galeriaFinal,
        ativo: true 
    };
    
    if (ID_EDICAO) {
        await _supabase.from('produtos').update(dados).eq('id', ID_EDICAO);
        await window.registrarAuditoria("EDIÇÃO PRODUTO", `Alterou dados do produto: ${nome}`);
    } else {
        await _supabase.from('produtos').insert([dados]);
        await window.registrarAuditoria("CRIAÇÃO PRODUTO", `Cadastrou o novo produto: ${nome}`);
    }
    
    ID_EDICAO = null; 
    window.limparCamposProduto(); 
    await window.carregarCatalogo(); 
    window.alternarAbas('lista'); 
    window.sysAlert('Sucesso', 'Produto salvo com sucesso!', 'sucesso');
}

window.prepararEdicao = function(id) { 
    const p = PRODUTOS_CACHE.find(x => x.id === id); 
    ID_EDICAO = id; 
    document.getElementById('p-nome').value = p.nome; 
    document.getElementById('p-preco').value = p.preco.toFixed(2).replace('.', ','); 
    document.getElementById('p-categoria').value = p.categoria; 
    document.getElementById('p-desc').value = p.descricao; 

    IMAGENS_TEMP_PROD = [];
    if(p.foto) IMAGENS_TEMP_PROD.push({ url: p.foto, isCapa: true });
    
    if(p.galeria) {
        const fotosExtra = typeof p.galeria === 'string' ? JSON.parse(p.galeria) : p.galeria;
        if(Array.isArray(fotosExtra)) {
            fotosExtra.forEach(url => IMAGENS_TEMP_PROD.push({ url: url, isCapa: false }));
        }
    }
    window.renderPreviewImagensProd();

    window.alternarAbas('cadastro'); 
}

window.alternarAbas = function(a) { 
    document.getElementById('aba-lista').classList.toggle('hidden', a !== 'lista'); 
    document.getElementById('aba-cadastro').classList.toggle('hidden', a !== 'cadastro'); 
    
    const btnLista = document.getElementById('btn-aba-lista'), btnCad = document.getElementById('btn-aba-cadastro');
    if (a === 'lista') {
        btnLista.className = "flex-1 py-3 rounded-[1.2rem] bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest shadow-md transition-all";
        btnCad.className = "flex-1 py-3 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-all";
    } else {
        btnCad.className = "flex-1 py-3 rounded-[1.2rem] bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest shadow-md transition-all";
        btnLista.className = "flex-1 py-3 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-600 transition-all";
    }
    if (a !== 'cadastro') window.limparCamposProduto(); 
    else window.renderOpcoesCheckboxes(ID_EDICAO ? PRODUTOS_CACHE.find(p => p.id === ID_EDICAO) : null); 
}

window.renderOpcoesCheckboxes = function(prod = null) {
    const sab = prod ? (prod.sabores||'').split(',').map(s=>s.trim()) : []; const ing = prod ? (prod.ingredientes||'').split(',').map(s=>s.trim()) : []; const add = prod ? (prod.adicionais||'').split(',').map(s=>s.split(':')[0].trim()) : [];
    document.getElementById('select-sabores').innerHTML = LISTA_SAB.map(i => `<label class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100 text-[10px] font-bold uppercase cursor-pointer"><input type="checkbox" value="${i.nome}" class="chk-sab accent-blue-500 w-4 h-4" ${sab.includes(i.nome)?'checked':''}>${i.nome}</label>`).join('');
    document.getElementById('select-ingredientes').innerHTML = LISTA_ING.map(i => `<label class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-orange-100 text-[10px] font-bold uppercase cursor-pointer"><input type="checkbox" value="${i.nome}" class="chk-ing accent-orange-500 w-4 h-4" ${ing.includes(i.nome)?'checked':''}>${i.nome}</label>`).join('');
    document.getElementById('select-adicionais').innerHTML = LISTA_ADD.map(i => `<label class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-100 text-[10px] font-bold uppercase cursor-pointer"><input type="checkbox" value="${i.nome}:${i.preco.toFixed(2)}" class="chk-add accent-emerald-500 w-4 h-4" ${add.includes(i.nome)?'checked':''}>${i.nome}</label>`).join('');
}

/* =============================================================
   MÓDULO: INSUMOS (SABORES, EXTRAS)
   ============================================================= */
window.carregarListasInsumos = async function() {
    const [ri, ra, rs] = await Promise.all([ _supabase.from('ingredientes_lista').select('*').order('nome'), _supabase.from('adicionais_lista').select('*').order('nome'), _supabase.from('sabores_lista').select('*').order('nome') ]);
    LISTA_ING = ri.data || []; LISTA_ADD = ra.data || []; LISTA_SAB = rs.data || [];
    document.getElementById('lista-sab-sistema').innerHTML = LISTA_SAB.map(i => `<div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 ${!i.ativo ? 'opacity-50 grayscale' : ''}"><span class="text-xs font-black uppercase text-blue-600">${i.nome}</span><div class="flex gap-3 items-center"><div onclick="window.toggleAtivoSabor(${i.id}, ${i.ativo})" class="w-10 h-6 rounded-full relative cursor-pointer ${i.ativo ? 'bg-blue-500' : 'bg-slate-300'}"><div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${i.ativo ? 'right-1' : 'left-1'}"></div></div><button onclick="window.editarInsumo('sab', ${i.id}, '${i.nome}')" class="text-blue-400 hover:text-blue-600"><i class="ph-bold ph-pencil-simple text-lg"></i></button><button onclick="window.excluirInsumo('sab', ${i.id})" class="text-red-400 hover:text-red-600"><i class="ph-bold ph-trash text-lg"></i></button></div></div>`).join('');
    document.getElementById('lista-ing-sistema').innerHTML = LISTA_ING.map(i => `<div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"><span class="text-xs font-black uppercase text-slate-600">${i.nome}</span><div class="flex gap-3"><button onclick="window.editarInsumo('ing', ${i.id}, '${i.nome}')" class="text-orange-400 hover:text-orange-600"><i class="ph-bold ph-pencil-simple text-lg"></i></button><button onclick="window.excluirInsumo('ing', ${i.id})" class="text-red-400 hover:text-red-600"><i class="ph-bold ph-trash text-lg"></i></button></div></div>`).join('');
    document.getElementById('lista-add-sistema').innerHTML = LISTA_ADD.map(i => `<div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"><div><span class="text-xs font-black uppercase text-slate-600 block">${i.nome}</span><span class="text-[10px] text-emerald-500 font-bold">R$ ${i.preco.toFixed(2)}</span></div><div class="flex gap-3"><button onclick="window.editarInsumo('add', ${i.id}, '${i.nome}', ${i.preco})" class="text-emerald-400 hover:text-emerald-600"><i class="ph-bold ph-pencil-simple text-lg"></i></button><button onclick="window.excluirInsumo('add', ${i.id})" class="text-red-400 hover:text-red-600"><i class="ph-bold ph-trash text-lg"></i></button></div></div>`).join('');
}

window.toggleAtivoSabor = async function(id, status) { await _supabase.from('sabores_lista').update({ ativo: !status }).eq('id', id); window.carregarListasInsumos(); }
window.editarInsumo = function(t, id, n, p=0) { if(t==='ing'){ document.getElementById('new-ing-name').value=n; document.getElementById('edit-ing-id').value=id; document.getElementById('btn-salvar-ing').innerHTML='<i class="ph-bold ph-check"></i>'; } else if(t==='add') { document.getElementById('new-add-name').value=n; document.getElementById('new-add-price').value=p.toFixed(2).replace('.',','); document.getElementById('edit-add-id').value=id; document.getElementById('btn-salvar-add').innerHTML='<i class="ph-bold ph-check"></i>'; } else { document.getElementById('new-sab-name').value=n; document.getElementById('edit-sab-id').value=id; document.getElementById('btn-salvar-sab').innerHTML='<i class="ph-bold ph-check"></i>'; } }

window.salvarInsumo = async function(t) {
    let nome, id, tabela;
    if(t==='ing'){ nome=document.getElementById('new-ing-name').value.trim().toUpperCase(); id=document.getElementById('edit-ing-id').value; tabela='ingredientes_lista'; }
    else if (t==='add') { nome=document.getElementById('new-add-name').value.trim().toUpperCase(); const p=window.convMoedaFloat(document.getElementById('new-add-price').value); id=document.getElementById('edit-add-id').value; tabela='adicionais_lista'; if(!nome || p<=0) return; if(id) await _supabase.from(tabela).update({nome, preco:p}).eq('id',id); else await _supabase.from(tabela).insert([{nome, preco:p}]); }
    else { nome=document.getElementById('new-sab-name').value.trim().toUpperCase(); id=document.getElementById('edit-sab-id').value; tabela='sabores_lista'; }
    
    if(t !== 'add') {
        if(!nome) return;
        if(id) await _supabase.from(tabela).update({nome}).eq('id',id); else await _supabase.from(tabela).insert([{nome}]);
    }

    await window.registrarAuditoria("GESTÃO INSUMO", `${id ? 'Editou' : 'Criou'} o item ${nome} em ${tabela}`);
    document.getElementById(`new-${t}-name`).value=''; if(t==='add') document.getElementById('new-add-price').value=''; document.getElementById(`edit-${t}-id`).value=''; document.getElementById(`btn-salvar-${t}`).innerHTML='+';
    window.carregarListasInsumos();
}

window.excluirInsumo = async function(t, id) { 
    if(await window.sysConfirm('Excluir Item', 'Tem certeza que deseja remover este item?')) { 
        const table = t==='ing'?'ingredientes_lista':(t==='add'?'adicionais_lista':'sabores_lista'); 
        await _supabase.from(table).delete().eq('id',id); 
        await window.registrarAuditoria("EXCLUSÃO INSUMO", `Removeu permanentemente um item da tabela ${table} (ID: ${id})`);
        window.carregarListasInsumos(); 
    } 
}

/* =============================================================
   MÓDULO: CONFIGURAÇÕES E USUÁRIOS
   ============================================================= */
window.carregarUsuariosSistema = async function() {
    const { data } = await _supabase.from('usuarios').select('*').order('usuario');
    const lista = document.getElementById('lista-usuarios-sistema');
    if(!lista) return;

    lista.innerHTML = (data || []).map(u => `
        <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center ${!u.ativo ? 'opacity-50 grayscale' : ''}">
            <div>
                <span class="text-xs font-black uppercase block text-slate-700">${u.usuario}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase">${u.role} ${!u.ativo ? '(INATIVO)' : ''}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="window.toggleStatusUsuario(${u.id}, ${u.ativo})" class="w-8 h-8 rounded-xl border flex items-center justify-center ${u.ativo ? 'text-emerald-500 border-emerald-100' : 'text-slate-400 border-slate-200'}">
                    <i class="ph-bold ${u.ativo ? 'ph-toggle-right' : 'ph-toggle-left'} text-lg"></i>
                </button>
                <button onclick="window.prepararEdicaoUsuario(${JSON.stringify(u).replace(/"/g, '&quot;')})" class="w-8 h-8 rounded-xl border border-blue-100 text-blue-400 flex items-center justify-center">
                    <i class="ph-bold ph-pencil-simple text-lg"></i>
                </button>
                <button onclick="window.excluirUsuario(${u.id})" class="w-8 h-8 rounded-xl border border-red-100 text-red-400 flex items-center justify-center">
                    <i class="ph-bold ph-trash text-lg"></i>
                </button>
            </div>
        </div>
    `).join('');
};

window.salvarUsuario = async function() {
    const u = document.getElementById('novo-user-login').value.trim();
    const s = document.getElementById('novo-user-senha').value;
    const r = document.getElementById('novo-user-role').value;
    const id = document.getElementById('edit-user-id').value;

    if (!u || !s) return window.sysAlert('Erro', 'Preencha login e senha', 'erro');

    const dados = { usuario: u, senha: s, role: r, nome: u };
    
    if (id) {
        await _supabase.from('usuarios').update(dados).eq('id', id);
        await window.registrarAuditoria("GESTÃO USUÁRIO", `Editou o colaborador: ${u} (ID: ${id})`);
    } else {
        await _supabase.from('usuarios').insert([dados]);
        await window.registrarAuditoria("GESTÃO USUÁRIO", `Criou o novo colaborador: ${u} como ${r}`);
    }

    window.limparCamposUsuario();
    window.carregarUsuariosSistema();
    window.sysAlert('Sucesso', 'Usuário salvo com sucesso!', 'sucesso');
};


window.toggleStatusUsuario = async function(id, statusAtual) {
    await _supabase.from('usuarios').update({ ativo: !statusAtual }).eq('id', id);
    await window.registrarAuditoria("STATUS USUÁRIO", `Alterou status do usuário ID: ${id} para ${!statusAtual ? 'ATIVO' : 'INATIVO'}`);
    window.carregarUsuariosSistema();
};

window.excluirUsuario = async function(id) { 
    if(await window.sysConfirm('Excluir Usuário', 'Remover acesso deste usuário permanentemente?')) { 
        await _supabase.from('usuarios').delete().eq('id', id); 
        await window.registrarAuditoria("EXCLUSÃO USUÁRIO", `Removeu permanentemente o acesso do usuário ID: ${id}`);
        window.carregarUsuariosSistema(); 
    } 
};

window.limparCamposUsuario = function() {
    document.getElementById('edit-user-id').value = '';
    document.getElementById('novo-user-login').value = '';
    document.getElementById('novo-user-senha').value = '';
    document.getElementById('novo-user-role').value = 'funcionario';
    
    document.getElementById('btn-salvar-usuario').innerText = "Registrar Acesso";
    document.getElementById('btn-salvar-usuario').className = "w-full bg-green-500 text-white py-4 rounded-xl font-black uppercase active:scale-95 transition-all";
    document.getElementById('titulo-form-usuario').innerText = "Cadastrar Colaborador";
};

window.prepararEdicaoUsuario = function(u) {
    document.getElementById('edit-user-id').value = u.id;
    document.getElementById('novo-user-login').value = u.usuario;
    document.getElementById('novo-user-senha').value = u.senha;
    document.getElementById('novo-user-role').value = u.role;
    
    document.getElementById('btn-salvar-usuario').innerText = "Atualizar Cadastro";
    document.getElementById('btn-salvar-usuario').className = "w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase active:scale-95 transition-all";
    document.getElementById('titulo-form-usuario').innerText = "Editando: " + u.usuario;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* =============================================================
   MÓDULO: RELATÓRIOS E DASHBOARD
   ============================================================= */
window.carregarDashboard = async function() { 
    const ctx = document.getElementById('chart-semana'); 
    if(!ctx) return; 

    await window.atualizarCardsDashboard();

    const limitDate = new Date(); 
    limitDate.setDate(limitDate.getDate() - 7); 
    
    const { data } = await _supabase.from('pedidos')
        .select('total, created_at')
        .gte('created_at', limitDate.toISOString())
        .eq('status', 'Entregue'); 

    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']; 
    const valores = new Array(7).fill(0); 
    const labelDias = []; 
    
    for(let i=6; i>=0; i--) { 
        const d = new Date(); 
        d.setDate(new Date().getDate() - i); 
        labelDias.push(dias[d.getDay()]); 
    } 

    if(data) { 
        data.forEach(p => { 
            const d = new Date(p.created_at); 
            const index = labelDias.indexOf(dias[d.getDay()]); 
            if(index > -1) valores[index] += p.total; 
        }); 
    } 

    if(CHART_SEMANA) CHART_SEMANA.destroy(); 

    CHART_SEMANA = new Chart(ctx, { 
        type: 'bar', 
        data: { 
            labels: labelDias, 
            datasets: [{ 
                label: 'Faturamento (R$)', 
                data: valores, 
                backgroundColor: '#e63946', 
                borderRadius: 8,
                borderSkipped: false,
            }] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    displayColors: false,
                    callbacks: { label: (context) => ` R$ ${context.parsed.y.toFixed(2)}` }
                }
            }, 
            scales: { 
                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#e2e8f0' } },
                x: { grid: { display: false } } 
            } 
        } 
    }); 
}

window.atualizarCardsDashboard = async function() {
    const { data } = await _supabase.from('pedidos').select('total, created_at, concluido_at, itens').eq('status', 'Entregue');
    if (!data || data.length === 0) return;

    const pedidosComTempo = data.filter(p => p.concluido_at);
    let mediaTexto = "-- min";
    if (pedidosComTempo.length > 0) {
        const somaTempos = pedidosComTempo.reduce((acc, p) => {
            const inicio = new Date(p.created_at);
            const fim = new Date(p.concluido_at);
            return acc + ((fim - inicio) / (1000 * 60)); 
        }, 0);
        mediaTexto = `${Math.round(somaTempos / pedidosComTempo.length)} min`;
    }
    document.getElementById('txt-tempo-medio').innerText = mediaTexto;

    const faturamento = data.reduce((acc, p) => acc + p.total, 0);
    document.getElementById('txt-total-pedidos').innerText = data.length;
    document.getElementById('txt-faturamento-total').innerText = `R$ ${faturamento.toFixed(2).replace('.', ',')} Faturados`;

    const contagemProdutos = {};
    data.forEach(p => { p.itens.forEach(item => { contagemProdutos[item.nome] = (contagemProdutos[item.nome] || 0) + item.qtd; }); });

    const rankingOrdenado = Object.entries(contagemProdutos)
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 3); 

    const container = document.getElementById('container-ranking');
    if(container) {
        container.innerHTML = rankingOrdenado.map((item, index) => `
            <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="text-[10px] font-black text-slate-300">#${index + 1}</span>
                    <span class="text-[10px] font-black uppercase text-slate-600 truncate">${item.nome}</span>
                </div>
                <span class="text-[10px] font-black text-red-500 shrink-0">${item.qtd}x</span>
            </div>
        `).join('');
    }
}

/* =============================================================
   MÓDULO: BACKUP, IMPRESSÃO E UTILS
   ============================================================= */
window.imprimirRelatorio = function() {
    const tempoMedio = document.getElementById('txt-tempo-medio').innerText;
    const totalPedidos = document.getElementById('txt-total-pedidos').innerText;
    const faturamento = document.getElementById('txt-faturamento-total').innerText;
    const rankingHTML = document.getElementById('container-ranking').innerHTML;
    const dataEmissao = new Date().toLocaleString('pt-BR');

    const html = `<html><head><title>Relatório</title><style>body{font-family:sans-serif;padding:40px;color:#333}.header{text-align:center;border-bottom:2px solid #e63946;margin-bottom:20px}h1{color:#e63946}.card{background:#f8fafc;padding:15px;border-radius:10px;margin-bottom:10px;border:1px solid #eee}</style></head>
    <body><div class="header"><h1>FECHAMENTO MY DELIVERY</h1><p>${dataEmissao}</p></div>
    <div class="card"><b>Faturamento:</b> ${faturamento}</div><div class="card"><b>Pedidos:</b> ${totalPedidos}</div><div class="card"><b>Eficiência:</b> ${tempoMedio}</div>
    <h3>Top Produtos:</h3>${rankingHTML}
    <script>window.onload=function(){window.print();setTimeout(()=>window.close(),500)}<\/script></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

window.fazerBackup = async function() { 
    window.sysAlert('Aguarde', 'Gerando backup...', 'info'); 
    const { data: prods } = await _supabase.from('produtos').select('*'); 
    const { data: peds } = await _supabase.from('pedidos').select('*'); 
    const blob = new Blob([JSON.stringify({ data: new Date(), produtos: prods, pedidos: peds }, null, 2)], {type : 'application/json'}); 
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup_delivery.json'; a.click(); 
    await window.registrarAuditoria("EXPORTAÇÃO DADOS", "Gerou e baixou um arquivo de backup do sistema");
    setTimeout(window.fecharAlerta, 1000); 
}

window.processarBackup = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            if(await window.sysConfirm("Restaurar", "Sobrescrever dados atuais?")) {
                window.sysAlert("Aguarde", "Processando...", "info");
                if (backup.produtos) await _supabase.from('produtos').upsert(backup.produtos);
                if (backup.pedidos) await _supabase.from('pedidos').upsert(backup.pedidos);
                await window.registrarAuditoria("RESTAURAÇÃO BACKUP", "Realizou a restauração completa da base de dados via arquivo JSON");
                window.sysAlert("Sucesso", "Backup restaurado!", "sucesso");
                window.carregarCatalogo();
            }
        } catch (err) { window.sysAlert("Erro", "Arquivo inválido.", "erro"); }
    };
    reader.readAsText(file);
};

window.gerarRelatorioFinanceiro = async function() { 
    const i = document.getElementById('data-inicio-rel').value, f = document.getElementById('data-fim-rel').value; 
    const { data } = await _supabase.from('pedidos').select('total').gte('created_at',i).lte('created_at',f+'T23:59:59').eq('status','Entregue'); 
    const total = (data||[]).reduce((a,b)=>a+b.total,0); 
    document.getElementById('conteudo-rel-financeiro').innerHTML = `<div class="bg-emerald-50 p-6 rounded-[2rem] text-center border border-emerald-100 shadow-sm"><p class="text-[10px] font-black uppercase text-emerald-500 mb-1">Total Faturado</p><h3 class="text-4xl font-black text-emerald-600 italic">R$ ${total.toFixed(2)}</h3></div>`; 
}

/* HISTÓRICO DE VENDAS E ESTORNO (CORRIGIDO BUG DO MAP) */
window.carregarHistoricoEstorno = async function() { 
    const { data } = await _supabase.from('pedidos').select('*').neq('status','Cancelado').order('created_at',{ascending:false}).limit(15); 
    const container = document.getElementById('lista-vendas-estorno') || document.getElementById('lista-vendas-estorno-principal');
    
    if(container) {
        container.innerHTML = (data||[]).map(p => `
        <div class="bg-white p-4 rounded-2xl mb-2 shadow-sm border border-slate-100">
            <div class="flex justify-between items-center mb-3">
                <div>
                    <span class="text-[9px] font-black text-slate-400 block">Pedido #${p.id}</span>
                    <span class="text-xs font-black text-slate-700">${p.cliente_nome}</span>
                </div>
                <span class="text-xs font-black text-emerald-500">R$ ${p.total.toFixed(2)}</span>
            </div>
            
            <div class="flex gap-2">
                <button onclick='window.imprimirPedidoMaster(${JSON.stringify(p)})' class="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-[10px] font-black uppercase border border-blue-100 flex items-center justify-center gap-2">
                    <i class="ph-bold ph-printer"></i> Imprimir
                </button>
                
                <button onclick="window.estornar(${p.id})" class="flex-1 bg-red-50 text-red-500 py-2 rounded-xl text-[10px] font-black uppercase border border-red-100">
                    Estornar
                </button>
            </div>
        </div>`).join('');
    }
}

window.estornar = async function(id) { 
    if(await window.sysConfirm('Estornar', 'Cancelar venda?')) { 
        await _supabase.from('pedidos').update({status:'Cancelado'}).eq('id',id); 
        await window.registrarAuditoria("ESTORNO", `Cancelou/Estornou o pedido #${id}`);
        window.carregarHistoricoEstorno(); 
        window.sysAlert('Sucesso', 'Venda estornada.', 'sucesso'); 
    } 
}

window.salvarConfigTicket = async function() { 
    localStorage.setItem('ticketConfig', JSON.stringify({ width: document.getElementById('ticket-width').value, footer: document.getElementById('ticket-footer').value })); 
    await window.registrarAuditoria("CONFIGURAÇÃO", "Alterou as configurações de impressão do ticket");
    window.sysAlert('Sucesso', 'Salvo.', 'sucesso'); 
}

window.mascaraMoeda = function(e) { let v=e.target.value.replace(/\D/g,""); e.target.value=(parseInt(v||0)/100).toFixed(2).replace(".",","); }
window.convMoedaFloat = function(v) { return parseFloat((v||"0").replace(/\./g,'').replace(',','.'))||0; }

window.mascaraTelefone = function(e) {
    let v = e.target.value.replace(/\D/g, ""); 
    v = v.substring(0, 11); 
    
    if (v.length <= 10) {
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d{5})(\d)/, "$1-$2");
    }
    e.target.value = v;
}

window.limparCamposProduto = function() { 
    document.getElementById('p-nome').value=''; 
    document.getElementById('p-preco').value='0,00'; 
    document.getElementById('p-desc').value=''; 
    if(document.getElementById('p-foto')) document.getElementById('p-foto').value=''; 
    ID_EDICAO=null; 
    
    IMAGENS_TEMP_PROD = [];
    window.renderPreviewImagensProd();
}

window.logout = window.fazerLogout = async function() { 
    if(await window.sysConfirm('Sair', 'Encerrar sessão?')) { localStorage.removeItem('usuarioLogado'); window.location.href = 'login.html'; }
};

/* =============================================================
   MÓDULO: AUDITORIA (LOGS)
   ============================================================= */
window.registrarAuditoria = async function(acao, detalhes) {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const payload = {
        usuario_nome: user ? user.nome.toUpperCase() : "SISTEMA",
        acao: acao.toUpperCase(),
        detalhes: detalhes.toUpperCase(),
        created_at: new Date().toISOString()
    };

    await _supabase.from('auditoria').insert([payload]);
}

window.carregarAuditoria = async function() {
    const { data } = await _supabase.from('auditoria').select('*').order('created_at', { ascending: false }).limit(50);
    const lista = document.getElementById('lista-auditoria');
    if(!lista) return;

    lista.innerHTML = (data || []).map(log => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 text-[10px] font-bold text-slate-500">${new Date(log.created_at).toLocaleString('pt-BR')}</td>
            <td class="p-4 text-[10px] font-black text-slate-700 uppercase">${log.usuario_nome}</td>
            <td class="p-4">
                <span class="text-[9px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-600 uppercase">${log.acao}</span>
                <p class="text-[8px] text-slate-400 font-bold mt-1">${log.detalhes}</p>
            </td>
        </tr>
    `).join('');
}

/* =============================================================
   MÓDULO: TAXAS DE ENTREGA (FRETE)
   ============================================================= */
window.carregarTaxasEntrega = async function() {
    const { data } = await _supabase.from('taxas_entrega').select('*').order('cidade');
    const lista = document.getElementById('lista-taxas-sistema');
    if(!lista) return;

    lista.innerHTML = (data || []).map(t => `
        <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 ${!t.ativo ? 'opacity-50 grayscale' : ''}">
            <div>
                <span class="text-xs font-black uppercase text-slate-600 block">${t.cidade}</span>
                <span class="text-[10px] text-teal-500 font-bold">R$ ${parseFloat(t.taxa).toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="flex gap-3 items-center">
                <div onclick="window.toggleAtivoTaxa(${t.id}, ${t.ativo})" class="w-10 h-6 rounded-full relative cursor-pointer ${t.ativo ? 'bg-teal-500' : 'bg-slate-300'}"><div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${t.ativo ? 'right-1' : 'left-1'}"></div></div>
                <button onclick="window.editarTaxa(${t.id}, '${t.cidade}', ${t.taxa})" class="text-teal-400 hover:text-teal-600"><i class="ph-bold ph-pencil-simple text-lg"></i></button>
                <button onclick="window.excluirTaxa(${t.id})" class="text-red-400 hover:text-red-600"><i class="ph-bold ph-trash text-lg"></i></button>
            </div>
        </div>
    `).join('');
}

window.salvarTaxa = async function() {
    const cidade = document.getElementById('new-taxa-cidade').value.trim().toUpperCase();
    const taxa = window.convMoedaFloat(document.getElementById('new-taxa-valor').value);
    const id = document.getElementById('edit-taxa-id').value;

    if(!cidade) return window.sysAlert('Atenção', 'Digite o nome da cidade.', 'erro');

    if(id) {
        await _supabase.from('taxas_entrega').update({ cidade, taxa }).eq('id', id);
        await window.registrarAuditoria("FRETE", `Editou taxa da cidade: ${cidade} para R$ ${taxa}`);
    } else {
        await _supabase.from('taxas_entrega').insert([{ cidade, taxa }]);
        await window.registrarAuditoria("FRETE", `Adicionou nova taxa para a cidade: ${cidade} de R$ ${taxa}`);
    }

    document.getElementById('new-taxa-cidade').value = '';
    document.getElementById('new-taxa-valor').value = '';
    document.getElementById('edit-taxa-id').value = '';
    document.getElementById('btn-salvar-taxa').innerHTML = '+';
    window.carregarTaxasEntrega();
}

window.editarTaxa = function(id, cidade, taxa) {
    document.getElementById('new-taxa-cidade').value = cidade;
    document.getElementById('new-taxa-valor').value = taxa.toFixed(2).replace('.', ',');
    document.getElementById('edit-taxa-id').value = id;
    document.getElementById('btn-salvar-taxa').innerHTML = '<i class="ph-bold ph-check"></i>';
}

window.excluirTaxa = async function(id) {
    if(await window.sysConfirm('Excluir Taxa', 'Tem certeza que deseja remover esta taxa?')) {
        await _supabase.from('taxas_entrega').delete().eq('id', id);
        await window.registrarAuditoria("FRETE", `Removeu uma cidade da lista de taxas.`);
        window.carregarTaxasEntrega();
    }
}

window.toggleAtivoTaxa = async function(id, status) {
    await _supabase.from('taxas_entrega').update({ ativo: !status }).eq('id', id);
    window.carregarTaxasEntrega();
}

/* =============================================================
   MÓDULO: GESTÃO DE CLIENTES (CRM)
   ============================================================= */
let CLIENTES_CADASTRADOS = [];

window.carregarClientesPainel = async function() {
    const lista = document.getElementById('lista-clientes-tabela');
    if(!lista) return;
    
    lista.innerHTML = `<tr><td colspan="4" class="text-center py-10"><i class="ph-bold ph-spinner animate-spin text-3xl text-slate-300"></i></td></tr>`;

    const { data, error } = await _supabase.from('clientes').select('*').order('created_at', { ascending: false });
    
    if (error) {
        window.sysAlert('Erro', 'Não foi possível carregar os clientes.', 'erro');
        return;
    }

    CLIENTES_CADASTRADOS = data || [];
    
    const badge = document.getElementById('total-clientes-badge');
    if(badge) badge.innerText = `${CLIENTES_CADASTRADOS.length} Clientes`;

    window.renderizarTabelaClientes(CLIENTES_CADASTRADOS);
}

window.renderizarTabelaClientes = function(listaClientes) {
    const lista = document.getElementById('lista-clientes-tabela');
    
    if (listaClientes.length === 0) {
        lista.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-slate-400 uppercase tracking-widest text-[10px]">Nenhum cliente encontrado</td></tr>`;
        return;
    }

    lista.innerHTML = listaClientes.map(c => {
        const dataCad = new Date(c.created_at).toLocaleDateString('pt-BR');
        let telFormatado = c.telefone || '---';
        if(telFormatado.length === 11) telFormatado = `(${telFormatado.slice(0,2)}) ${telFormatado.slice(2,3)} ${telFormatado.slice(3,7)}-${telFormatado.slice(7)}`;
        
        const enderecoResumo = (c.rua && c.num) ? `${c.rua}, ${c.num} - ${c.bairro || ''} <br><span class="text-[9px] text-slate-400">${c.cidade || ''}</span>` : '<span class="text-orange-400 italic">Incompleto</span>';

        return `
            <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td class="py-4 pr-4">
                    <p class="text-slate-800 uppercase font-black">${c.nome}</p>
                </td>
                <td class="py-4 pr-4">
                    <a href="https://wa.me/55${c.telefone}" target="_blank" class="text-emerald-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"><i class="ph-fill ph-whatsapp-logo text-lg"></i> ${telFormatado}</a>
                </td>
                <td class="py-4 pr-4 uppercase text-[10px] leading-tight">
                    ${enderecoResumo}
                </td>
                <td class="py-4 text-center text-[10px] text-slate-400">
                    ${dataCad}
                </td>
            </tr>
        `;
    }).join('');
}

window.filtrarClientesLista = function() {
    const termo = document.getElementById('busca-cliente').value.toLowerCase();
    const filtrados = CLIENTES_CADASTRADOS.filter(c => 
        (c.nome && c.nome.toLowerCase().includes(termo)) || 
        (c.telefone && c.telefone.includes(termo))
    );
    window.renderizarTabelaClientes(filtrados);
}

/* =============================================================
   MÓDULO: GESTÃO DE FICHEIROS E IMAGENS (STORAGE)
   ============================================================= */

let cropperInstance = null;

window.uploadBannerLoja = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imgElement = document.getElementById('image-to-crop');
        imgElement.src = e.target.result;

        const modal = document.getElementById('modal-cropper');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        setTimeout(() => modal.style.opacity = '1', 10);

        if (cropperInstance) cropperInstance.destroy();
        cropperInstance = new Cropper(imgElement, {
            aspectRatio: 16 / 9, 
            viewMode: 1, 
            dragMode: 'move', 
            autoCropArea: 1,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: false, 
            cropBoxResizable: false,
        });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

window.fecharModalCropper = function() {
    const modal = document.getElementById('modal-cropper');
    modal.style.opacity = '0';
    setTimeout(() => { 
        modal.classList.add('hidden'); 
        modal.style.display = 'none'; 
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    }, 200);
}

window.cortarESalvarBanner = async function() {
    if (!cropperInstance) return;

    window.sysAlert('Aguarde...', 'Recortando e enviando o banner para a loja.', 'info');

    cropperInstance.getCroppedCanvas({
        width: 800, 
        height: 450,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    }).toBlob(async (blob) => {
        if (!blob) return window.sysAlert('Erro', 'Falha ao recortar a imagem.', 'erro');

        const fileName = `banner_${Date.now()}.jpg`;
        const filePath = `loja/${fileName}`;

        const { error } = await _supabase.storage.from('imagens').upload(filePath, blob, {
            contentType: 'image/jpeg'
        });

        if (error) {
            window.fecharModalCropper();
            return window.sysAlert('Erro', 'Falha ao enviar a imagem.', 'erro');
        }

        const { data: publicUrlData } = _supabase.storage.from('imagens').getPublicUrl(filePath);
        const bannerUrl = publicUrlData.publicUrl;

        await _supabase.from('configuracoes').update({ banner_url: bannerUrl }).eq('id', 1);
        
        document.getElementById('preview-banner-loja').innerHTML = `<img src="${bannerUrl}" class="w-full h-full object-cover">`;
        
        window.fecharModalCropper();
        window.sysAlert('Sucesso!', 'Seu banner foi recortado e já está na loja!', 'sucesso');
    }, 'image/jpeg', 0.8); 
}

window.uploadImagensProduto = async function(event) {
    const files = event.target.files;
    if(!files || files.length === 0) return;
    
    window.sysAlert('A aguardar...', `A enviar ${files.length} imagem(ns)...`, 'info');

    for(let file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `produtos/${fileName}`;

        const { error } = await _supabase.storage.from('imagens').upload(filePath, file);
        if(error) { console.error("Erro no upload:", error); continue; }

        const { data: publicUrlData } = _supabase.storage.from('imagens').getPublicUrl(filePath);
        
        IMAGENS_TEMP_PROD.push({
            url: publicUrlData.publicUrl,
            isCapa: IMAGENS_TEMP_PROD.length === 0 
        });
    }
    
    window.fecharAlerta();
    window.renderPreviewImagensProd();
}

window.renderPreviewImagensProd = function() {
    const container = document.getElementById('preview-imagens-prod');
    if (IMAGENS_TEMP_PROD.length === 0) {
        container.innerHTML = '<p class="text-[10px] text-slate-400 italic font-bold w-full text-center mt-4">Nenhuma imagem adicionada.</p>';
        return;
    }

    container.innerHTML = IMAGENS_TEMP_PROD.map((img, idx) => `
        <div class="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-4 ${img.isCapa ? 'border-emerald-500 shadow-md' : 'border-slate-200'}">
            <img src="${img.url}" class="w-full h-full object-cover">
            ${img.isCapa ? `<div class="absolute bottom-0 left-0 w-full bg-emerald-500 text-white text-[8px] text-center font-black uppercase py-0.5">CAPA</div>` : ''}
            <div class="absolute top-1 right-1 flex gap-1 bg-black/40 backdrop-blur-sm p-1 rounded-lg">
                ${!img.isCapa ? `<button onclick="window.definirCapaProd(${idx})" class="text-white hover:text-emerald-400 transition-colors" title="Definir como Capa"><i class="ph-fill ph-star"></i></button>` : ''}
                <button onclick="window.removerImagemProd(${idx})" class="text-white hover:text-red-400 transition-colors" title="Remover"><i class="ph-bold ph-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.definirCapaProd = function(idx) {
    IMAGENS_TEMP_PROD.forEach((img, i) => img.isCapa = (i === idx));
    window.renderPreviewImagensProd();
}

window.removerImagemProd = function(idx) {
    IMAGENS_TEMP_PROD.splice(idx, 1);
    if(IMAGENS_TEMP_PROD.length > 0 && !IMAGENS_TEMP_PROD.some(i => i.isCapa)) IMAGENS_TEMP_PROD[0].isCapa = true;
    window.renderPreviewImagensProd();
}

/* =============================================================
   MÓDULO: IMPRESSÃO DE PEDIDOS
   ============================================================= */
window.imprimirPedidoMaster = async function(pedidoOuId) {
    let pedido;
    if (typeof pedidoOuId === 'string' || typeof pedidoOuId === 'number') {
        pedido = PEDIDOS_LISTA.find(p => p.id == pedidoOuId);
    } else { pedido = pedidoOuId; }

    if (!pedido) return alert("Erro: Pedido não encontrado.");

    const removerAcentos = (str) => {
        if (!str) return "";
        const mapa = {'á':'a','à':'a','â':'a','ã':'a','ä':'a','Á':'A','À':'A','Â':'A','Ã':'A','Ä':'A','é':'e','è':'e','ê':'e','ë':'e','É':'E','È':'E','Ê':'E','Ë':'E','í':'i','ì':'i','î':'i','ï':'i','Í':'I','Ì':'I','Î':'I','Ï':'I','ó':'o','ò':'o','ô':'o','õ':'o','ö':'o','Ó':'O','Ò':'O','Ô':'O','Õ':'O','Ö':'O','ú':'u','ù':'u','û':'u','ü':'u','Ú':'U','Ù':'U','Û':'U','Ü':'U','ç':'c','Ç':'C','ñ':'n','Ñ':'N'};
        let s = str.toString();
        Object.keys(mapa).forEach(k => s = s.replace(new RegExp(k, 'g'), mapa[k]));
        return s.toUpperCase();
    };

    const COLUNAS = 32; 

    // Função de quebra de linha que respeita o limite de colunas
    const quebrarTexto = (texto, limite, recuo = 0) => {
        let palavras = removerAcentos(texto).split(' ');
        let linhas = [];
        let linhaAtual = '';
        let espacoRecuo = " ".repeat(recuo);

        palavras.forEach(palavra => {
            if ((linhaAtual + palavra).length <= limite) {
                linhaAtual += (linhaAtual === '' ? '' : ' ') + palavra;
            } else {
                linhas.push(linhaAtual);
                linhaAtual = palavra;
            }
        });
        linhas.push(linhaAtual);
        return linhas.join('\n' + espacoRecuo);
    };

    const centralizar = (texto) => {
        let t = removerAcentos(texto);
        let espacos = Math.max(0, Math.floor((COLUNAS - t.length) / 2));
        return " ".repeat(espacos) + t;
    };

    const formatarLinhaDupla = (esq, dir) => {
        let textoEsq = removerAcentos(esq).substring(0, COLUNAS - dir.length - 1);
        let espacos = COLUNAS - (textoEsq.length + dir.length);
        return textoEsq + " ".repeat(Math.max(1, espacos)) + dir;
    };

    const divisor = "-".repeat(COLUNAS);

    // --- DADOS DA LOJA ---
    let nomeLoja = "MY DELIVERY";
    let telLoja = "";
    try {
        const { data: cfg } = await _supabase.from('configuracoes').select('nome_loja, telefone_loja').eq('id', 1).single();
        if (cfg) {
            nomeLoja = cfg.nome_loja || nomeLoja;
            telLoja = cfg.telefone_lo_formatado || cfg.telefone_loja || "";
        }
    } catch(e) {}

    // --- MONTAGEM DO CORPO DO TEXTO ---
    let txt = "";
    txt += `${centralizar(nomeLoja)}\n`;
    if (telLoja) txt += `${centralizar("TEL: " + telLoja)}\n`;
    txt += `${centralizar("PEDIDO #" + pedido.id)}\n`;
    txt += `${divisor}\n`;
    
    txt += `DATA: ${new Date(pedido.created_at).toLocaleString('pt-BR')}\n`;
    txt += `CLIENTE: ${quebrarTexto(pedido.cliente_nome || 'NÃO INFORMADO', 23, 9)}\n`;
    
    // Endereço com tratamento especial: Rua em cima, Cidade embaixo
    let partesEnd = (pedido.endereco || 'RETIRADA').split('|');
    let rua = partesEnd[0].trim();
    let cidade = partesEnd[1] ? partesEnd[1].trim() : "";

    txt += `END.: ${quebrarTexto(rua, 26, 6)}\n`;
    if (cidade) txt += `${quebrarTexto(cidade, COLUNAS)}\n`;
    
    txt += `PAGTO: ${removerAcentos(pedido.forma_pagamento || 'A COMBINAR')}\n`;
    txt += `${divisor}\n`;
    txt += `ITENS DO PEDIDO:\n\n`;

    pedido.itens.forEach(i => {
        let nomeItem = `${i.qtd}X ${i.nome}`;
        let precoTotalItem = `R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`;
        txt += formatarLinhaDupla(nomeItem, precoTotalItem) + "\n";
        
        // Regra do SABOR (Obrigatório/Principal)
        if (i.sabor) {
            txt += `  SABOR: ${quebrarTexto(i.sabor, 23, 9)}\n`;
        }

        // Regra da OBSERVAÇÃO (Adicionais, Removidos ou Detalhes)
        let obsTexto = "";
        let complementos = [];
        if (i.adicionais?.length) complementos.push("ADD: " + i.adicionais.map(a => a.nome).join(', '));
        if (i.removidos?.length) complementos.push("SEM: " + i.removidos.join(', '));
        if (i.detalhes) complementos.push(i.detalhes);

        if (complementos.length > 0) {
            obsTexto = complementos.join(' | ');
            txt += `  OBS: ${quebrarTexto(obsTexto, 25, 7)}\n`;
        }
        txt += `\n`; // Espaço entre produtos
    });

    txt += `${divisor}\n`;
    txt += formatarLinhaDupla("TOTAL:", `R$ ${parseFloat(pedido.total).toFixed(2).replace('.', ',')}`) + "\n";
    txt += `${divisor}\n\n`;
    txt += `${centralizar("OBRIGADO PELA PREFERENCIA!")}\n\n\n`;

    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
        const base64 = btoa(unescape(encodeURIComponent(txt)));
        window.location.href = "rawbt:base64," + base64;
    } else {
        const area = document.getElementById('area-impressao-termica');
        if (area) {
            // No PC usamos BOLD máximo para que a térmica queime o papel com mais força
            area.innerHTML = `<pre style="font-family:monospace; font-size:12px; font-weight:900; color:black; line-height:1.2;">${txt}</pre>`;
            area.style.display = 'block';
            window.print();
            setTimeout(() => { area.style.display = 'none'; }, 500);
        }
    }
}
