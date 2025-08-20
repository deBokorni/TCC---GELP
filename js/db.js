// Gerenciador de banco de dados IndexedDB para o GELP
class GelpDB {
    constructor() {
        this.dbName = 'GelpDB';
        this.version = 1;
        this.db = null;
        
        // Definição dos object stores (tabelas)
        this.stores = {
            clientes: 'id',
            categorias: 'id',
            fornecedores: 'id',
            produtos: 'id',
            estoque: 'id',
            entradas_estoque: 'id',
            vendas: 'id',
            itens_venda: 'id'
        };
    }

    // Inicializar o banco de dados
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Erro ao abrir o banco de dados:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Banco de dados aberto com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Criando/atualizando estrutura do banco de dados');

                // Criar object stores se não existirem
                if (!db.objectStoreNames.contains('clientes')) {
                    const clientesStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
                    clientesStore.createIndex('cpf', 'cpf', { unique: true });
                    clientesStore.createIndex('email', 'email', { unique: false });
                }

                if (!db.objectStoreNames.contains('categorias')) {
                    const categoriasStore = db.createObjectStore('categorias', { keyPath: 'id', autoIncrement: true });
                    categoriasStore.createIndex('nomeCategoria', 'nomeCategoria', { unique: true });
                }

                if (!db.objectStoreNames.contains('fornecedores')) {
                    const fornecedoresStore = db.createObjectStore('fornecedores', { keyPath: 'id', autoIncrement: true });
                    fornecedoresStore.createIndex('nomeFornecedor', 'nomeFornecedor', { unique: true });
                }

                if (!db.objectStoreNames.contains('produtos')) {
                    const produtosStore = db.createObjectStore('produtos', { keyPath: 'id', autoIncrement: true });
                    produtosStore.createIndex('nome', 'nome', { unique: false });
                    produtosStore.createIndex('idCategoria', 'idCategoria', { unique: false });
                }

                if (!db.objectStoreNames.contains('estoque')) {
                    const estoqueStore = db.createObjectStore('estoque', { keyPath: 'id', autoIncrement: true });
                    estoqueStore.createIndex('idProduto', 'idProduto', { unique: true });
                }

                if (!db.objectStoreNames.contains('entradas_estoque')) {
                    const entradasStore = db.createObjectStore('entradas_estoque', { keyPath: 'id', autoIncrement: true });
                    entradasStore.createIndex('idProduto', 'idProduto', { unique: false });
                    entradasStore.createIndex('dataEntrada', 'dataEntrada', { unique: false });
                }

                if (!db.objectStoreNames.contains('vendas')) {
                    const vendasStore = db.createObjectStore('vendas', { keyPath: 'id', autoIncrement: true });
                    vendasStore.createIndex('idCliente', 'idCliente', { unique: false });
                    vendasStore.createIndex('dataVenda', 'dataVenda', { unique: false });
                }

