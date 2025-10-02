
// Representam as entidades do banco de dados como classes JavaScript

class Cliente {
    constructor(id = null, cpf, nome, email = null, telefone = null, endereco = null) {
        this.id = id;
        this.cpf = cpf;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.endereco = endereco;
    }

    // Validação básica
    validate() {
        const errors = [];
        
        if (!this.cpf || this.cpf.trim() === '') {
            errors.push('CPF é obrigatório');
        }
        
        if (!this.nome || this.nome.trim() === '') {
            errors.push('Nome é obrigatório');
        }
        
        if (this.email && !this.isValidEmail(this.email)) {
            errors.push('Email inválido');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

class Categoria {
    constructor(id = null, nomeCategoria, descricao = null) {
        this.id = id;
        this.nomeCategoria = nomeCategoria;
        this.descricao = descricao;
    }

    validate() {
        const errors = [];
        
        if (!this.nomeCategoria || this.nomeCategoria.trim() === '') {
            errors.push('Nome da categoria é obrigatório');
        }
        
        return errors;
    }
}

class Fornecedor {
    constructor(id = null, nomeFornecedor, contato = null, telefone = null, email = null) {
        this.id = id;
        this.nomeFornecedor = nomeFornecedor;
        this.contato = contato;
        this.telefone = telefone;
        this.email = email;
    }

    validate() {
        const errors = [];
        
        if (!this.nomeFornecedor || this.nomeFornecedor.trim() === '') {
            errors.push('Nome do fornecedor é obrigatório');
        }
        
        if (this.email && !this.isValidEmail(this.email)) {
            errors.push('Email inválido');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

class Produto {
    constructor(id = null, nome, idCategoria, precoVendaUnitario, descricao = null, ativo = true) {
        this.id = id;
        this.nome = nome;
        this.idCategoria = idCategoria;
        this.precoVendaUnitario = parseFloat(precoVendaUnitario);
        this.descricao = descricao;
        this.ativo = ativo;
    }

    validate() {
        const errors = [];
        
        if (!this.nome || this.nome.trim() === '') {
            errors.push('Nome do produto é obrigatório');
        }
        
        if (!this.idCategoria) {
            errors.push('Categoria é obrigatória');
        }
        
        if (!this.precoVendaUnitario || this.precoVendaUnitario < 0) {
            errors.push('Preço de venda deve ser maior ou igual a zero');
        }
        
        return errors;
    }
}

class Estoque {
    constructor(id = null, idProduto, quantidadeAtual = 0, ultimaAtualizacao = null) {
        this.id = id;
        this.idProduto = idProduto;
        this.quantidadeAtual = parseInt(quantidadeAtual);
        this.ultimaAtualizacao = ultimaAtualizacao || new Date().toISOString();
    }

    validate() {
        const errors = [];
        
        if (!this.idProduto) {
            errors.push('Produto é obrigatório');
        }
        
        if (this.quantidadeAtual < 0) {
            errors.push('Quantidade não pode ser negativa');
        }
        
        return errors;
    }
}

class EntradaEstoque {
    constructor(id = null, idProduto, idFornecedor = null, quantidade, precoCustoUnitario, dataEntrada = null, dataValidade = null, numeroLote = null) {
        this.id = id;
        this.idProduto = idProduto;
        this.idFornecedor = idFornecedor;
        this.quantidade = parseInt(quantidade);
        this.precoCustoUnitario = parseFloat(precoCustoUnitario);
        this.dataEntrada = dataEntrada || new Date().toISOString();
        this.dataValidade = dataValidade;
        this.numeroLote = numeroLote;
    }

    validate() {
        const errors = [];
        
        if (!this.idProduto) {
            errors.push('Produto é obrigatório');
        }
        
        if (!this.quantidade || this.quantidade <= 0) {
            errors.push('Quantidade deve ser maior que zero');
        }
        
        if (!this.precoCustoUnitario || this.precoCustoUnitario < 0) {
            errors.push('Preço de custo deve ser maior ou igual a zero');
        }
        
        return errors;
    }
}

class Venda {
    constructor(id = null, idCliente = null, dataVenda = null, valorTotalVenda = 0, statusVenda = 'Concluida') {
        this.id = id;
        this.idCliente = idCliente;
        this.dataVenda = dataVenda || new Date().toISOString();
        this.valorTotalVenda = parseFloat(valorTotalVenda);
        this.statusVenda = statusVenda;
    }

    validate() {
        const errors = [];
        
        if (this.valorTotalVenda < 0) {
            errors.push('Valor total não pode ser negativo');
        }
        
        const statusValidos = ['Concluida', 'Pendente', 'Cancelada'];
        if (!statusValidos.includes(this.statusVenda)) {
            errors.push('Status da venda inválido');
        }
        
        return errors;
    }
}

class ItemVenda {
    constructor(id = null, idVenda, idProduto, quantidade, precoUnitarioVenda, subtotal = null) {
        this.id = id;
        this.idVenda = idVenda;
        this.idProduto = idProduto;
        this.quantidade = parseInt(quantidade);
        this.precoUnitarioVenda = parseFloat(precoUnitarioVenda);
        this.subtotal = subtotal !== null ? parseFloat(subtotal) : this.quantidade * this.precoUnitarioVenda;
    }

    validate() {
        const errors = [];
        
        if (!this.idVenda) {
            errors.push('Venda é obrigatória');
        }
        
        if (!this.idProduto) {
            errors.push('Produto é obrigatório');
        }
        
        if (!this.quantidade || this.quantidade <= 0) {
            errors.push('Quantidade deve ser maior que zero');
        }
        
        if (!this.precoUnitarioVenda || this.precoUnitarioVenda < 0) {
            errors.push('Preço unitário deve ser maior ou igual a zero');
        }
        
        return errors;
    }

    // Recalcula o subtotal
    calculateSubtotal() {
        this.subtotal = this.quantidade * this.precoUnitarioVenda;
        return this.subtotal;
    }
}

// Utilitários para formatação
class FormatUtils {
    static formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    static formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    static cleanCPF(cpf) {
        return cpf.replace(/\D/g, '');
    }

    static isValidCPF(cpf) {
        cpf = this.cleanCPF(cpf);
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;

        return true;
    }
}

// Exportar as classes para uso global
window.Cliente = Cliente;
window.Categoria = Categoria;
window.Fornecedor = Fornecedor;
window.Produto = Produto;
window.Estoque = Estoque;
window.EntradaEstoque = EntradaEstoque;
window.Venda = Venda;
window.ItemVenda = ItemVenda;
window.FormatUtils = FormatUtils;

