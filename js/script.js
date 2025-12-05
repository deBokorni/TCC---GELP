// GELP - main.js - Versão API-First
// Este arquivo substitui toda a lógica do IndexedDB por chamadas à API REST.
'use strict';

// URL base da nossa API. Altere aqui se o endereço ou porta do backend mudar.
const API_URL = 'http://localhost:3001/api';

// Função utilitária para fazer requisições fetch e tratar erros comuns
async function apiRequest(endpoint, options = {} ) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        
        // Se a resposta for 204 (No Content), não há corpo para ler, então retorna sucesso.
        if (response.status === 204) {
            return { success: true };
        }

        const data = await response.json();

        if (!response.ok) {
            // Se a API retornar uma mensagem de erro, usa ela. Senão, usa o statusText.
            const errorMessage = data.message || response.statusText;
            throw new Error(errorMessage);
        }
        
        return data;
    } catch (error) {
        console.error(`Erro na requisição para ${endpoint}:`, error);
        // Propaga o erro para que a função que chamou possa tratá-lo.
        throw error;
    }
}

async function openViewVendaModal(saleId) {
    try {
        const saleDetails = await apiRequest(`/sales/${saleId}`);
        
        const itemsHtml = saleDetails.items.map(it => 
            `<li>${escapeHtml(it.product_name)}: ${it.quantity} x ${formatCurrencyBRL(it.unit_price)} = ${formatCurrencyBRL(it.quantity * it.unit_price)}</li>`
        ).join('');

        const html = `
            <h3>Detalhes da Venda #${saleDetails.id}</h3>
            <p><strong>Data:</strong> ${formatDate(saleDetails.sale_date)}</p>
            <p><strong>Cliente:</strong> ${escapeHtml(saleDetails.client_name || 'Consumidor Final')}</p>
            <p><strong>Itens:</strong></p>
            <ul>${itemsHtml}</ul>
            <hr>
            <h4>Total: ${formatCurrencyBRL(saleDetails.total_amount)}</h4>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="hideModal()">Fechar</button>
            </div>
        `;
        showModal(html);
    } catch (error) {
        alert(`Erro ao buscar detalhes da venda: ${error.message}`);
    }
}


// Funções utilitárias de formatação e seleção de DOM
const formatCurrencyBRL = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (isoString) => new Date(isoString).toLocaleString('pt-BR');
const by = (selector, parent = document) => parent.querySelector(selector);
const byAll = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));


// Referências aos elementos principais do DOM
const navButtons = byAll('.nav-btn');
const sections = byAll('.section');
const modal = by('#modal');
const modalBody = by('#modal-body');
const btnModalClose = by('.close');

const tables = {
    products: by('#produtos-table tbody'),
    estoque: by('#estoque-table tbody'),
    vendas: by('#vendas-table tbody'),
    clientes: by('#clientes-table tbody'),
    fornecedores: by('#fornecedores-table tbody'),
    categorias: by('#categorias-table tbody'),
};

const dashboard = {
    totalProdutos: by('#total-produtos'),
    produtosEstoque: by('#produtos-estoque'),
    vendasHoje: by('#vendas-hoje'),
    totalClientes: by('#total-clientes'),
};

// --- CONTROLES DO MODAL ---
function showModal(contentHtml, onShowFocusSelector) {
    modalBody.innerHTML = contentHtml;
    modal.classList.add('show');
    const focusEl = onShowFocusSelector ? by(onShowFocusSelector, modal) : modal.querySelector('input, button, select, textarea');
    if (focusEl) setTimeout(() => focusEl.focus(), 50);
}

function hideModal() {
    modal.classList.remove('show');
    modalBody.innerHTML = '';
}

// --- NAVEGAÇÃO ---
function setActiveSection(sectionId) {
    sections.forEach(s => s.classList.toggle('active', s.id === `${sectionId}-section`));
    navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === sectionId));
}

// --- RENDERIZAÇÃO DAS TABELAS ---

async function renderTable(endpoint, tableBody, rowRenderer, columns) {
    try {
        const data = await apiRequest(endpoint);
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${columns}">Nenhum item encontrado.</td></tr>`;
            return;
        }
        data.forEach(item => tableBody.appendChild(rowRenderer(item)));
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="${columns}">Falha ao carregar dados. Verifique a API.</td></tr>`;
    }
}

const renderProductsTable = () => renderTable('/products', tables.products, (p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category_name || 'Sem categoria')}</td>
        <td>${formatCurrencyBRL(p.price)}</td>
        <td><span class="status-badge ${p.status === 'ativo' ? 'status-ativo' : 'status-inativo'}">${p.status}</span></td>
        <td class="actions">
            <button class="btn btn-small btn-secondary" onclick="openEditModal('product', ${p.id})">Editar</button>
            <button class="btn btn-small btn-danger" onclick="confirmAndDelete('product', ${p.id})">Excluir</button>
        </td>
    `;
    return tr;
}, 5);

