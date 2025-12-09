// Arquivo: gelp-backend/server.js (VERSÃO REALMENTE COMPLETA E CORRIGIDA)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de Teste
app.get('/', (req, res) => {
    res.send('✅ API completa e corrigida do GELP está funcionando!');
});

/* 
=============================================
ROTAS PARA CATEGORIES (CLAD COMPLETO)
============================================= 
*/
app.get('/api/categories', async (req, res) => {
    const [rows] = await db.pool.execute('SELECT * FROM categories ORDER BY name');
    res.json(rows);
});
app.post('/api/categories', async (req, res) => {
    const { name, description } = req.body;
    const [result] = await db.pool.execute('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || null]);
    res.status(201).json({ id: result.insertId, name, description });
});
app.get('/api/categories/:id', async (req, res) => {
    const [rows] = await db.pool.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Categoria não encontrada' });
    res.json(rows[0]);
});
app.put('/api/categories/:id', async (req, res) => {
    const { name, description } = req.body;
    const [result] = await db.pool.execute('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Categoria não encontrada' });
    res.json({ id: Number(req.params.id), name, description });
});
app.delete('/api/categories/:id', async (req, res) => {
    const [result] = await db.pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Categoria não encontrada' });
    res.status(204).send();
});

/* 
=============================================
ROTAS PARA PRODUCTS (CRUD COMPLETO)
============================================= 
*/
app.get('/api/products', async (req, res) => {
    const sql = `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name`;
    const [rows] = await db.pool.execute(sql);
    res.json(rows);
});
app.post('/api/products', async (req, res) => {
    const { name, description, price, status, category_id } = req.body;
    const sql = 'INSERT INTO products (name, description, price, status, category_id) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.pool.execute(sql, [name, description || null, price, status || 'ativo', category_id || null]);
    res.status(201).json({ id: result.insertId, ...req.body });
});
app.get('/api/products/:id', async (req, res) => {
    const [rows] = await db.pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(rows[0]);
});
app.put('/api/products/:id', async (req, res) => {
    const { name, description, price, status, category_id } = req.body;
    const sql = 'UPDATE products SET name=?, description=?, price=?, status=?, category_id=? WHERE id=?';
    const [result] = await db.pool.execute(sql, [name, description || null, price, status, category_id || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json({ id: Number(req.params.id), ...req.body });
});
app.delete('/api/products/:id', async (req, res) => {
    const [result] = await db.pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Produto não encontrado' });
    res.status(204).send();
});

/*
=============================================
ROTAS PARA CLIENTS (CRUD COMPLETO)
============================================= 
*/
app.get('/api/clients', async (req, res) => {
    const [rows] = await db.pool.execute('SELECT * FROM clients ORDER BY name');
    res.json(rows);
});
app.post('/api/clients', async (req, res) => {
    const { name, cpf, email, phone, address } = req.body;
    const sql = 'INSERT INTO clients (name, cpf, email, phone, address) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.pool.execute(sql, [name, cpf || null, email || null, phone || null, address || null]);
    res.status(201).json({ id: result.insertId, ...req.body });
});
app.get('/api/clients/:id', async (req, res) => {
    const [rows] = await db.pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json(rows[0]);
});
app.put('/api/clients/:id', async (req, res) => {
    const { name, cpf, email, phone, address } = req.body;
    const sql = 'UPDATE clients SET name=?, cpf=?, email=?, phone=?, address=? WHERE id=?';
    const [result] = await db.pool.execute(sql, [name, cpf || null, email || null, phone || null, address || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.json({ id: Number(req.params.id), ...req.body });
});
app.delete('/api/clients/:id', async (req, res) => {
    const [result] = await db.pool.execute('DELETE FROM clients WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente não encontrado' });
    res.status(204).send();
});

/* 
=============================================
ROTAS PARA SUPPLIERS (CRUD COMPLETO)
============================================= 
*/
app.get('/api/suppliers', async (req, res) => {
    const [rows] = await db.pool.execute('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
});
app.post('/api/suppliers', async (req, res) => {
    const { name, contact_name, phone, email } = req.body;
    const sql = 'INSERT INTO suppliers (name, contact_name, phone, email) VALUES (?, ?, ?, ?)';
    const [result] = await db.pool.execute(sql, [name, contact_name || null, phone || null, email || null]);
    res.status(201).json({ id: result.insertId, ...req.body });
});
app.get('/api/suppliers/:id', async (req, res) => {
    const [rows] = await db.pool.execute('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Fornecedor não encontrado' });
    res.json(rows[0]);
});
app.put('/api/suppliers/:id', async (req, res) => {
    const { name, contact_name, phone, email } = req.body;
    const sql = 'UPDATE suppliers SET name=?, contact_name=?, phone=?, email=? WHERE id=?';
    const [result] = await db.pool.execute(sql, [name, contact_name || null, phone || null, email || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Fornecedor não encontrado' });
    res.json({ id: Number(req.params.id), ...req.body });
});
app.delete('/api/suppliers/:id', async (req, res) => {
    const [result] = await db.pool.execute('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Fornecedor não encontrado' });
    res.status(204).send();
});


/* 
=============================================
ROTAS PARA STOCK (ESTOQUE)
============================================= 
*/
app.get('/api/stock', async (req, res) => {
    const sql = `SELECT s.id, s.quantity, s.last_updated, p.name as product_name, p.id as product_id FROM stock s JOIN products p ON s.product_id = p.id ORDER BY p.name`;
    const [rows] = await db.pool.execute(sql);
    res.json(rows);
});
app.put('/api/stock/:productId', async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;
    const now = new Date();
    const sql = `INSERT INTO stock (product_id, quantity, last_updated) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?, last_updated = ?`;
    await db.pool.execute(sql, [productId, quantity, now, quantity, now]);
    res.status(200).json({ message: 'Estoque atualizado' });
});

/* 
=============================================
ROTAS PARA SALES (VENDAS)
============================================= 
*/
app.get('/api/sales', async (req, res) => {
    const sql = `SELECT s.id, s.sale_date, s.total_amount, s.status, c.name AS client_name FROM sales AS s LEFT JOIN clients AS c ON s.client_id = c.id ORDER BY s.sale_date DESC`;
    try {
        const [sales] = await db.pool.execute(sql);
        res.json(sales);
    } catch (error) {
        console.error("ERRO AO BUSCAR LISTA DE VENDAS:", error);
        res.status(500).json({ message: "Erro ao buscar a lista de vendas." });
    }
});
app.get('/api/sales/:id', async (req, res) => {
    const { id } = req.params;
    const saleSql = `SELECT s.id, s.sale_date, s.total_amount, c.name AS client_name FROM sales s LEFT JOIN clients c ON s.client_id = c.id WHERE s.id = ?`;
    const itemsSql = `SELECT si.quantity, si.unit_price, p.name AS product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`;
    try {
        const [saleResult] = await db.pool.execute(saleSql, [id]);
        if (saleResult.length === 0) return res.status(404).json({ message: "Venda não encontrada." });
        const [itemsResult] = await db.pool.execute(itemsSql, [id]);
        res.json({ ...saleResult[0], items: itemsResult });
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor." });
    }
});
app.post('/api/sales', async (req, res) => {
    const { clientId, items, totalAmount } = req.body;
    let connection;
    if (!items || items.length === 0) return res.status(400).json({ message: 'A venda deve conter pelo menos um item.' });
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();
        const saleSql = 'INSERT INTO sales (sale_date, total_amount, status, client_id) VALUES (NOW(), ?, ?, ?)';
        const [saleResult] = await connection.execute(saleSql, [totalAmount, 'concluida', clientId || null]);
        const newSaleId = saleResult.insertId;
        const itemSql = 'INSERT INTO sale_items (quantity, unit_price, sale_id, product_id) VALUES (?, ?, ?, ?)';
        const stockSql = 'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?';
        for (const item of items) {
            await connection.execute(itemSql, [item.quantity, item.unitPrice, newSaleId, item.productId]);
            await connection.execute(stockSql, [item.quantity, item.productId]);
        }
        await connection.commit();
        res.status(201).json({ id: newSaleId, message: 'Venda registrada com sucesso!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("ERRO NA TRANSAÇÃO DE VENDA:", error);
        res.status(500).json({ message: 'Erro ao registrar a venda.' });
    } finally {
        if (connection) connection.release();
    }
});

/* 
=============================================
ROTA PARA O PAINEL PRINCIPAL (DASHBOARD)
=============================================
*/
app.get('/api/dashboard', async (req, res) => {
    const [totalProdutos] = await db.pool.query('SELECT COUNT(*) as count FROM products');
    const [produtosEstoque] = await db.pool.query('SELECT COUNT(*) as count FROM stock WHERE quantity > 0');
    const [totalClientes] = await db.pool.query('SELECT COUNT(*) as count FROM clients');
    const [vendasHoje] = await db.pool.query("SELECT COUNT(*) as count FROM sales WHERE DATE(sale_date) = CURDATE()");
    res.json({
        totalProdutos: totalProdutos[0].count,
        produtosEstoque: produtosEstoque[0].count,
        totalClientes: totalClientes[0].count,
        vendasHoje: vendasHoje[0].count,
    });
});

/* 
=============================================
INICIALIZAÇÃO DO SERVIDOR
============================================= 
*/
app.listen(PORT, () => {
    console.log(`🚀 Servidor da API GELP rodando em http://localhost:${PORT}` );
    db.testConnection();
});
