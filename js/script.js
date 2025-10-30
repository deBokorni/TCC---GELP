// js/main.js
// GELP - main JS (interatividade + IndexedDB wrapper + seeds)
// Recomendação: salve como js/main.js e remova/ignore scripts db.js/models.js existentes
'use strict';

(() => {
    /********************
     * IndexedDB wrapper
     ********************/
    const DB_NAME = 'gelp_db';
    const DB_VERSION = 1;
    const STORES = ['products', 'categories', 'clients', 'fornecedores', 'estoque', 'vendas'];

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (ev) => {
                const db = ev.target.result;
                for (const store of STORES) {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store, { keyPath: 'id' });
                    }
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function runTx(storeName, mode, callback) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            let result;
            try {
                result = callback(store);
            } catch (err) {
                reject(err);
            }
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
        });
    }

    const dbAPI = {
        async add(store, item) {
            item.id = item.id || generateId();
            return runTx(store, 'readwrite', (s) => s.add(item));
        },
        async put(store, item) {
            if (!item.id) throw new Error('Item must have id for put()');
            return runTx(store, 'readwrite', (s) => s.put(item));
        },
        async delete(store, id) {
            return runTx(store, 'readwrite', (s) => s.delete(id));
        },
        async get(store, id) {
            return runTx(store, 'readonly', (s) => {
                return new Promise((res, rej) => {
                    const r = s.get(id);
                    r.onsuccess = () => res(r.result);
                    r.onerror = () => rej(r.error);
                });
            });
        },
        async getAll(store) {
            return runTx(store, 'readonly', (s) => {
                return new Promise((res, rej) => {
                    const r = s.getAll();
                    r.onsuccess = () => res(r.result || []);
                    r.onerror = () => rej(r.error);
                });
            });
        },
        async clear(store) {
            return runTx(store, 'readwrite', (s) => s.clear());
        }
    };

    /********************
     * Helpers
     ********************/
    function generateId() {
        // unique-ish id
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function formatCurrencyBRL(value) {
        const num = Number(value) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDateISOToBR(iso) {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return '';
            return d.toLocaleString('pt-BR');
        } catch {
            return '';
        }
    }

    function by(selector, parent = document) {
        return parent.querySelector(selector);
    }
    function byAll(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }

    /********************
     * DOM Elements
     ********************/
    const navButtons = byAll('.nav-btn');
    const sections = byAll('.section');
    const modal = by('#modal');
    const modalContent = by('.modal-content');
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

    /********************
     * Modal controls
     ********************/
    function showModal(contentHtml, onShowFocusSelector) {
        modalBody.innerHTML = contentHtml;
        modal.classList.add('show');
        // small delay to ensure elements exist
        setTimeout(() => {
            const focusEl = onShowFocusSelector ? by(onShowFocusSelector, modal) : modal.querySelector('input, button, select, textarea');
            if (focusEl) focusEl.focus();
        }, 50);
        // trap focus basic
        document.addEventListener('focus', keepFocusWithinModal, true);
    }

    function hideModal() {
        modal.classList.remove('show');
        modalBody.innerHTML = '';
        document.removeEventListener('focus', keepFocusWithinModal, true);
    }

    function keepFocusWithinModal(e) {
        if (!modal.classList.contains('show')) return;
        if (!modal.contains(e.target)) {
            // move focus to modal
            const el = modal.querySelector('input, button, select, textarea, [tabindex]');
            if (el) el.focus();
            else modal.focus();
        }
    }

    // Close handlers
    btnModalClose.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) hideModal();
    });

    /********************
     * Navigation
     ********************/
    function setActiveSection(sectionId) {
        sections.forEach(s => {
            if (s.id === `${sectionId}-section`) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
        navButtons.forEach(btn => {
            if (btn.dataset.section === sectionId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            setActiveSection(section);
        });
    });

    /********************
     * Seeds (first run)
     ********************/
    const SEED_FLAG = 'gelp_seeded_v1';

    async function seedInitialData() {
        try {
            const seeded = localStorage.getItem(SEED_FLAG);
            if (seeded) return;

            // Categories
            const catFrutas = { id: generateId(), name: 'Frutas', description: 'Frutas frescas' };
            const catLaticinios = { id: generateId(), name: 'Laticínios', description: 'Leites e derivados' };
            const catPadaria = { id: generateId(), name: 'Padaria', description: 'Pães e assados' };

            await dbAPI.add('categories', catFrutas);
            await dbAPI.add('categories', catLaticinios);
            await dbAPI.add('categories', catPadaria);

            // Products
            const p1 = { id: generateId(), name: 'Maçã Gala', categoryId: catFrutas.id, price: 5.50, description: '', status: 'ativo' };
            const p2 = { id: generateId(), name: 'Leite Integral 1L', categoryId: catLaticinios.id, price: 4.20, description: '', status: 'ativo' };
            const p3 = { id: generateId(), name: 'Pão Francês', categoryId: catPadaria.id, price: 0.80, description: '', status: 'ativo' };

            await dbAPI.add('products', p1);
            await dbAPI.add('products', p2);
            await dbAPI.add('products', p3);

            // Clients
            const c1 = { id: generateId(), name: 'Ana Paula', cpf: '', email: '', phone: '' };
            const c2 = { id: generateId(), name: 'Bruno Costa', cpf: '', email: '', phone: '' };
            await dbAPI.add('clients', c1);
            await dbAPI.add('clients', c2);

            // Fornecedores
            const f1 = { id: generateId(), name: 'Fazenda Verde', contact: '', phone: '', email: '' };
            const f2 = { id: generateId(), name: 'Laticínios Bom Leite', contact: '', phone: '', email: '' };
            await dbAPI.add('fornecedores', f1);
            await dbAPI.add('fornecedores', f2);

            // Estoque (map product id -> quantidade)
            await dbAPI.add('estoque', { id: generateId(), productId: p1.id, quantity: 50, updatedAt: new Date().toISOString() });
            await dbAPI.add('estoque', { id: generateId(), productId: p2.id, quantity: 30, updatedAt: new Date().toISOString() });
            await dbAPI.add('estoque', { id: generateId(), productId: p3.id, quantity: 200, updatedAt: new Date().toISOString() });

            // Vendas - empty for now; we can add example if desired

            localStorage.setItem(SEED_FLAG, '1');
            console.info('GELP: dados iniciais carregados.');
        } catch (err) {
            console.error('Erro durante seedInitialData:', err);
        }
    }

    /********************
     * Rendering
     ********************/
    async function refreshDashboard() {
        try {
            const products = await dbAPI.getAll('products');
            const estoque = await dbAPI.getAll('estoque');
            const vendas = await dbAPI.getAll('vendas');
            const clients = await dbAPI.getAll('clients');

            dashboard.totalProdutos.textContent = products.length.toString();
            // Produtos em estoque -> count products that have quantity > 0
            const withStock = estoque.filter(e => Number(e.quantity) > 0).length;
            dashboard.produtosEstoque.textContent = withStock.toString();

            // Vendas hoje
            const today = new Date();
            const vendasHojeCount = vendas.filter(v => {
                const d = new Date(v.date);
                return d.getFullYear() === today.getFullYear() &&
                    d.getMonth() === today.getMonth() &&
                    d.getDate() === today.getDate();
            }).length;
            dashboard.vendasHoje.textContent = vendasHojeCount.toString();

            dashboard.totalClientes.textContent = clients.length.toString();
        } catch (err) {
            console.error('Erro em refreshDashboard:', err);
        }
    }

    async function renderProductsTable() {
        try {
            const tbody = tables.products;
            tbody.innerHTML = '';
            const products = await dbAPI.getAll('products');
            const categories = await dbAPI.getAll('categories');
            const estoque = await dbAPI.getAll('estoque');

            const catMap = new Map(categories.map(c => [c.id, c]));
            const estoqueMap = new Map(estoque.map(e => [e.productId, e]));

            for (const p of products) {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = p.name;
                tr.appendChild(tdName);

                const tdCat = document.createElement('td');
                tdCat.textContent = catMap.get(p.categoryId)?.name || '—';
                tr.appendChild(tdCat);

                const tdPrice = document.createElement('td');
                tdPrice.textContent = formatCurrencyBRL(p.price);
                tr.appendChild(tdPrice);

                const tdStatus = document.createElement('td');
                const span = document.createElement('span');
                span.className = `status-badge ${p.status === 'ativo' ? 'status-ativo' : 'status-inativo'}`;
                span.textContent = p.status === 'ativo' ? 'Ativo' : 'Inativo';
                tdStatus.appendChild(span);
                tr.appendChild(tdStatus);

                const tdActions = document.createElement('td');
                tdActions.className = 'actions';

                // Edit button
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-small btn-secondary';
                btnEdit.textContent = 'Editar';
                btnEdit.addEventListener('click', () => openEditProductModal(p.id));
                tdActions.appendChild(btnEdit);

                // Estoque button
                const btnStock = document.createElement('button');
                btnStock.className = 'btn btn-small btn-primary';
                btnStock.textContent = 'Estoque';
                btnStock.addEventListener('click', () => openStockModalForProduct(p.id));
                tdActions.appendChild(btnStock);

                // Delete button
                const btnDel = document.createElement('button');
                btnDel.className = 'btn btn-small btn-danger';
                btnDel.textContent = 'Excluir';
                btnDel.addEventListener('click', () => confirmAndDelete('product', p.id));
                tdActions.appendChild(btnDel);

                tr.appendChild(tdActions);

                tbody.appendChild(tr);
            }
        } catch (err) {
            console.error('Erro em renderProductsTable:', err);
        }
    }

    async function renderCategoriesTable() {
        try {
            const tbody = tables.categorias;
            tbody.innerHTML = '';
            const cats = await dbAPI.getAll('categories');
            for (const c of cats) {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = c.name;
                tr.appendChild(tdName);

                const tdDesc = document.createElement('td');
                tdDesc.textContent = c.description || '';
                tr.appendChild(tdDesc);

                const tdActions = document.createElement('td');
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-small btn-secondary';
                btnEdit.textContent = 'Editar';
                btnEdit.addEventListener('click', () => openEditCategoryModal(c.id));
                tdActions.appendChild(btnEdit);

                const btnDel = document.createElement('button');
                btnDel.className = 'btn btn-small btn-danger';
                btnDel.textContent = 'Excluir';
                btnDel.addEventListener('click', () => confirmAndDelete('category', c.id));
                tdActions.appendChild(btnDel);

                tr.appendChild(tdActions);
                tbody.appendChild(tr);
            }
        } catch (err) {
            console.error('Erro em renderCategoriesTable:', err);
        }
    }

    async function renderClientsTable() {
        try {
            const tbody = tables.clientes;
            tbody.innerHTML = '';
            const clients = await dbAPI.getAll('clients');
            for (const c of clients) {
                const tr = document.createElement('tr');

                tr.appendChild(tdText(c.name));
                tr.appendChild(tdText(c.cpf || ''));
                tr.appendChild(tdText(c.email || ''));
                tr.appendChild(tdText(c.phone || ''));

                const tdActions = document.createElement('td');
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-small btn-secondary';
                btnEdit.textContent = 'Editar';
                btnEdit.addEventListener('click', () => openEditClientModal(c.id));
                tdActions.appendChild(btnEdit);

                const btnDel = document.createElement('button');
                btnDel.className = 'btn btn-small btn-danger';
                btnDel.textContent = 'Excluir';
                btnDel.addEventListener('click', () => confirmAndDelete('client', c.id));
                tdActions.appendChild(btnDel);

                tr.appendChild(tdActions);
                tbody.appendChild(tr);
            }
        } catch (err) {
            console.error('Erro em renderClientsTable:', err);
        }
    }

    async function renderFornecedoresTable() {
        try {
            const tbody = tables.fornecedores;
            tbody.innerHTML = '';
            const items = await dbAPI.getAll('fornecedores');
            for (const f of items) {
                const tr = document.createElement('tr');
                tr.appendChild(tdText(f.name));
                tr.appendChild(tdText(f.contact || ''));
                tr.appendChild(tdText(f.phone || ''));
                tr.appendChild(tdText(f.email || ''));

                const tdActions = document.createElement('td');
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-small btn-secondary';
                btnEdit.textContent = 'Editar';
                btnEdit.addEventListener('click', () => openEditFornecedorModal(f.id));
                tdActions.appendChild(btnEdit);

                const btnDel = document.createElement('button');
                btnDel.className = 'btn btn-small btn-danger';
                btnDel.textContent = 'Excluir';
                btnDel.addEventListener('click', () => confirmAndDelete('fornecedor', f.id));
                tdActions.appendChild(btnDel);

                tr.appendChild(tdActions);
                tbody.appendChild(tr);
            }
        } catch (err) {
            console.error('Erro em renderFornecedoresTable:', err);
        }
    }

    async function renderEstoqueTable() {
        try {
            const tbody = tables.estoque;
            tbody.innerHTML = '';
            const estoque = await dbAPI.getAll('estoque');
            const products = await dbAPI.getAll('products');
            const prodMap = new Map(products.map(p => [p.id, p]));

            for (const e of estoque) {
                const tr = document.createElement('tr');
                tr.appendChild(tdText(prodMap.get(e.productId)?.name || '—'));
                tr.appendChild(tdText(String(e.quantity)));
                tr.appendChild(tdText(formatDateISOToBR(e.updatedAt)));

                const tdActions = document.createElement('td');
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-small btn-primary';
                btnEdit.textContent = 'Editar';
                btnEdit.addEventListener('click', () => openEditEstoqueModal(e.id));
                tdActions.appendChild(btnEdit);

                const btnDel = document.createElement('button');
                btnDel.className = 'btn btn-small btn-danger';
                btnDel.textContent = 'Excluir';
                btnDel.addEventListener('click', () => confirmAndDelete('estoque', e.id));
                tdActions.appendChild(btnDel);

                tr.appendChild(tdActions);
                tbody.appendChild(tr);
            }
        } catch (err) {
            console.error('Erro em renderEstoqueTable:', err);
        }
    }

    async function renderVendasTable() {
        try {
            const tbody = tables.vendas;
            tbody.innerHTML = '';
            const vendas = await dbAPI.getAll('vendas');
            const clients = await dbAPI.getAll('clients');
            const clientMap = new Map(clients.map(c => [c.id, c]));

            for (const v of vendas) {
                const tr = document.createElement('tr');
                tr.appendChild(tdText(formatDateISOToBR(v.date)));
                tr.appendChild(tdText(clientMap.get(v.clientId)?.name || 'Consumidor'));
                tr.appendChild(tdText(formatCurrencyBRL(v.total || 0)));

                const tdStatus = document.createElement('td');
                tdStatus.textContent = v.status || 'Concluída';
                tr.appendChild(tdStatus);

                const tdActions = document.createElement('td');
                const btnView = document.createElement('button');
                btnView.className = 'btn btn-small btn-secondary';
                btnView.textContent = 'Ver';
                btnView.addEventListener('click', () => openViewVendaModal(v.id));
                tdActions.appendChild(btnView);

                tr.appendChild(tdActions);
                tbody.appendChild(tr);
            }
        } catch (err) {
            console.error('Erro em renderVendasTable:', err);
        }
    }

    function tdText(text = '') {
        const td = document.createElement('td');
        td.textContent = text;
        return td;
    }

    /********************
     * Confirm + Delete
     ********************/
    async function confirmAndDelete(type, id) {
        const map = {
            product: { store: 'products', label: 'produto' },
            category: { store: 'categories', label: 'categoria' },
            client: { store: 'clients', label: 'cliente' },
            fornecedor: { store: 'fornecedores', label: 'fornecedor' },
            estoque: { store: 'estoque', label: 'registro de estoque' },
            venda: { store: 'vendas', label: 'venda' },
        };
        const entry = map[type];
        if (!entry) {
            console.warn('Tipo desconhecido para exclusão:', type);
            return;
        }
        if (!confirm(`Deseja realmente excluir este ${entry.label}? Esta ação não pode ser desfeita.`)) return;
        try {
            await dbAPI.delete(entry.store, id);
            await refreshAllViews();
        } catch (err) {
            console.error(`Erro ao excluir ${entry.label}:`, err);
        }
    }

    /********************
     * Modals for CRUD
     ********************/
    // Product add modal
    async function openAddProductModal() {
        const categories = await dbAPI.getAll('categories');
        const options = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        const html = `
            <h3>Adicionar Produto</h3>
            <div class="form-group">
                <label>Nome</label>
                <input id="p-name" type="text" required />
            </div>
            <div class="form-group">
                <label>Categoria</label>
                <select id="p-category">${options}</select>
            </div>
            <div class="form-group">
                <label>Preço</label>
                <input id="p-price" type="number" step="0.01" min="0" required />
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea id="p-desc"></textarea>
            </div>
            <div class="form-actions">
                <button id="p-save" class="btn btn-primary">Salvar</button>
                <button id="p-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#p-name');
        by('#p-cancel', modal).addEventListener('click', hideModal);
        by('#p-save', modal).addEventListener('click', async () => {
            const name = by('#p-name', modal).value.trim();
            const categoryId = by('#p-category', modal).value;
            const price = parseFloat(by('#p-price', modal).value) || 0;
            const desc = by('#p-desc', modal).value.trim();

            if (!name) { alert('Nome é obrigatório.'); return; }
            try {
                await dbAPI.add('products', { name, categoryId, price, description: desc, status: 'ativo' });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao adicionar produto:', err);
                alert('Ocorreu um erro ao adicionar produto.');
            }
        });
    }

    async function openEditProductModal(productId) {
        const p = await dbAPI.get('products', productId);
        if (!p) { alert('Produto não encontrado.'); return; }
        const categories = await dbAPI.getAll('categories');
        const options = categories.map(c => `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
        const html = `
            <h3>Editar Produto</h3>
            <div class="form-group"><label>Nome</label><input id="p-name" type="text" value="${escapeHtml(p.name)}" /></div>
            <div class="form-group"><label>Categoria</label><select id="p-category">${options}</select></div>
            <div class="form-group"><label>Preço</label><input id="p-price" type="number" step="0.01" value="${Number(p.price).toFixed(2)}" /></div>
            <div class="form-group"><label>Descrição</label><textarea id="p-desc">${escapeHtml(p.description || '')}</textarea></div>
            <div class="form-group"><label>Status</label>
                <select id="p-status">
                    <option value="ativo" ${p.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                    <option value="inativo" ${p.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                </select>
            </div>
            <div class="form-actions">
                <button id="p-save" class="btn btn-primary">Salvar</button>
                <button id="p-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#p-name');
        by('#p-cancel', modal).addEventListener('click', hideModal);
        by('#p-save', modal).addEventListener('click', async () => {
            const name = by('#p-name', modal).value.trim();
            const categoryId = by('#p-category', modal).value;
            const price = parseFloat(by('#p-price', modal).value) || 0;
            const desc = by('#p-desc', modal).value.trim();
            const status = by('#p-status', modal).value;

            if (!name) { alert('Nome é obrigatório.'); return; }
            try {
                await dbAPI.put('products', { id: p.id, name, categoryId, price, description: desc, status });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao editar produto:', err);
                alert('Ocorreu um erro ao salvar alterações.');
            }
        });
    }

    // Stock modal for product quick add/edit
    async function openStockModalForProduct(productId) {
        const p = await dbAPI.get('products', productId);
        if (!p) { alert('Produto não encontrado.'); return; }
        // find estoque record
        const estoqueAll = await dbAPI.getAll('estoque');
        let record = estoqueAll.find(e => e.productId === productId);
        const currentQty = record ? Number(record.quantity) : 0;

        const html = `
            <h3>Estoque - ${escapeHtml(p.name)}</h3>
            <div class="form-group"><label>Quantidade Atual</label><input id="s-qty" type="number" value="${currentQty}" /></div>
            <div class="form-group"><label>Nova Quantidade (substituir)</label><input id="s-new" type="number" placeholder="Deixe vazio para não alterar" /></div>
            <div class="form-group"><label>Adicionar (+)</label><input id="s-add" type="number" placeholder="Ex.: 10" /></div>
            <div class="form-actions">
                <button id="s-save" class="btn btn-primary">Salvar</button>
                <button id="s-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#s-qty');

        by('#s-cancel', modal).addEventListener('click', hideModal);
        by('#s-save', modal).addEventListener('click', async () => {
            try {
                const newQtyRaw = by('#s-new', modal).value;
                const addRaw = by('#s-add', modal).value;

                let finalQty = currentQty;
                if (newQtyRaw !== '') {
                    finalQty = Number(newQtyRaw) || 0;
                }
                if (addRaw !== '') {
                    finalQty = finalQty + (Number(addRaw) || 0);
                }
                const now = new Date().toISOString();
                if (record) {
                    record.quantity = finalQty;
                    record.updatedAt = now;
                    await dbAPI.put('estoque', record);
                } else {
                    await dbAPI.add('estoque', { id: generateId(), productId, quantity: finalQty, updatedAt: now });
                }
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao atualizar estoque:', err);
                alert('Erro ao atualizar estoque.');
            }
        });
    }

    // Edit estoque by record id
    async function openEditEstoqueModal(estoqueId) {
        const e = await dbAPI.get('estoque', estoqueId);
        if (!e) { alert('Registro de estoque não encontrado.'); return; }
        const products = await dbAPI.getAll('products');
        const options = products.map(p => `<option value="${p.id}" ${p.id === e.productId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
        const html = `
            <h3>Editar Estoque</h3>
            <div class="form-group"><label>Produto</label><select id="e-product">${options}</select></div>
            <div class="form-group"><label>Quantidade</label><input id="e-qty" type="number" value="${Number(e.quantity)}" /></div>
            <div class="form-group"><label>Última Atualização</label><input id="e-upd" type="datetime-local" value="${toInputDatetimeLocal(e.updatedAt)}" /></div>
            <div class="form-actions">
                <button id="e-save" class="btn btn-primary">Salvar</button>
                <button id="e-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#e-product');
        by('#e-cancel', modal).addEventListener('click', hideModal);
        by('#e-save', modal).addEventListener('click', async () => {
            try {
                const productId = by('#e-product', modal).value;
                const qty = Number(by('#e-qty', modal).value) || 0;
                const upd = by('#e-upd', modal).value ? new Date(by('#e-upd', modal).value).toISOString() : new Date().toISOString();
                await dbAPI.put('estoque', { id: e.id, productId, quantity: qty, updatedAt: upd });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao salvar estoque:', err);
                alert('Erro ao salvar estoque.');
            }
        });
    }

    // Categories
    async function openAddCategoryModal() {
        const html = `
            <h3>Adicionar Categoria</h3>
            <div class="form-group"><label>Nome</label><input id="c-name" type="text" /></div>
            <div class="form-group"><label>Descrição</label><textarea id="c-desc"></textarea></div>
            <div class="form-actions">
                <button id="c-save" class="btn btn-primary">Salvar</button>
                <button id="c-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#c-name');
        by('#c-cancel', modal).addEventListener('click', hideModal);
        by('#c-save', modal).addEventListener('click', async () => {
            const name = by('#c-name', modal).value.trim();
            const desc = by('#c-desc', modal).value.trim();
            if (!name) { alert('Nome é obrigatório.'); return; }
            try {
                await dbAPI.add('categories', { id: generateId(), name, description: desc });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao adicionar categoria:', err);
                alert('Erro ao adicionar categoria.');
            }
        });
    }

    async function openEditCategoryModal(catId) {
        const c = await dbAPI.get('categories', catId);
        if (!c) { alert('Categoria não encontrada.'); return; }
        const html = `
            <h3>Editar Categoria</h3>
            <div class="form-group"><label>Nome</label><input id="c-name" type="text" value="${escapeHtml(c.name)}" /></div>
            <div class="form-group"><label>Descrição</label><textarea id="c-desc">${escapeHtml(c.description || '')}</textarea></div>
            <div class="form-actions">
                <button id="c-save" class="btn btn-primary">Salvar</button>
                <button id="c-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#c-name');
        by('#c-cancel', modal).addEventListener('click', hideModal);
        by('#c-save', modal).addEventListener('click', async () => {
            const name = by('#c-name', modal).value.trim();
            const desc = by('#c-desc', modal).value.trim();
            if (!name) { alert('Nome é obrigatório.'); return; }
            try {
                await dbAPI.put('categories', { id: c.id, name, description: desc });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao salvar categoria:', err);
                alert('Erro ao salvar categoria.');
            }
        });
    }

    // Clients
    async function openAddClientModal() {
        const html = `
            <h3>Adicionar Cliente</h3>
            <div class="form-group"><label>Nome</label><input id="cl-name" type="text" /></div>
            <div class="form-group"><label>CPF</label><input id="cl-cpf" type="text" /></div>
            <div class="form-group"><label>Email</label><input id="cl-email" type="email" /></div>
            <div class="form-group"><label>Telefone</label><input id="cl-phone" type="text" /></div>
            <div class="form-actions">
                <button id="cl-save" class="btn btn-primary">Salvar</button>
                <button id="cl-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#cl-name');
        by('#cl-cancel', modal).addEventListener('click', hideModal);
        by('#cl-save', modal).addEventListener('click', async () => {
            const name = by('#cl-name', modal).value.trim();
            if (!name) { alert('Nome é obrigatório.'); return; }
            try {
                await dbAPI.add('clients', { id: generateId(), name, cpf: by('#cl-cpf', modal).value.trim(), email: by('#cl-email', modal).value.trim(), phone: by('#cl-phone', modal).value.trim() });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao adicionar cliente:', err);
                alert('Erro ao adicionar cliente.');
            }
        });
    }

    async function openEditClientModal(clientId) {
        const c = await dbAPI.get('clients', clientId);
        if (!c) { alert('Cliente não encontrado.'); return; }
        const html = `
            <h3>Editar Cliente</h3>
            <div class="form-group"><label>Nome</label><input id="cl-name" type="text" value="${escapeHtml(c.name)}" /></div>
            <div class="form-group"><label>CPF</label><input id="cl-cpf" type="text" value="${escapeHtml(c.cpf || '')}" /></div>
            <div class="form-group"><label>Email</label><input id="cl-email" type="email" value="${escapeHtml(c.email || '')}" /></div>
            <div class="form-group"><label>Telefone</label><input id="cl-phone" type="text" value="${escapeHtml(c.phone || '')}" /></div>
            <div class="form-actions">
                <button id="cl-save" class="btn btn-primary">Salvar</button>
                <button id="cl-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#cl-name');
        by('#cl-cancel', modal).addEventListener('click', hideModal);
        by('#cl-save', modal).addEventListener('click', async () => {
            try {
                const name = by('#cl-name', modal).value.trim();
                if (!name) { alert('Nome é obrigatório.'); return; }
                await dbAPI.put('clients', { id: c.id, name, cpf: by('#cl-cpf', modal).value.trim(), email: by('#cl-email', modal).value.trim(), phone: by('#cl-phone', modal).value.trim() });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao editar cliente:', err);
                alert('Erro ao editar cliente.');
            }
        });
    }

    // Fornecedores
    async function openAddFornecedorModal() {
        const html = `
            <h3>Adicionar Fornecedor</h3>
            <div class="form-group"><label>Nome</label><input id="f-name" type="text" /></div>
            <div class="form-group"><label>Contato</label><input id="f-contact" type="text" /></div>
            <div class="form-group"><label>Telefone</label><input id="f-phone" type="text" /></div>
            <div class="form-group"><label>Email</label><input id="f-email" type="email" /></div>
            <div class="form-actions">
                <button id="f-save" class="btn btn-primary">Salvar</button>
                <button id="f-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#f-name');
        by('#f-cancel', modal).addEventListener('click', hideModal);
        by('#f-save', modal).addEventListener('click', async () => {
            const name = by('#f-name', modal).value.trim();
            if (!name) { alert('Nome é obrigatório.'); return; }
            try {
                await dbAPI.add('fornecedores', { id: generateId(), name, contact: by('#f-contact', modal).value.trim(), phone: by('#f-phone', modal).value.trim(), email: by('#f-email', modal).value.trim() });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao adicionar fornecedor:', err);
                alert('Erro ao adicionar fornecedor.');
            }
        });
    }

    async function openEditFornecedorModal(fId) {
        const f = await dbAPI.get('fornecedores', fId);
        if (!f) { alert('Fornecedor não encontrado.'); return; }
        const html = `
            <h3>Editar Fornecedor</h3>
            <div class="form-group"><label>Nome</label><input id="f-name" type="text" value="${escapeHtml(f.name)}" /></div>
            <div class="form-group"><label>Contato</label><input id="f-contact" type="text" value="${escapeHtml(f.contact || '')}" /></div>
            <div class="form-group"><label>Telefone</label><input id="f-phone" type="text" value="${escapeHtml(f.phone || '')}" /></div>
            <div class="form-group"><label>Email</label><input id="f-email" type="email" value="${escapeHtml(f.email || '')}" /></div>
            <div class="form-actions">
                <button id="f-save" class="btn btn-primary">Salvar</button>
                <button id="f-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '#f-name');
        by('#f-cancel', modal).addEventListener('click', hideModal);
        by('#f-save', modal).addEventListener('click', async () => {
            try {
                const name = by('#f-name', modal).value.trim();
                if (!name) { alert('Nome é obrigatório.'); return; }
                await dbAPI.put('fornecedores', { id: f.id, name, contact: by('#f-contact', modal).value.trim(), phone: by('#f-phone', modal).value.trim(), email: by('#f-email', modal).value.trim() });
                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao editar fornecedor:', err);
                alert('Erro ao editar fornecedor.');
            }
        });
    }

    // Vendas (basic add/view)
    async function openAddVendaModal() {
        const clients = await dbAPI.getAll('clients');
        const products = await dbAPI.getAll('products');
        if (!products.length) { alert('Cadastre ao menos um produto antes de registrar vendas.'); return; }

        const clientOptions = `<option value="">Consumidor</option>` + clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        const productOptions = products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

        const html = `
            <h3>Registrar Venda</h3>
            <div class="form-group"><label>Cliente</label><select id="v-client">${clientOptions}</select></div>
            <div id="v-items-container">
                <div class="v-item">
                    <div class="form-group"><label>Produto</label><select class="v-prod">${productOptions}</select></div>
                    <div class="form-group"><label>Quantidade</label><input class="v-qty" type="number" value="1" min="1" /></div>
                    <div class="form-group"><label>Preço unitário (opcional)</label><input class="v-price" type="number" step="0.01" /></div>
                </div>
            </div>
            <div style="margin:0.5rem 0">
                <button id="v-add-item" class="btn btn-secondary btn-small">Adicionar item</button>
            </div>
            <div class="form-actions">
                <button id="v-save" class="btn btn-primary">Salvar Venda</button>
                <button id="v-cancel" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        showModal(html, '.v-prod');

        by('#v-cancel', modal).addEventListener('click', hideModal);
        by('#v-add-item', modal).addEventListener('click', (e) => {
            e.preventDefault();
            const container = by('#v-items-container', modal);
            const div = document.createElement('div');
            div.className = 'v-item';
            div.innerHTML = `
                <div class="form-group"><label>Produto</label><select class="v-prod">${productOptions}</select></div>
                <div class="form-group"><label>Quantidade</label><input class="v-qty" type="number" value="1" min="1" /></div>
                <div class="form-group"><label>Preço unitário (opcional)</label><input class="v-price" type="number" step="0.01" /></div>
                <div><button class="v-remove btn btn-small btn-danger">Remover item</button></div>
            `;
            container.appendChild(div);
            div.querySelector('.v-remove').addEventListener('click', () => div.remove());
        });

        by('#v-save', modal).addEventListener('click', async () => {
            try {
                const clientId = by('#v-client', modal).value || null;
                const items = Array.from(modal.querySelectorAll('.v-item')).map(div => {
                    return {
                        productId: div.querySelector('.v-prod').value,
                        quantity: Number(div.querySelector('.v-qty').value) || 0,
                        unitPrice: div.querySelector('.v-price').value ? Number(div.querySelector('.v-price').value) : null
                    };
                }).filter(i => i.productId && i.quantity > 0);
                if (!items.length) { alert('Adicione ao menos um item com quantidade válida.'); return; }

                // calculate total (use product price if not provided)
                const productsMapArr = await dbAPI.getAll('products');
                const prodMap = new Map(productsMapArr.map(p => [p.id, p]));
                let total = 0;
                for (const it of items) {
                    const prod = prodMap.get(it.productId);
                    const price = it.unitPrice !== null ? it.unitPrice : (prod ? Number(prod.price) : 0);
                    total += price * it.quantity;
                }

                const venda = {
                    id: generateId(),
                    clientId,
                    items,
                    total,
                    date: new Date().toISOString(),
                    status: 'concluida'
                };
                await dbAPI.add('vendas', venda);

                // update estoque: subtract quantities
                const estoqueAll = await dbAPI.getAll('estoque');
                for (const it of items) {
                    let rec = estoqueAll.find(e => e.productId === it.productId);
                    if (rec) {
                        rec.quantity = Math.max(0, Number(rec.quantity) - Number(it.quantity));
                        rec.updatedAt = new Date().toISOString();
                        await dbAPI.put('estoque', rec);
                    } else {
                        await dbAPI.add('estoque', { id: generateId(), productId: it.productId, quantity: Math.max(0, -it.quantity), updatedAt: new Date().toISOString() });
                    }
                }

                hideModal();
                await refreshAllViews();
            } catch (err) {
                console.error('Erro ao salvar venda:', err);
                alert('Erro ao registrar venda.');
            }
        });
    }

    async function openViewVendaModal(vendaId) {
        const v = await dbAPI.get('vendas', vendaId);
        if (!v) { alert('Venda não encontrada.'); return; }
        const clients = await dbAPI.getAll('clients');
        const products = await dbAPI.getAll('products');
        const clientName = clients.find(c => c.id === v.clientId)?.name || 'Consumidor';

        const itemsHtml = v.items.map(it => {
            const prod = products.find(p => p.id === it.productId);
            const name = prod ? prod.name : 'Produto removido';
            const price = it.unitPrice !== null ? it.unitPrice : (prod ? prod.price : 0);
            return `<li>${escapeHtml(name)} — ${it.quantity} x ${formatCurrencyBRL(price)} = ${formatCurrencyBRL(price * it.quantity)}</li>`;
        }).join('');

        const html = `
            <h3>Venda — ${formatDateISOToBR(v.date)}</h3>
            <p><strong>Cliente:</strong> ${escapeHtml(clientName)}</p>
            <p><strong>Total:</strong> ${formatCurrencyBRL(v.total)}</p>
            <ul>${itemsHtml}</ul>
            <div class="form-actions">
                <button id="v-close" class="btn btn-secondary">Fechar</button>
            </div>
        `;
        showModal(html);
        by('#v-close', modal).addEventListener('click', hideModal);
    }

    /********************
     * Utilities / small helpers
     ********************/
    function escapeHtml(str = '') {
        return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    function toInputDatetimeLocal(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        // create YYYY-MM-DDTHH:MM for input[type=datetime-local]
        const pad = (n) => String(n).padStart(2, '0');
        const YYYY = d.getFullYear();
        const MM = pad(d.getMonth() + 1);
        const DD = pad(d.getDate());
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
    }

    /********************
     * Wire up header buttons to modal actions
     ********************/
    function wireHeaderButtons() {
        const btnAddProduct = by('#add-produto-btn');
        if (btnAddProduct) btnAddProduct.addEventListener('click', openAddProductModal);

        const btnAddCategoria = by('#add-categoria-btn');
        if (btnAddCategoria) btnAddCategoria.addEventListener('click', openAddCategoryModal);

        const btnAddCliente = by('#add-cliente-btn');
        if (btnAddCliente) btnAddCliente.addEventListener('click', openAddClientModal);

        const btnAddFornecedor = by('#add-fornecedor-btn');
        if (btnAddFornecedor) btnAddFornecedor.addEventListener('click', openAddFornecedorModal);

        const btnAddEntrada = by('#add-entrada-btn');
        if (btnAddEntrada) btnAddEntrada.addEventListener('click', async () => {
            // open a simplified entrada de estoque modal
            const products = await dbAPI.getAll('products');
            if (!products.length) { alert('Cadastre produtos antes de criar entradas de estoque.'); return; }
            const options = products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
            const html = `
                <h3>Nova Entrada de Estoque</h3>
                <div class="form-group"><label>Produto</label><select id="in-product">${options}</select></div>
                <div class="form-group"><label>Quantidade</label><input id="in-qty" type="number" value="1" min="1" /></div>
                <div class="form-actions">
                    <button id="in-save" class="btn btn-primary">Salvar</button>
                    <button id="in-cancel" class="btn btn-secondary">Cancelar</button>
                </div>
            `;
            showModal(html, '#in-product');
            by('#in-cancel', modal).addEventListener('click', hideModal);
            by('#in-save', modal).addEventListener('click', async () => {
                const productId = by('#in-product', modal).value;
                const qty = Number(by('#in-qty', modal).value) || 0;
                if (!qty || qty <= 0) { alert('Quantidade inválida.'); return; }
                try {
                    const estoqueAll = await dbAPI.getAll('estoque');
                    let rec = estoqueAll.find(e => e.productId === productId);
                    if (rec) {
                        rec.quantity = Number(rec.quantity) + qty;
                        rec.updatedAt = new Date().toISOString();
                        await dbAPI.put('estoque', rec);
                    } else {
                        await dbAPI.add('estoque', { id: generateId(), productId, quantity: qty, updatedAt: new Date().toISOString() });
                    }
                    hideModal();
                    await refreshAllViews();
                } catch (err) {
                    console.error('Erro ao adicionar entrada de estoque:', err);
                    alert('Erro ao processar entrada.');
                }
            });
        });

        const btnAddVenda = by('#add-venda-btn');
        if (btnAddVenda) btnAddVenda.addEventListener('click', openAddVendaModal);
    }

    /********************
     * Refresh all views
     ********************/
    async function refreshAllViews() {
        await Promise.all([
            renderProductsTable(),
            renderCategoriesTable(),
            renderClientsTable(),
            renderFornecedoresTable(),
            renderEstoqueTable(),
            renderVendasTable(),
            refreshDashboard()
        ]);
    }

    /********************
     * Init
     ********************/
    async function init() {
        try {
            await openDB(); // ensure DB ready
            await seedInitialData();
            wireHeaderButtons();
            await refreshAllViews();
            // default section
            setActiveSection('dashboard');

            // wire simple actions on nav to re-render when switching (keeps UI fresh)
            navButtons.forEach(btn => btn.addEventListener('click', refreshAllViews));
            console.info('GELP: inicializado com sucesso.');
        } catch (err) {
            console.error('Erro na inicialização do GELP:', err);
            alert('Erro ao iniciar aplicação. Verifique o console para mais detalhes.');
        }
    }

    // Start
    init();

})();