const renderCategoriesTable = () => renderTable('/categories', tables.categorias, (c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.description || '')}</td>
        <td class="actions">
            <button class="btn btn-small btn-secondary" onclick="openEditModal('category', ${c.id})">Editar</button>
            <button class="btn btn-small btn-danger" onclick="confirmAndDelete('category', ${c.id})">Excluir</button>
        </td>
    `;
    return tr;
}, 3);

const renderClientsTable = () => renderTable('/clients', tables.clientes, (c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.cpf || '')}</td>
        <td>${escapeHtml(c.email || '')}</td>
        <td>${escapeHtml(c.phone || '')}</td>
        <td class="actions">
            <button class="btn btn-small btn-secondary" onclick="openEditModal('client', ${c.id})">Editar</button>
            <button class="btn btn-small btn-danger" onclick="confirmAndDelete('client', ${c.id})">Excluir</button>
        </td>
    `;
    return tr;
}, 5);

const renderFornecedoresTable = () => renderTable('/suppliers', tables.fornecedores, (f) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${escapeHtml(f.name)}</td>
        <td>${escapeHtml(f.contact_name || '')}</td>
        <td>${escapeHtml(f.phone || '')}</td>
        <td>${escapeHtml(f.email || '')}</td>
        <td class="actions">
            <button class="btn btn-small btn-secondary" onclick="openEditModal('supplier', ${f.id})">Editar</button>
            <button class="btn btn-small btn-danger" onclick="confirmAndDelete('supplier', ${f.id})">Excluir</button>
        </td>
    `;
    return tr;
}, 5);

const renderEstoqueTable = () => renderTable('/stock', tables.estoque, (s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${escapeHtml(s.product_name)}</td>
        <td>${s.quantity}</td>
        <td>${formatDate(s.last_updated)}</td>
        <td class="actions">
            <button class="btn btn-small btn-primary" onclick="openStockEditModal(${s.product_id}, '${escapeHtml(s.product_name)}', ${s.quantity})">Ajustar</button>
        </td>
    `;
    return tr;
}, 4);

// ADICIONE ESTA FUNÇÃO JUNTO COM AS OUTRAS DE RENDERIZAÇÃO

