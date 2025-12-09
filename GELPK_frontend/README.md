# GELPK - Gerenciador de Estoque Leandro, Pedro e Kaio

## Descrição

O GELPK é um sistema web de gerenciamento de estoque moderno, leve e direto, desenvolvido especificamente para pequenos comércios como padarias, mercearias, disks, minimercados e empreendedores iniciantes. O sistema utiliza tecnologias web puras (HTML, CSS e JavaScript) e armazena todos os dados localmente no navegador do usuário através do IndexedDB.

## Características Principais

- **Moderno e Leve**: Interface limpa e responsiva que funciona em desktop e mobile
- **Direto ao Ponto**: Focado na funcionalidade essencial sem complexidades desnecessárias
- **Armazenamento Local**: Todos os dados são salvos no navegador do usuário (IndexedDB)
- **Sem Dependências**: Não requer servidor, banco de dados externo ou bibliotecas adicionais
- **Monetização Não Invasiva**: Espaços reservados para anúncios discretos
- **Responsivo**: Funciona perfeitamente em celulares, tablets e desktops

## Funcionalidades Implementadas

### Dashboard
- Visão geral com estatísticas principais
- Total de produtos cadastrados
- Produtos em estoque
- Vendas do dia
- Total de clientes

### Gestão de Produtos
- Cadastro de produtos com nome, categoria, preço e descrição
- Listagem de produtos com filtros
- Edição e exclusão de produtos
- Status ativo/inativo

### Gestão de Categorias
- Cadastro de categorias de produtos
- Organização e classificação
- Edição e exclusão de categorias

### Gestão de Estoque
- Controle de quantidade atual
- Histórico de entradas
- Rastreamento por produto
- Data de última atualização

### Gestão de Clientes
- Cadastro completo de clientes
- CPF, nome, email, telefone e endereço
- Histórico de compras (estrutura preparada)

### Gestão de Fornecedores
- Cadastro de fornecedores
- Informações de contato
- Vinculação com produtos

### Gestão de Vendas
- Registro de vendas (estrutura preparada)
- Controle de itens vendidos
- Histórico de transações

## Estrutura do Projeto

```
gelp-frontend/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos globais
├── js/
│   ├── main.js         # Lógica principal da aplicação
│   ├── db.js           # Gerenciamento do IndexedDB
│   └── models.js       # Modelos de dados e validações
└── README.md           # Este arquivo
```

## Como Executar

1. **Baixe todos os arquivos** para uma pasta em seu computador
2. **Abra o arquivo `index.html`** em qualquer navegador moderno
3. **Pronto!** O sistema estará funcionando e carregará dados de exemplo na primeira execução

### Navegadores Suportados
- Chrome 58+
- Firefox 55+
- Safari 10+
- Edge 79+

## Armazenamento de Dados

O sistema utiliza o **IndexedDB** do navegador para armazenar todos os dados localmente. Isso significa que:

- ✅ **Privacidade Total**: Seus dados nunca saem do seu computador
- ✅ **Funciona Offline**: Não precisa de internet após o carregamento inicial
- ✅ **Gratuito**: Não há custos de servidor ou banco de dados
- ✅ **Rápido**: Acesso instantâneo aos dados
- ⚠️ **Backup Manual**: Recomenda-se fazer backup dos dados importantes

## Monetização

O sistema inclui espaços reservados para anúncios não invasivos:
- Um espaço no dashboard
- Um espaço no rodapé

Estes espaços podem ser utilizados para:
- Anúncios de produtos relacionados
- Dicas de gestão
- Promoções de fornecedores locais
- Conteúdo educativo

## Expansões Futuras

O sistema foi desenvolvido com uma arquitetura extensível, permitindo futuras melhorias:

- Sistema completo de vendas com carrinho
- Relatórios e gráficos
- Backup e sincronização na nuvem
- Integração com sistemas de pagamento
- Controle de usuários e permissões
- API para integração com outros sistemas

## Suporte Técnico

Para dúvidas ou problemas:
1. Verifique se está usando um navegador moderno
2. Certifique-se de que o JavaScript está habilitado
3. Limpe o cache do navegador se necessário
4. Verifique o console do navegador (F12) para erros

## Licença

Este projeto foi desenvolvido especificamente para o TCC de Leandro e Pedro. Todos os direitos reservados.

---

**GELP - Gerenciamento Simples, Resultados Eficientes**

