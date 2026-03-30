// --- 1. PROTEÇÃO DE ROTA (Auth Guard) ---
// Isso roda IMEDIATAMENTE. Se não houver login, bloqueia a página.
(function() {
    const logado = localStorage.getItem('usuarioLogado');
    if (!logado) {
        window.location.href = 'login.html';
    }
})();

// --- 2. MONITOR DE INATIVIDADE (15 Minutos) ---
let timerInatividade;

function resetarTimer() {
    clearTimeout(timerInatividade);
    // 15 minutos = 15 * 60 * 1000 milissegundos
    timerInatividade = setTimeout(() => {
        window.fazerLogoutSilencioso();
    }, 15 * 60 * 1000); 
}

window.fazerLogoutSilencioso = function() {
    localStorage.removeItem('usuarioLogado');
    // Redireciona com um aviso na URL para o login saber o que houve
    window.location.href = 'login.html?motivo=inatividade';
};

// Reinicia o cronômetro sempre que o usuário interagir com a tela
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evento => {
    document.addEventListener(evento, resetarTimer, true);
});

// Começa a contar assim que a página carrega
resetarTimer();