// VERSÃO CORRIGIDA (use esta)
function renderVendasTable() {
    renderTable('/sales', tables.vendas, (v) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(v.sale_date)}</td>
            <td>${escapeHtml(v.client_name || 'Consumidor Final')}</td>
            <td>${formatCurrencyBRL(v.total_amount)}</td>
            <td>${escapeHtml(v.status)}</td>
            <td class="actions">
                <button class="btn btn-small btn-secondary" onclick="openViewVendaModal(${v.id})">Ver Detalhes</button>
            </td>
        `;
        return tr;
    }, 5);
}


// --- MODAIS (ADICIONAR / EDITAR) ---

// Função genérica para abrir modal de edição
async function openEditModal(type, id) {
    try {
        const item = await apiRequest(`/${getEndpoint(type)}/${id}`);
        openAddModal(type, item); // Reutiliza o modal de adição, mas com dados para edição
    } catch (error) {
        alert(`Erro ao carregar dados para edição: ${error.message}`);
    }
}

// Função principal que monta os modais
async function openAddModal(type, item = null) {
    let html = '';
    const isEdit = item !== null;
    const title = `${isEdit ? 'Editar' : 'Adicionar'} ${getLabel(type)}`;

    // Opções de categoria para o formulário de produto
    let categoryOptions = '';
    if (type === 'product') {
        const categories = await apiRequest('/categories');
        categoryOptions = categories.map(c => 
            `<option value="${c.id}" ${isEdit && item.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
        ).join('');
    }

    switch (type) {
        case 'category':
            html = `
                <div class="form-group"><label>Nome</label><input id="name" type="text" value="${isEdit ? escapeHtml(item.name) : ''}" required /></div>
                <div class="form-group"><label>Descrição</label><textarea id="description">${isEdit ? escapeHtml(item.description || '') : ''}</textarea></div>
            `;
            break;
        case 'product':
            html = `
                <div class="form-group"><label>Nome</label><input id="name" type="text" value="${isEdit ? escapeHtml(item.name) : ''}" required /></div>
                <div class="form-group"><label>Categoria</label><select id="category_id">${categoryOptions}</select></div>
                <div class="form-group"><label>Preço</label><input id="price" type="number" step="0.01" value="${isEdit ? item.price : ''}" required /></div>
                <div class="form-group"><label>Status</label><select id="status">
                    <option value="ativo" ${isEdit && item.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                    <option value="inativo" ${isEdit && item.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                </select></div>
                <div class="form-group"><label>Descrição</label><textarea id="description">${isEdit ? escapeHtml(item.description || '') : ''}</textarea></div>
            `;
            break;
        case 'client':
            html = `
                <div class="form-group"><label>Nome</label><input id="name" type="text" value="${isEdit ? escapeHtml(item.name) : ''}" required /></div>
                <div class="form-group"><label>CPF</label><input id="cpf" type="text" value="${isEdit ? escapeHtml(item.cpf || '') : ''}" /></div>
                <div class="form-group"><label>Email</label><input id="email" type="email" value="${isEdit ? escapeHtml(item.email || '') : ''}" /></div>
                <div class="form-group"><label>Telefone</label><input id="phone" type="text" value="${isEdit ? escapeHtml(item.phone || '') : ''}" /></div>
                <div class="form-group"><label>Endereço</label><textarea id="address">${isEdit ? escapeHtml(item.address || '') : ''}</textarea></div>
            `;
            break;
        case 'supplier':
            html = `
                <div class="form-group"><label>Nome</label><input id="name" type="text" value="${isEdit ? escapeHtml(item.name) : ''}" required /></div>
                <div class="form-group"><label>Nome do Contato</label><input id="contact_name" type="text" value="${isEdit ? escapeHtml(item.contact_name || '') : ''}" /></div>
                <div class="form-group"><label>Telefone</label><input id="phone" type="text" value="${isEdit ? escapeHtml(item.phone || '') : ''}" /></div>
                <div class="form-group"><label>Email</label><input id="email" type="email" value="${isEdit ? escapeHtml(item.email || '') : ''}" /></div>
            `;
            break;
    }

    const fullHtml = `<h3>${title}</h3><form id="modal-form">${html}</form><div class="form-actions">
        <button id="save-btn" class="btn btn-primary">Salvar</button>
        <button class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
    </div>`;
    
    showModal(fullHtml, '#name');

    by('#save-btn').addEventListener('click', async () => {
        const form = by('#modal-form');
        const formData = new FormData(form);
        const data = {};
        // Pega todos os campos do formulário e cria um objeto
        form.querySelectorAll('input, select, textarea').forEach(el => data[el.id] = el.value);

        if (!data.name) {
            alert('O campo "Nome" é obrigatório.');
            return;
        }

        try {
            const endpoint = `/${getEndpoint(type)}${isEdit ? `/${item.id}` : ''}`;
            const method = isEdit ? 'PUT' : 'POST';
            await apiRequest(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            hideModal();
            refreshAllViews();
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
    });
}

// Modal específico para ajustar estoque
function openStockEditModal(productId, productName, currentQuantity) {
    const html = `
        <h3>Ajustar Estoque: ${productName}</h3>
        <p>Quantidade atual: <strong>${currentQuantity}</strong></p>
        <div class="form-group">
            <label for="quantity">Nova Quantidade Total</label>
            <input id="quantity" type="number" value="${currentQuantity}" required />
        </div>
        <div class="form-actions">
            <button id="save-stock-btn" class="btn btn-primary">Salvar</button>
            <button class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
        </div>
    `;
    showModal(html, '#quantity');

    by('#save-stock-btn').addEventListener('click', async () => {
        const newQuantity = by('#quantity').value;
        if (newQuantity === '' || Number(newQuantity) < 0) {
            alert('Por favor, insira uma quantidade válida.');
            return;
        }
        try {
            await apiRequest(`/stock/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: Number(newQuantity) })
            });
            hideModal();
            refreshAllViews();
        } catch (error) {
            alert(`Erro ao ajustar estoque: ${error.message}`);
        }
    });
}

// ADICIONE ESTA NOVA FUNÇÃO NO SEU main.js

async function openNewStockEntryModal() {
    try {
        // Busca todos os produtos da API para listar no <select>
        const products = await apiRequest('/products');
        if (products.length === 0) {
            alert('Cadastre pelo menos um produto antes de fazer uma entrada no estoque.');
            return;
        }

        const productOptions = products.map(p => 
            `<option value="${p.id}">${escapeHtml(p.name)}</option>`
        ).join('');

        const html = `
            <h3>Nova Entrada de Estoque</h3>
            <div class="form-group">
                <label for="product-id">Produto</label>
                <select id="product-id">${productOptions}</select>
            </div>
            <div class="form-group">
                <label for="quantity-to-add">Quantidade a Adicionar</label>
                <input id="quantity-to-add" type="number" min="1" value="1" required />
            </div>
            <div class="form-actions">
                <button id="save-entry-btn" class="btn btn-primary">Adicionar ao Estoque</button>
                <button class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
            </div>
        `;
        showModal(html, '#product-id');

        by('#save-entry-btn').addEventListener('click', async () => {
            const productId = by('#product-id').value;
            const quantityToAdd = Number(by('#quantity-to-add').value);

            if (!productId || quantityToAdd <= 0) {
                alert('Por favor, selecione um produto e insira uma quantidade válida.');
                return;
            }

            try {
                // 1. Pega o estoque atual do produto
                const stockData = await apiRequest('/stock');
                const currentStock = stockData.find(s => s.product_id == productId);
                const currentQuantity = currentStock ? currentStock.quantity : 0;

                // 2. Calcula a nova quantidade
                const newTotalQuantity = currentQuantity + quantityToAdd;

                // 3. Envia a nova quantidade total para a API
                await apiRequest(`/stock/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: newTotalQuantity })
                });

                hideModal();
                refreshAllViews(); // Atualiza a tela para mostrar o novo estoque
                alert('Estoque atualizado com sucesso!');

            } catch (error) {
                alert(`Erro ao adicionar entrada no estoque: ${error.message}`);
            }
        });

    } catch (error) {
        alert(`Erro ao abrir o formulário de entrada: ${error.message}`);
    }
}



