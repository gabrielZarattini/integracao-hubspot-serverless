# Documentação Técnica - Integração SchoolAdvisor → HubSpot

Este projeto implementa um middleware serverless para integração entre SchoolAdvisor e HubSpot, contornando limitações de plano do Operations Hub.

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

## 📚 Documentação Completa

Para documentação técnica detalhada, consulte:
- `technical_documentation.md` - Guia completo de arquitetura, API reference e troubleshooting

## 🔐 Segurança

**IMPORTANTE**: Nunca commite arquivos `.env.local` ou tokens de acesso.

O arquivo `.gitignore` já está configurado para proteger dados sensíveis.

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
