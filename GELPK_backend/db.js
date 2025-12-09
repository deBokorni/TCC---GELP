// Arquivo: gelp-backend/db.js

// 1. Importa as bibliotecas necessárias
// - 'mysql2/promise': Permite usar 'async/await' com o MySQL, o que torna o código mais limpo.
// - 'dotenv': Carrega as variáveis do seu arquivo .env para que possamos usá-las aqui.
const mysql = require('mysql2/promise');
require('dotenv').config();

// 2. Cria o Pool de Conexões
// Um "pool" gerencia múltiplas conexões. Quando você precisa falar com o banco,
// ele te "empresta" uma conexão disponível em vez de criar uma nova, o que é muito mais rápido.
const pool = mysql.createPool({
    host: process.env.DB_HOST,          // Pega o host do arquivo .env (ex: 'localhost')
    user: process.env.DB_USER,          // Pega o usuário do arquivo .env (ex: 'root')
    password: process.env.DB_PASSWORD,  // Pega a senha do arquivo .env
    database: process.env.DB_NAME,      // Pega o nome do banco de dados do arquivo .env (ex: 'gelp_db')
    waitForConnections: true,           // Se todas as conexões estiverem em uso, espera por uma livre
    connectionLimit: 10,                // Número máximo de conexões no pool
    queueLimit: 0                       // Fila de espera ilimitada
});

// 3. Função para Testar a Conexão
// Esta função tenta pegar uma conexão do pool para verificar se as credenciais estão corretas.
// Vamos chamá-la quando o servidor iniciar para ter certeza de que tudo está funcionando.
async function testConnection() {
    try {
        // Pega uma conexão do pool
        const connection = await pool.getConnection();
        console.log('✅ Conexão com o banco de dados MySQL estabelecida com sucesso!');
        // Devolve a conexão para o pool para que outros possam usá-la
        connection.release();
    } catch (error) {
        // Se der erro, exibe uma mensagem clara no console
        console.error('❌ Erro ao conectar com o banco de dados:', error.message);
        console.error('Dica: Verifique se o serviço do MySQL está rodando e se as credenciais no arquivo .env estão corretas.');
    }
}

// 4. Exporta o Pool
// Exportamos o 'pool' para que outros arquivos da nossa aplicação (como o server.js)
// possam usá-lo para fazer consultas (SELECT, INSERT, UPDATE, etc.) no banco de dados.
module.exports = {
    pool,
    testConnection
};