// --- AÇÃO DE EXCLUSÃO ---
async function confirmAndDelete(type, id) {
    if (!confirm(`Deseja realmente excluir este(a) ${getLabel(type)}? Esta ação não pode ser desfeita.`)) {
        return;
    }
    try {
        await apiRequest(`/${getEndpoint(type)}/${id}`, { method: 'DELETE' });
        refreshAllViews();
    } catch (error) {
        alert(`Erro ao excluir: ${error.message}`);
    }
}

// --- FUNÇÕES DE MAPEAMENTO (LABEL/ENDPOINT) ---
function getLabel(type) {
    const labels = { category: 'Categoria', product: 'Produto', client: 'Cliente', supplier: 'Fornecedor' };
    return labels[type] || 'item';
}
function getEndpoint(type) {
    const endpoints = { category: 'categories', product: 'products', client: 'clients', supplier: 'suppliers' };
    return endpoints[type] || type;
}

// --- ATUALIZAÇÃO DE DADOS E INICIALIZAÇÃO ---

async function refreshDashboard() {
    try {
        const data = await apiRequest('/dashboard');
        dashboard.totalProdutos.textContent = data.totalProdutos;
        dashboard.produtosEstoque.textContent = data.produtosEstoque;
        dashboard.vendasHoje.textContent = data.vendasHoje;
        dashboard.totalClientes.textContent = data.totalClientes;
    } catch (error) {
        console.error("Não foi possível atualizar o dashboard.");
    }
}

// ADICIONE ESTA NOVA FUNÇÃO AO SEU main.js

