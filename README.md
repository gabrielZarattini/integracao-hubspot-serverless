# Documentação Técnica - Integração SchoolAdvisor → HubSpot

Este projeto implementa um middleware serverless para integração entre SchoolAdvisor e HubSpot, contornando limitações de plano do Operations Hub.

## 📚 Documentação Completa

**👉 [Acesse a Documentação Técnica Completa](./DOCUMENTATION.md)**

A documentação inclui:
- Arquitetura detalhada do projeto
- Referência completa da API SchoolAdvisor
- Guia do desenvolvedor (como adicionar novos endpoints, propriedades customizadas)
- Troubleshooting & FAQ

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18.x+
- Conta Vercel
- HubSpot Private App Token com permissões de Custom Objects

### Instalação Local
```bash
npm install
vercel dev
```

### Deploy para Produção
```bash
vercel deploy --prod
```

### Configuração de Variáveis de Ambiente
```bash
vercel env add HUBSPOT_TOKEN_ACCESS
```

## 📁 Estrutura do Projeto

```
/api                    # Endpoints serverless
  └── school-advisor.js # Endpoint principal /api/school-advisor
package.json           # Dependências
.gitignore            # Arquivos ignorados
```

## 🔐 Segurança

**IMPORTANTE**: Nunca commite arquivos `.env.local` ou tokens de acesso.

## 📞 Endpoint de Produção

```
POST https://integracao-hubspot-serverless.vercel.app/api/school-advisor
```

## 🛠️ Stack

- **Runtime**: Node.js 18.x
- **Hosting**: Vercel Serverless Functions
- **SDK**: @hubspot/api-client v13.4.0

---

**Última atualização**: 03/12/2025  
**Autor**: Gabriel Zarattini
