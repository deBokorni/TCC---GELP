// Aplicação principal do GELP
class GelpApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.modal = null;
        this.init();
    }

    async init() {
        try {
            // Inicializar banco de dados
            await gelpDB.init();
            console.log('Aplicação GELP inicializada com sucesso');

            // Verificar se é a primeira execução e popular dados de exemplo
            const produtos = await gelpDB.getAllProdutos();
            if (produtos.length === 0) {
                console.log('Primeira execução detectada, adicionando dados de exemplo...');
                await gelpDB.populateExampleData();
            }

            // Configurar eventos
            this.setupEventListeners();
            
            // Carregar seção inicial
            this.showSection('dashboard');
            
            // Atualizar dashboard
            this.updateDashboard();
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            alert('Erro ao inicializar a aplicação. Verifique se seu navegador suporta IndexedDB.');
        }
    }

    setupEventListeners() {
        // Navegação
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Botões de adicionar
        document.getElementById('add-produto-btn').addEventListener('click', () => this.showProdutoModal());
        document.getElementById('add-entrada-btn').addEventListener('click', () => this.showEntradaModal());
        document.getElementById('add-venda-btn').addEventListener('click', () => this.showVendaModal());
        document.getElementById('add-cliente-btn').addEventListener('click', () => this.showClienteModal());
        document.getElementById('add-fornecedor-btn').addEventListener('click', () => this.showFornecedorModal());
        document.getElementById('add-categoria-btn').addEventListener('click', () => this.showCategoriaModal());

        // Modal
        this.modal = document.getElementById('modal');
        const closeBtn = document.querySelector('.close');
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // Fechar modal clicando fora
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    showSection(sectionName) {
        // Atualizar navegação
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionName) {
                btn.classList.add('active');
            }
        });

        // Mostrar seção
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Carregar dados da seção
            this.loadSectionData(sectionName);
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.updateDashboard();
                break;
            case 'produtos':
                await this.loadProdutos();
                break;
            case 'estoque':
                await this.loadEstoque();
                break;
            case 'vendas':
                await this.loadVendas();
                break;
            case 'clientes':
                await this.loadClientes();
                break;
            case 'fornecedores':
                await this.loadFornecedores();
                break;
            case 'categorias':
                await this.loadCategorias();
                break;
        }
    }

    async updateDashboard() {
        try {
            const produtos = await gelpDB.getAllProdutos();
            const estoque = await gelpDB.getAllEstoque();
            const vendas = await gelpDB.getAllVendas();
            const clientes = await gelpDB.getAllClientes();

            // Filtrar vendas de hoje
            const hoje = new Date().toDateString();
            const vendasHoje = vendas.filter(venda => {
                const dataVenda = new Date(venda.dataVenda).toDateString();
                return dataVenda === hoje;
            });

            // Produtos em estoque (quantidade > 0)
            const produtosEmEstoque = estoque.filter(item => item.quantidadeAtual > 0);

            // Atualizar cards
            document.getElementById('total-produtos').textContent = produtos.length;
            document.getElementById('produtos-estoque').textContent = produtosEmEstoque.length;
            document.getElementById('vendas-hoje').textContent = vendasHoje.length;
            document.getElementById('total-clientes').textContent = clientes.length;
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
        }
    }

    async loadProdutos() {
        try {
            const produtos = await gelpDB.getAllProdutos();
            const categorias = await gelpDB.getAllCategorias();
            
            // Criar mapa de categorias para lookup rápido
            const categoriaMap = {};
            categorias.forEach(cat => {
                categoriaMap[cat.id] = cat.nomeCategoria;
            });

            const tbody = document.querySelector('#produtos-table tbody');
            tbody.innerHTML = '';

            produtos.forEach(produto => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${produto.nome}</td>
                    <td>${categoriaMap[produto.idCategoria] || 'N/A'}</td>
                    <td>${FormatUtils.formatCurrency(produto.precoVendaUnitario)}</td>
                    <td><span class="status-badge ${produto.ativo ? 'status-ativo' : 'status-inativo'}">${produto.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td class="actions">
                        <button class="btn btn-small btn-warning" onclick="app.editProduto(${produto.id})">Editar</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteProduto(${produto.id})">Excluir</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    }

    async loadEstoque() {
        try {
            const estoque = await gelpDB.getAllEstoque();
            const produtos = await gelpDB.getAllProdutos();
            
            // Criar mapa de produtos para lookup rápido
            const produtoMap = {};
            produtos.forEach(prod => {
                produtoMap[prod.id] = prod.nome;
            });

            const tbody = document.querySelector('#estoque-table tbody');
            tbody.innerHTML = '';

            estoque.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${produtoMap[item.idProduto] || 'N/A'}</td>
                    <td>${item.quantidadeAtual}</td>
                    <td>${FormatUtils.formatDateTime(item.ultimaAtualizacao)}</td>
                    <td class="actions">
                        <button class="btn btn-small btn-warning" onclick="app.editEstoque(${item.id})">Editar</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
        }
    }

    async loadVendas() {
        try {
            const vendas = await gelpDB.getAllVendas();
            const clientes = await gelpDB.getAllClientes();
            
            // Criar mapa de clientes para lookup rápido
            const clienteMap = {};
            clientes.forEach(cliente => {
                clienteMap[cliente.id] = cliente.nome;
            });

            const tbody = document.querySelector('#vendas-table tbody');
            tbody.innerHTML = '';

            vendas.forEach(venda => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${FormatUtils.formatDateTime(venda.dataVenda)}</td>
                    <td>${venda.idCliente ? clienteMap[venda.idCliente] || 'N/A' : 'Cliente Avulso'}</td>
                    <td>${FormatUtils.formatCurrency(venda.valorTotalVenda)}</td>
                    <td><span class="status-badge ${venda.statusVenda.toLowerCase().replace('í', 'i')}">${venda.statusVenda}</span></td>
                    <td class="actions">
                        <button class="btn btn-small btn-secondary" onclick="app.viewVenda(${venda.id})">Ver</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteVenda(${venda.id})">Excluir</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
        }
    }

    async loadClientes() {
        try {
            const clientes = await gelpDB.getAllClientes();

            const tbody = document.querySelector('#clientes-table tbody');
            tbody.innerHTML = '';

            clientes.forEach(cliente => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cliente.nome}</td>
                    <td>${FormatUtils.formatCPF(cliente.cpf)}</td>
                    <td>${cliente.email || 'N/A'}</td>
                    <td>${cliente.telefone || 'N/A'}</td>
                    <td class="actions">
                        <button class="btn btn-small btn-warning" onclick="app.editCliente(${cliente.id})">Editar</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteCliente(${cliente.id})">Excluir</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    async loadFornecedores() {
        try {
            const fornecedores = await gelpDB.getAllFornecedores();

            const tbody = document.querySelector('#fornecedores-table tbody');
            tbody.innerHTML = '';

            fornecedores.forEach(fornecedor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fornecedor.nomeFornecedor}</td>
                    <td>${fornecedor.contato || 'N/A'}</td>
                    <td>${fornecedor.telefone || 'N/A'}</td>
                    <td>${fornecedor.email || 'N/A'}</td>
                    <td class="actions">
                        <button class="btn btn-small btn-warning" onclick="app.editFornecedor(${fornecedor.id})">Editar</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteFornecedor(${fornecedor.id})">Excluir</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
        }
    }

    async loadCategorias() {
        try {
            const categorias = await gelpDB.getAllCategorias();

            const tbody = document.querySelector('#categorias-table tbody');
            tbody.innerHTML = '';

            categorias.forEach(categoria => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${categoria.nomeCategoria}</td>
                    <td>${categoria.descricao || 'N/A'}</td>
                    <td class="actions">
                        <button class="btn btn-small btn-warning" onclick="app.editCategoria(${categoria.id})">Editar</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteCategoria(${categoria.id})">Excluir</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    }

    // Métodos para modais
    showModal(title, content) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h2>${title}</h2>
            ${content}
        `;
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    async showProdutoModal(produto = null) {
        const categorias = await gelpDB.getAllCategorias();
        const isEdit = produto !== null;
        
        let categoriasOptions = '';
        categorias.forEach(cat => {
            const selected = isEdit && produto.idCategoria === cat.id ? 'selected' : '';
            categoriasOptions += `<option value="${cat.id}" ${selected}>${cat.nomeCategoria}</option>`;
        });

        const content = `
            <form id="produto-form">
                <div class="form-group">
                    <label for="produto-nome">Nome do Produto:</label>
                    <input type="text" id="produto-nome" name="nome" value="${isEdit ? produto.nome : ''}" required>
                </div>
                <div class="form-group">
                    <label for="produto-categoria">Categoria:</label>
                    <select id="produto-categoria" name="idCategoria" required>
                        <option value="">Selecione uma categoria</option>
                        ${categoriasOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="produto-preco">Preço de Venda:</label>
                    <input type="number" id="produto-preco" name="precoVendaUnitario" value="${isEdit ? produto.precoVendaUnitario : ''}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="produto-descricao">Descrição:</label>
                    <textarea id="produto-descricao" name="descricao">${isEdit ? produto.descricao || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="produto-ativo" name="ativo" ${isEdit ? (produto.ativo ? 'checked' : '') : 'checked'}>
                        Produto Ativo
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Atualizar' : 'Adicionar'}</button>
                </div>
            </form>
        `;

        this.showModal(isEdit ? 'Editar Produto' : 'Adicionar Produto', content);

        // Configurar evento do formulário
        document.getElementById('produto-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveProduto(isEdit ? produto.id : null);
        });
    }

    async saveProduto(id = null) {
        try {
            const form = document.getElementById('produto-form');
            const formData = new FormData(form);
            
            const produtoData = {
                nome: formData.get('nome'),
                idCategoria: parseInt(formData.get('idCategoria')),
                precoVendaUnitario: parseFloat(formData.get('precoVendaUnitario')),
                descricao: formData.get('descricao'),
                ativo: formData.get('ativo') === 'on'
            };

            const produto = new Produto(id, produtoData.nome, produtoData.idCategoria, produtoData.precoVendaUnitario, produtoData.descricao, produtoData.ativo);
            
            const errors = produto.validate();
            if (errors.length > 0) {
                alert('Erros de validação:\n' + errors.join('\n'));
                return;
            }

            if (id) {
                await gelpDB.updateProduto(produto);
            } else {
                const newId = await gelpDB.addProduto(produto);
                // Criar registro de estoque inicial
                const estoque = new Estoque(null, newId, 0);
                await gelpDB.addEstoque(estoque);
            }

            this.closeModal();
            await this.loadProdutos();
            await this.updateDashboard();
            
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto');
        }
    }

    async editProduto(id) {
        const produto = await gelpDB.getProduto(id);
        if (produto) {
            this.showProdutoModal(produto);
        }
    }

    async deleteProduto(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await gelpDB.deleteProduto(id);
                await gelpDB.deleteEstoque(id); // Remover estoque relacionado
                await this.loadProdutos();
                await this.updateDashboard();
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                alert('Erro ao excluir produto');
            }
        }
    }

    // Implementar outros métodos similares para as demais entidades...
    // Por questões de espaço, vou implementar apenas alguns exemplos

    async showCategoriaModal(categoria = null) {
        const isEdit = categoria !== null;
        
        const content = `
            <form id="categoria-form">
                <div class="form-group">
                    <label for="categoria-nome">Nome da Categoria:</label>
                    <input type="text" id="categoria-nome" name="nomeCategoria" value="${isEdit ? categoria.nomeCategoria : ''}" required>
                </div>
                <div class="form-group">
                    <label for="categoria-descricao">Descrição:</label>
                    <textarea id="categoria-descricao" name="descricao">${isEdit ? categoria.descricao || '' : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Atualizar' : 'Adicionar'}</button>
                </div>
            </form>
        `;

        this.showModal(isEdit ? 'Editar Categoria' : 'Adicionar Categoria', content);

        document.getElementById('categoria-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCategoria(isEdit ? categoria.id : null);
        });
    }

    async saveCategoria(id = null) {
        try {
            const form = document.getElementById('categoria-form');
            const formData = new FormData(form);
            
            const categoria = new Categoria(id, formData.get('nomeCategoria'), formData.get('descricao'));
            
            const errors = categoria.validate();
            if (errors.length > 0) {
                alert('Erros de validação:\n' + errors.join('\n'));
                return;
            }

            if (id) {
                await gelpDB.updateCategoria(categoria);
            } else {
                await gelpDB.addCategoria(categoria);
            }

            this.closeModal();
            await this.loadCategorias();
            
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            alert('Erro ao salvar categoria');
        }
    }

    async editCategoria(id) {
        const categoria = await gelpDB.getCategoria(id);
        if (categoria) {
            this.showCategoriaModal(categoria);
        }
    }

    async deleteCategoria(id) {
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
            try {
                await gelpDB.deleteCategoria(id);
                await this.loadCategorias();
            } catch (error) {
                console.error('Erro ao excluir categoria:', error);
                alert('Erro ao excluir categoria');
            }
        }
    }

    // Métodos placeholder para outras funcionalidades
    showEntradaModal() {
        alert('Funcionalidade de entrada de estoque em desenvolvimento');
    }

    showVendaModal() {
        alert('Funcionalidade de vendas em desenvolvimento');
    }

    showClienteModal() {
        alert('Funcionalidade de clientes em desenvolvimento');
    }

    showFornecedorModal() {
        alert('Funcionalidade de fornecedores em desenvolvimento');
    }

    editEstoque(id) {
        alert('Funcionalidade de edição de estoque em desenvolvimento');
    }

    viewVenda(id) {
        alert('Funcionalidade de visualização de venda em desenvolvimento');
    }

    deleteVenda(id) {
        alert('Funcionalidade de exclusão de venda em desenvolvimento');
    }

    editCliente(id) {
        alert('Funcionalidade de edição de cliente em desenvolvimento');
    }

    deleteCliente(id) {
        alert('Funcionalidade de exclusão de cliente em desenvolvimento');
    }

    editFornecedor(id) {
        alert('Funcionalidade de edição de fornecedor em desenvolvimento');
    }

    deleteFornecedor(id) {
        alert('Funcionalidade de exclusão de fornecedor em desenvolvimento');
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GelpApp();
});