async function openAddVendaModal() {
    try {
        // Busca dados necessários da API em paralelo
        const [products, clients] = await Promise.all([
            apiRequest('/products'),
            apiRequest('/clients')
        ]);

        if (products.length === 0) {
            alert('Cadastre pelo menos um produto antes de registrar uma venda.');
            return;
        }

        const clientOptions = '<option value="">Consumidor Final</option>' + clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        const productOptions = products.map(p => `<option value="${p.id}" data-price="${p.price}">${escapeHtml(p.name)}</option>`).join('');

        let html = `
            <h3>Registrar Nova Venda</h3>
            <div class="form-group"><label>Cliente</label><select id="v-client">${clientOptions}</select></div>
            <div id="v-items-container"></div>
            <div style="margin: 1rem 0;">
                <button id="v-add-item" class="btn btn-secondary btn-small">Adicionar Produto</button>
            </div>
            <hr>
            <h4>Total: <span id="v-total">${formatCurrencyBRL(0)}</span></h4>
            <div class="form-actions">
                <button id="v-save" class="btn btn-primary">Finalizar Venda</button>
                <button class="btn btn-secondary" onclick="hideModal()">Cancelar</button>
            </div>
        `;
        showModal(html, '#v-client');

        const itemsContainer = by('#v-items-container');
        const totalEl = by('#v-total');

        const calculateTotal = () => {
            let total = 0;
            itemsContainer.querySelectorAll('.v-item').forEach(itemRow => {
                const qty = Number(itemRow.querySelector('.v-qty').value);
                const price = Number(itemRow.querySelector('.v-price').value);
                total += qty * price;
            });
            totalEl.textContent = formatCurrencyBRL(total);
            return total;
        };

        const addVendaItem = () => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'v-item';
            itemDiv.innerHTML = `
                <div class="form-group"><label>Produto</label><select class="v-prod">${productOptions}</select></div>
                <div class="form-group"><label>Qtd.</label><input class="v-qty" type="number" value="1" min="1" /></div>
                <div class="form-group"><label>Preço Unit.</label><input class="v-price" type="number" step="0.01" /></div>
                <button class="v-remove btn btn-danger btn-small">X</button>
            `;
            itemsContainer.appendChild(itemDiv);

            const productSelect = itemDiv.querySelector('.v-prod');
            const priceInput = itemDiv.querySelector('.v-price');
            
            // Preenche o preço automaticamente ao selecionar o produto
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            priceInput.value = selectedOption.dataset.price;

            productSelect.addEventListener('change', (e) => {
                priceInput.value = e.target.options[e.target.selectedIndex].dataset.price;
                calculateTotal();
            });

            itemDiv.querySelector('.v-qty').addEventListener('input', calculateTotal);
            itemDiv.querySelector('.v-price').addEventListener('input', calculateTotal);
            itemDiv.querySelector('.v-remove').addEventListener('click', () => {
                itemDiv.remove();
                calculateTotal();
            });
            calculateTotal();
        };

        by('#v-add-item').addEventListener('click', addVendaItem);
        addVendaItem(); // Adiciona o primeiro item automaticamente

        by('#v-save').addEventListener('click', async () => {
            const saleData = {
                clientId: by('#v-client').value || null,
                totalAmount: calculateTotal(),
                items: []
            };

            itemsContainer.querySelectorAll('.v-item').forEach(itemRow => {
                saleData.items.push({
                    productId: itemRow.querySelector('.v-prod').value,
                    quantity: Number(itemRow.querySelector('.v-qty').value),
                    unitPrice: Number(itemRow.querySelector('.v-price').value)
                });
            });

            if (saleData.items.length === 0) {
                alert('Adicione pelo menos um produto à venda.');
                return;
            }

            try {
                await apiRequest('/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(saleData)
                });
                hideModal();
                refreshAllViews();
                alert('Venda registrada com sucesso!');
            } catch (error) {
                alert(`Erro ao registrar venda: ${error.message}`);
            }
        });

    } catch (error) {
        alert(`Não foi possível abrir o formulário de vendas: ${error.message}`);
    }
}


function refreshAllViews() {
    refreshDashboard();
    renderProductsTable();
    renderCategoriesTable();
    renderClientsTable();
    renderFornecedoresTable();
    renderEstoqueTable();
    renderVendasTable(); // A implementar
}

function wireHeaderButtons() {
    by('#add-produto-btn').addEventListener('click', () => openAddModal('product'));
    by('#add-categoria-btn').addEventListener('click', () => openAddModal('category'));
    by('#add-cliente-btn').addEventListener('click', () => openAddModal('client'));
    by('#add-fornecedor-btn').addEventListener('click', () => openAddModal('supplier'));
    by('#add-entrada-btn').addEventListener('click', openNewStockEntryModal);
    by('#add-venda-btn').addEventListener('click', openAddVendaModal);
    // Botão de Nova Entrada no Estoque pode ter uma lógica diferente (a implementar)
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
function init() {
    // Adiciona eventos de clique aos botões de navegação
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveSection(btn.dataset.section);
            refreshAllViews(); // Atualiza as views ao trocar de seção
        });
    });

    // Adiciona eventos de clique para fechar o modal
    btnModalClose.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => e.target === modal && hideModal());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && hideModal());

    // Conecta os botões "Adicionar" aos seus respectivos modais
    wireHeaderButtons();
    
    // Define a seção inicial e carrega todos os dados da API
    setActiveSection('dashboard');
    refreshAllViews();

    console.log('GELP (API Version) inicializado com sucesso!');
}

// Expõe funções globais que são chamadas pelo HTML (onclick)
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.confirmAndDelete = confirmAndDelete;
window.hideModal = hideModal;
window.openStockEditModal = openStockEditModal;
window.openNewStockEntryModal = openNewStockEntryModal;
window.openViewVendaModal = openViewVendaModal;
window.openAddVendaModal = openAddVendaModal;


// Inicia a aplicação
init();
