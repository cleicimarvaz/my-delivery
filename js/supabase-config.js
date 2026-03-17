// =========================================================
// CONFIGURAÇÃO DO SUPABASE
// =========================================================

// 1. URL do Projeto
const SUPABASE_URL = 'https://ulffadjykwaytvpgonhk.supabase.co'; 

// 2. CHAVE PÚBLICA (ANON KEY)
// Se der erro, verifique se esta chave começa com 'ey...'
const SUPABASE_KEY = 'sb_publishable_Fux6G2GJ2WXCbxkW1UXOJQ_Eh588nIG';

// 3. Inicializa o cliente
// Mudamos o nome da variável para '_supabase' para evitar conflito com a biblioteca
let _supabase = null;

// Verifica se a biblioteca foi carregada antes de tentar criar o cliente
if (typeof supabase !== 'undefined') {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase conectado com sucesso!");
} else {
    console.error("ERRO CRÍTICO: A biblioteca do Supabase não foi carregada no HTML. Verifique se o script do CDN está presente.");
}

// 4. URLs Base para Imagens
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/fotos-produtos`;