                if (!db.objectStoreNames.contains('itens_venda')) {
                    const itensStore = db.createObjectStore('itens_venda', { keyPath: 'id', autoIncrement: true });
                    itensStore.createIndex('idVenda', 'idVenda', { unique: false });
                    itensStore.createIndex('idProduto', 'idProduto', { unique: false });
                }
            };
        });
    }

    // Método genérico para adicionar dados
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Método genérico para obter dados por ID
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Método genérico para obter todos os dados
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Método genérico para atualizar dados
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Método genérico para deletar dados
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Método para buscar por índice
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Método para buscar todos por índice
    async getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Métodos específicos para cada entidade

    // Clientes
    async addCliente(cliente) {
        return await this.add('clientes', cliente);
    }

    async getCliente(id) {
        return await this.get('clientes', id);
    }

    async getAllClientes() {
        return await this.getAll('clientes');
    }

    async updateCliente(cliente) {
        return await this.update('clientes', cliente);
    }

    async deleteCliente(id) {
        return await this.delete('clientes', id);
    }

    async getClienteByCPF(cpf) {
        return await this.getByIndex('clientes', 'cpf', cpf);
    }

    // Categorias
    async addCategoria(categoria) {
        return await this.add('categorias', categoria);
    }

    async getCategoria(id) {
        return await this.get('categorias', id);
    }

    async getAllCategorias() {
        return await this.getAll('categorias');
    }

    async updateCategoria(categoria) {
        return await this.update('categorias', categoria);
    }

    async deleteCategoria(id) {
        return await this.delete('categorias', id);
    }

    // Fornecedores
    async addFornecedor(fornecedor) {
        return await this.add('fornecedores', fornecedor);
    }

    async getFornecedor(id) {
        return await this.get('fornecedores', id);
    }

    async getAllFornecedores() {
        return await this.getAll('fornecedores');
    }

    async updateFornecedor(fornecedor) {
        return await this.update('fornecedores', fornecedor);
    }

    async deleteFornecedor(id) {
        return await this.delete('fornecedores', id);
    }

    // Produtos
    async addProduto(produto) {
        return await this.add('produtos', produto);
    }

    async getProduto(id) {
        return await this.get('produtos', id);
    }

    async getAllProdutos() {
        return await this.getAll('produtos');
    }

    async updateProduto(produto) {
        return await this.update('produtos', produto);
    }

    async deleteProduto(id) {
        return await this.delete('produtos', id);
    }

    async getProdutosByCategoria(idCategoria) {
        return await this.getAllByIndex('produtos', 'idCategoria', idCategoria);
    }

    // Estoque
    async addEstoque(estoque) {
        return await this.add('estoque', estoque);
    }

    async getEstoque(id) {
        return await this.get('estoque', id);
    }

    async getAllEstoque() {
        return await this.getAll('estoque');
    }

    async updateEstoque(estoque) {
        return await this.update('estoque', estoque);
    }

    async deleteEstoque(id) {
        return await this.delete('estoque', id);
    }

    async getEstoquePorProduto(idProduto) {
        return await this.getByIndex('estoque', 'idProduto', idProduto);
    }

    // Entradas de Estoque
    async addEntradaEstoque(entrada) {
        return await this.add('entradas_estoque', entrada);
    }

    async getEntradaEstoque(id) {
        return await this.get('entradas_estoque', id);
    }

    async getAllEntradasEstoque() {
        return await this.getAll('entradas_estoque');
    }

    async updateEntradaEstoque(entrada) {
        return await this.update('entradas_estoque', entrada);
    }

    async deleteEntradaEstoque(id) {
        return await this.delete('entradas_estoque', id);
    }

    async getEntradasPorProduto(idProduto) {
        return await this.getAllByIndex('entradas_estoque', 'idProduto', idProduto);
    }

    // Vendas
    async addVenda(venda) {
        return await this.add('vendas', venda);
    }

    async getVenda(id) {
        return await this.get('vendas', id);
    }

    async getAllVendas() {
        return await this.getAll('vendas');
    }

    async updateVenda(venda) {
        return await this.update('vendas', venda);
    }

    async deleteVenda(id) {
        return await this.delete('vendas', id);
    }

    async getVendasPorCliente(idCliente) {
        return await this.getAllByIndex('vendas', 'idCliente', idCliente);
    }

    // Itens de Venda
    async addItemVenda(item) {
        return await this.add('itens_venda', item);
    }

    async getItemVenda(id) {
        return await this.get('itens_venda', id);
    }

    async getAllItensVenda() {
        return await this.getAll('itens_venda');
    }

    async updateItemVenda(item) {
        return await this.update('itens_venda', item);
    }

    async deleteItemVenda(id) {
        return await this.delete('itens_venda', id);
    }

    async getItensPorVenda(idVenda) {
        return await this.getAllByIndex('itens_venda', 'idVenda', idVenda);
    }

    async getItensPorProduto(idProduto) {
        return await this.getAllByIndex('itens_venda', 'idProduto', idProduto);
    }

    // Método para limpar todos os dados (útil para testes)
    async clearAllData() {
        const storeNames = Object.keys(this.stores);
        const transaction = this.db.transaction(storeNames, 'readwrite');
        
        for (const storeName of storeNames) {
            const store = transaction.objectStore(storeName);
            store.clear();
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log('Todos os dados foram limpos');
                resolve();
            };
            
            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }

    // Método para popular dados de exemplo
    async populateExampleData() {
        try {
            // Adicionar categorias de exemplo (removendo o id null para auto-incremento)
            const categoriaFrutas = { nomeCategoria: 'Frutas', descricao: 'Frutas frescas e secas' };
            const categoriaLaticinios = { nomeCategoria: 'Laticínios', descricao: 'Produtos derivados do leite' };
            const categoriaPadaria = { nomeCategoria: 'Padaria', descricao: 'Pães, bolos e doces' };

            const idCategoriaFrutas = await this.addCategoria(categoriaFrutas);
            const idCategoriaLaticinios = await this.addCategoria(categoriaLaticinios);
            const idCategoriaPadaria = await this.addCategoria(categoriaPadaria);

            // Adicionar fornecedores de exemplo (removendo o id null para auto-incremento)
            const fornecedor1 = { nomeFornecedor: 'Fazenda Verde', contato: 'João Silva', telefone: '11987654321', email: 'joao.silva@fazendaverde.com.br' };
            const fornecedor2 = { nomeFornecedor: 'Laticínios Bom Leite', contato: 'Maria Souza', telefone: '21998765432', email: 'maria.souza@bomleite.com.br' };

            const idFornecedor1 = await this.addFornecedor(fornecedor1);
            const idFornecedor2 = await this.addFornecedor(fornecedor2);

            // Adicionar produtos de exemplo (removendo o id null para auto-incremento)
            const produto1 = { nome: 'Maçã Gala', idCategoria: idCategoriaFrutas, precoVendaUnitario: 5.50, descricao: 'Maçã doce e crocante', ativo: true };
            const produto2 = { nome: 'Leite Integral 1L', idCategoria: idCategoriaLaticinios, precoVendaUnitario: 4.20, descricao: 'Leite integral pasteurizado', ativo: true };
            const produto3 = { nome: 'Pão Francês', idCategoria: idCategoriaPadaria, precoVendaUnitario: 0.80, descricao: 'Pão crocante, unidade', ativo: true };

            const idProduto1 = await this.addProduto(produto1);
            const idProduto2 = await this.addProduto(produto2);
            const idProduto3 = await this.addProduto(produto3);

            // Adicionar clientes de exemplo (removendo o id null para auto-incremento)
            const cliente1 = { cpf: '12345678900', nome: 'Ana Paula', email: 'ana.paula@email.com', telefone: '31987654321', endereco: 'Rua A, 123, Cidade X' };
            const cliente2 = { cpf: '98765432100', nome: 'Bruno Costa', email: 'bruno.costa@email.com', telefone: '41998765432', endereco: 'Av. B, 456, Cidade Y' };

            const idCliente1 = await this.addCliente(cliente1);
            const idCliente2 = await this.addCliente(cliente2);

            // Adicionar entradas de estoque de exemplo (removendo o id null para auto-incremento)
            const entrada1 = { idProduto: idProduto1, idFornecedor: idFornecedor1, quantidade: 100, precoCustoUnitario: 3.00, dataEntrada: new Date().toISOString(), dataValidade: '2025-08-30', numeroLote: 'LOTE001' };
            const entrada2 = { idProduto: idProduto2, idFornecedor: idFornecedor2, quantidade: 50, precoCustoUnitario: 2.50, dataEntrada: new Date().toISOString(), dataValidade: '2025-09-15', numeroLote: 'LOTE002' };

            await this.addEntradaEstoque(entrada1);
            await this.addEntradaEstoque(entrada2);

            // Adicionar estoque de exemplo (removendo o id null para auto-incremento)
            const estoque1 = { idProduto: idProduto1, quantidadeAtual: 100, ultimaAtualizacao: new Date().toISOString() };
            const estoque2 = { idProduto: idProduto2, quantidadeAtual: 50, ultimaAtualizacao: new Date().toISOString() };
            const estoque3 = { idProduto: idProduto3, quantidadeAtual: 200, ultimaAtualizacao: new Date().toISOString() };

            await this.addEstoque(estoque1);
            await this.addEstoque(estoque2);
            await this.addEstoque(estoque3);

            console.log('Dados de exemplo adicionados com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar dados de exemplo:', error);
        }
    }
}

// Criar instância global do banco de dados
window.gelpDB = new GelpDB();

