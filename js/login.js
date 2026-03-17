document.getElementById('formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.querySelector('input[type="email"]').value;
    
    if(email) {
        localStorage.setItem('usuarioLogado', 'true');
        // MUDANÇA AQUI: Redireciona para o novo nome
        window.location.href = 'gerenciar-cardapio.html';
    }
});