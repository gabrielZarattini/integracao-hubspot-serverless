# Documentação Técnica - Integração SchoolAdvisor → HubSpot

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura & Estrutura do Repositório](#arquitetura--estrutura-do-repositório)
3. [Referência da API - SchoolAdvisor](#referência-da-api---schooladvisor)
4. [Guia do Desenvolvedor](#guia-do-desenvolvedor)
5. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Visão Geral do Projeto

### Contexto de Negócio

O HubSpot exige um plano **Operations Hub Enterprise** para habilitar **Serverless Functions** com endpoints públicos (webhooks). Para contornar essa limitação de plano, desenvolvemos uma arquitetura de **Middleware Serverless** hospedada na **Vercel**.

### Objetivo

Criar um endpoint público que:
- Recebe dados de leads de parceiros externos (ex: SchoolAdvisor)
- Deduplica contatos existentes no HubSpot
- Cria/atualiza registros de **Contatos**, **Alunos** (objeto customizado) e **Negócios**
- Mantém a integridade referencial via associações

### Stack Tecnológico

| Componente | Tecnologia | Versão |
|------------|-----------|--------|
| Runtime | Node.js | 18.x+ |
| Framework | Vercel Serverless Functions | - |
| SDK | `@hubspot/api-client` | 13.4.0 |
| Autenticação | HubSpot Private App Token | - |
| Deployment | Vercel CLI | 48.12.1 |

---

## Arquitetura & Estrutura do Repositório

### Por que Vercel?

1. **Global CDN**: Latência reduzida em múltiplas regiões.
2. **Auto-scaling**: Escalabilidade automática sem configuração de infraestrutura.
3. **Zero Downtime**: Deploy contínuo sem interrupção de serviço.
4. **Ambiente Seguro**: Variáveis de ambiente criptografadas (secrets).

### Estrutura de Pastas

```
integracao-hubspot-serverless/
├── api/                          # 🚀 Diretório de Endpoints
│   └── school-advisor.js         # Endpoint: /api/school-advisor
├── node_modules/                 # Dependências (gerados pelo npm)
├── package.json                  # Configuração de dependências
├── package-lock.json             # Lock de versões
├── .env.local                    # Variáveis locais (NÃO commitar!)
├── .gitignore                    # Arquivos ignorados pelo Git
└── .vercel/                      # Configurações do Vercel (auto-gerado)
```

### Convenção de Roteamento

**IMPORTANTE**: A Vercel converte automaticamente arquivos dentro de `/api` em rotas HTTP.

| Arquivo | Rota Gerada |
|---------|-------------|
| `api/school-advisor.js` | `https://<dominio>/api/school-advisor` |
| `api/rd-station.js` | `https://<dominio>/api/rd-station` |
| `api/facebook-leads.js` | `https://<dominio>/api/facebook-leads` |

### Segurança & Variáveis de Ambiente

**Nunca hardcodar tokens no código!**

A autenticação é feita via **Private App Token** armazenado como variável de ambiente:

```javascript
const token = process.env.HUBSPOT_TOKEN_ACCESS;
```

**Configuração no Vercel:**
```bash
vercel env add HUBSPOT_TOKEN_ACCESS
```

Escolha: `Production`, `Preview` (não `Development` se marcado como Sensitive).

---

## Referência da API - SchoolAdvisor

### **Endpoint**
```
POST https://integracao-hubspot-serverless-of9z7jtdq.vercel.app/api/school-advisor
```

### **Headers**
```http
Content-Type: application/json
```

### **Payload (JSON)**

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `email` | string | Sim* | Email do responsável | `"maria@exemplo.com"` |
| `name` | string | Sim | Nome do responsável | `"Maria Silva"` |
| `mobile_phone` | string | Sim* | Telefone do responsável | `"11 98888-9999"` |
| `student_name` | string | Não | Nome do aluno | `"João Silva"` |
| `grade_level` | string | Não | Série de interesse | `"1o ano"` ou `"1º ano EF"` |
| `type` | string | Sim | Unidade de interesse | Ver lista abaixo |
| `source` | string | Não | Canal de origem | `"SchoolAdvisor"` (padrão) |

*Pelo menos `email` **OU** `mobile_phone` é obrigatório.

### **Unidades Válidas (Campo `type`)**

> ⚠️ **CRÍTICO**: O valor enviado deve corresponder EXATAMENTE a uma das opções abaixo. Valores inválidos retornarão erro 400.

- São José do Rio Preto - SP
- Alphaville - SP
- Balneário Camboriú - SC
- Blumenau - SC
- Londrina - PR
- Piracicaba - SP
- Taubaté - SP
- Luís Eduardo Magalhães - BA
- Granja Julieta - São Paulo - SP
- Guarapuava - PR
- Barra da Tijuca - RJ
- Jd. Marajoara - SP
- Recreio - RJ
- Liceu Pasteur Start Anglo - SP
- Colégio Anglo - SP
- Panamby
- Nova Friburgo - RJ
- Outro

### **Série de Interesse - Normalização Automática**

O sistema aceita múltiplos formatos e normaliza automaticamente:

| Input Aceito (SchoolAdvisor) | Valor Convertido no HubSpot |
|------------------------------|----------------------------|
| `Infantil 1 (até 1 ano)` | `Infantil 1` |
| `Infantil 2 (até 2 anos)` | `Infantil 2` |
| `Infantil 3 (até 3 anos)` | `Infantil 3` |
| `Infantil 4 (até 4 anos)` | `Infantil 4` |
| `Infantil 5 (até 5 anos)` | `Infantil 5` |
| `1º ano (6/7 anos)` | `1º ano EF` |
| `2º ano (7/8 anos)` | `2º ano EF` |
| `3º ano (8/9 anos)` | `3º ano EF` |
| `4º ano (9/10 anos)` | `4º ano EF` |
| `5º ano (10/11 anos)` | `5º ano EF` |
| `6º ano (11/12 anos)` | `6º ano EF` |
| `7º ano (12/13 anos)` | `7º ano EF` |
| `8º ano (13/14 anos)` | `8º ano EF` |
| `9º ano (14/15 anos)` | `9º ano EF` |
| `1ª série (15/16 anos)` | `1ª série EM` |
| `2ª série (16/17 anos)` | `2ª série EM` |
| `3ª série (17/18 anos)` | `3ª série EM` |

> **Nota**: Formatos alternativos também são aceitos (ex: `1o ano`, `1 ano`, `Infantil 1`).

### **Exemplo de Request (cURL)**

```bash
curl -X POST "https://integracao-hubspot-serverless-of9z7jtdq.vercel.app/api/school-advisor" \
-H "Content-Type: application/json" \
-d '{
  "email": "maria@exemplo.com",
  "name": "Maria Silva",
  "mobile_phone": "11 98888-9999",
  "source": "SchoolAdvisor",
  "type": "Panamby",
  "student_name": "João Silva",
  "grade_level": "1o ano"
}'
```

### **Resposta de Sucesso (200)**

```json
{
  "status": "success",
  "contactId": "181856046851",
  "alunoId": "42301125481",
  "dealId": "51158752317",
  "foundBy": "Email"
}
```

| Campo | Descrição |
|-------|-----------|
| `contactId` | ID do Contato (Responsável) criado/atualizado |
| `alunoId` | ID do Aluno (objeto customizado) criado |
| `dealId` | ID do Negócio criado |
| `foundBy` | Método de deduplicação: `Email`, `Phone` ou `None` |

### **Lógica de Negócio - Deduplicação**

Para evitar contatos duplicados, o sistema:

1. **Busca por Email** → Se encontrado, **atualiza** o contato existente.
2. **Busca por Telefone** → Se não encontrou por email, busca por `mobilephone` ou `hs_whatsapp_phone_number`.
3. **Cria Novo Contato** → Se nenhuma correspondência for encontrada.

**Por que isso importa?**
- Evita múltiplos registros do mesmo lead.
- Mantém o histórico de interações consolidado.
- Preserva customizações feitas manualmente pela equipe de vendas.

### **Objetos Criados no HubSpot**

Cada requisição bem-sucedida gera:

#### 1. **Contato (Responsável)**
| Propriedade HubSpot | Valor |
|---------------------|-------|
| `email` | Input: `email` |
| `firstname` | Input: `name` |
| `phone` | Input: `mobile_phone` |
| `mobilephone` | Input: `mobile_phone` |
| `hs_whatsapp_phone_number` | Input: `mobile_phone` |
| `canal` | `"SEO Local Pago"` (fixo) |
| `canal_empresa_parceira` | Input: `source` |
| `unidade_de_interesse` | Input: `type` |
| `lifecyclestage` | `"lead"` |

#### 2. **Aluno (Objeto Customizado - ID: `2-46165031`)**
| Propriedade HubSpot | Valor |
|---------------------|-------|
| `nome` | Input: `student_name` |
| `serie_de_interesse` | Input: `grade_level` (normalizado) |
| `aluno1__unidade_de_interesse` | Input: `type` |

**Associações**:
- Aluno → Contato (Tipo: `38` - "Responsável")
- Aluno → Negócio (Tipo: `33` - "Alunos da Venda")

#### 3. **Negócio (Deal)**
| Propriedade HubSpot | Valor |
|---------------------|-------|
| `dealname` | `"[SchoolAdvisor] - {student_name}"` |
| `pipeline` | `"default"` |
| `dealstage` | `"appointmentscheduled"` |
| `amount` | `"0"` |
| `unidade_de_interesse` | Input: `type` |
| `serie_de_interesse` | Input: `grade_level` (normalizado) |
| `canal` | `"SEO Local Pago"` (fixo) |
| `canal_empresa_parceira` | Input: `source` |

**Associações**:
- Negócio → Contato (Tipo: `3` - Deal to Contact)
- Negócio ← Aluno (via associação acima)

---

## Guia do Desenvolvedor

### Cenário A: Adicionar um Novo Endpoint (Exemplo: RD Station)

Quando você precisa integrar uma nova fonte de leads:

#### Passo 1: Criar o Arquivo
```bash
# Dentro de /api
touch api/rd-station.js
```

#### Passo 2: Copiar Template Base
Use `school-advisor.js` como base, alterando o mapeamento de campos:

```javascript
import { Client } from '@hubspot/api-client';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const token = process.env.HUBSPOT_TOKEN_ACCESS;
    if (!token) return res.status(500).json({ error: 'Missing Token' });
    
    const hubspotClient = new Client({ accessToken: token });
    const body = req.body;
    
    try {
        // Mapear campos específicos do RD Station
        const inputs = {
            email: body.email,              // RD: 'email'
            name: body.name,                // RD: 'name'
            rawPhone: body.mobile_phone,    // RD: 'personal_phone'
            source: "RD Station"            // Fixo
        };
        
        // Reutilizar lógica de deduplicação...
        // ... (copiar do school-advisor.js)
        
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
```

#### Passo 3: Deploy
```bash
vercel deploy --prod
```

A URL gerada será:
```
https://<seu-dominio>.vercel.app/api/rd-station
```

---

### Cenário B: Adicionar Novas Propriedades Customizadas

Exemplo: Adicionar **Data de Nascimento** ao Contato.

#### 1. Criar a Propriedade no HubSpot
- Vá em **Configurações** → **Propriedades** → **Contato** → **Criar Propriedade**
- Nome Interno: `data_nascimento` (sem espaços, minúsculas)
- Tipo: `Date Picker`

#### 2. Modificar o Código

Localize a seção `contactProps` no `school-advisor.js`:

```javascript
const contactProps = {
    email: inputs.email,
    firstname: inputs.name,
    // ... outras propriedades ...
    data_nascimento: body.birth_date,  // 🆕 Nova linha
    lifecyclestage: 'lead'
};
```

#### 3. Atualizar Documentação
Adicione o novo campo à tabela de Payload:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `birth_date` | string | Não | Data de nascimento (formato: YYYY-MM-DD) |

#### 4. Deploy
```bash
vercel deploy --prod
```

---

### Cenário C: Modificar Valores Fixos (Ex: Canal de Origem)

Atualmente, o canal é fixo como `"SEO Local Pago"`. Para torná-lo dinâmico:

**Antes:**
```javascript
canal: "SEO Local Pago",
```

**Depois:**
```javascript
canal: inputs.source === "SchoolAdvisor" ? "SEO Local Pago" : "Orgânico",
```

Ou aceitar via payload:
```javascript
canal: body.canal || "SEO Local Pago",
```

---

### Cenário D: Validação de Campos Obrigatórios

Para adicionar validação de `student_name` como obrigatório:

```javascript
if (!inputs.email && !inputs.cleanPhone) {
    return res.status(400).json({ error: 'Email ou Phone obrigatório' });
}

// 🆕 Nova validação
if (!inputs.studentName) {
    return res.status(400).json({ error: 'Nome do aluno é obrigatório' });
}
```

---

### Boas Práticas de Código

1. **Sempre use `try-catch`** para capturar erros da API do HubSpot.
2. **Log de Payloads**: Mantenha `console.log("Payload Received:", body)` para debugging no Vercel Dashboard.
3. **Validação Defensiva**: Valide tipos de dados antes de enviar ao HubSpot:
   ```javascript
   if (typeof body.email !== 'string') {
       return res.status(400).json({ error: 'Email inválido' });
   }
   ```
4. **Comentários**: Documente regras de negócio complexas (ex: mapeamento de séries).

---

## Troubleshooting & FAQ

### Erro 400: `Property values were not valid`

**Causa Comum**: Valor enviado não está na lista de opções permitidas (Dropdown).

**Exemplo de Erro:**
```json
{
  "error": "Unidade XYZ was not one of the allowed options: [...]"
}
```

**Solução:**
1. Verifique a **lista de unidades válidas** na seção [Referência da API](#unidades-válidas-campo-type).
2. Certifique-se de que o valor enviado corresponde EXATAMENTE (case-sensitive).
3. Se a unidade é nova, adicione-a ao HubSpot:
   - **Configurações** → **Propriedades** → `unidade_de_interesse` → **Editar Opções**

---

### Erro 400: `Property "nome_do_aluno" does not exist`

**Causa**: Tentativa de gravar em propriedade inexistente.

**Solução:**
1. Verifique se a propriedade existe no HubSpot.
2. Confirme o **nome interno** correto (não o rótulo visual).
3. Para objetos customizados, certifique-se de que o objeto foi criado corretamente.

---

### Erro 403: `MISSING_SCOPES`

**Causa**: O Private App Token não tem permissões suficientes.

**Erro Completo:**
```json
{
  "error": "This app hasn't been granted all required scopes",
  "requiredGranularScopes": ["crm.objects.custom.write", ...]
}
```

**Solução:**
1. Vá em **Configurações** → **Integrações** → **Private Apps**.
2. Edite o app e adicione os escopos:
   - `crm.objects.contacts.read/write`
   - `crm.objects.deals.read/write`
   - `crm.objects.custom.read/write` ← **Necessário para objetos customizados**
3. Clique em **Save**.
4. **Não é necessário** regenerar o token nem redeploy no Vercel.

---

### Erro 500: `Missing HubSpot Token`

**Causa**: Variável de ambiente `HUBSPOT_TOKEN_ACCESS` não configurada ou inválida.

**Solução:**
1. Verifique no Vercel Dashboard → **Settings** → **Environment Variables**.
2. Confirme que a variável está presente em **Production** e **Preview**.
3. Se o token expirou, gere um novo no HubSpot:
   - **Configurações** → **Integrações** → **Private Apps** → **Show Token**
   - Copie o novo token
   - Atualize no Vercel: `vercel env add HUBSPOT_TOKEN_ACCESS` (sobrescrever)
   - Redeploy: `vercel deploy --prod`

---

### Deduplicação: Como funciona?

**Ordem de Prioridade:**
1. **Email** (mais confiável)
2. **Telefone** (fallback)

**Cenário Exemplo:**
- Lead 1: `maria@exemplo.com` / `11 99999-1111`
- Lead 2: `maria@exemplo.com` / `11 88888-2222`

**Resultado**: Ambos serão tratados como **o mesmo contato** porque o email corresponde. O telefone será atualizado para `11 88888-2222`.

**Por que Phone como fallback?**
- Caso o email esteja errado ou incompleto (`maria@gmial.com`).
- Leads vindos de formulários sem campo de email obrigatório.

---

### Como testar localmente?

**Opção 1: Vercel Dev Server**
```bash
vercel dev
```
Endpoint local: `http://localhost:3000/api/school-advisor`

**Opção 2: Teste via cURL (Produção)**
```bash
curl -X POST "https://integracao-hubspot-serverless-of9z7jtdq.vercel.app/api/school-advisor" \
-H "Content-Type: application/json" \
-d '{
  "email": "teste@exemplo.com",
  "name": "Teste Local",
  "mobile_phone": "11 91111-1111",
  "type": "Panamby",
  "student_name": "Aluno Teste",
  "grade_level": "1o ano"
}'
```

**Logs em Tempo Real:**
Vercel Dashboard → **Deployments** → Clique no deployment → **Functions** → `school-advisor` → View Logs

---

### Como reverter um deploy com bug?

**Passo 1: Identificar a versão anterior**
```bash
vercel ls
```

**Passo 2: Promover deployment anterior**
No Vercel Dashboard:
1. Vá em **Deployments**
2. Encontre o deployment funcional
3. Clique em **⋯ (três pontos)** → **Promote to Production**

**Passo 3: Corrigir o código e redeploy**
```bash
git revert <commit-hash>
vercel deploy --prod
```

---

### Quando atualizar a URL do endpoint?

Toda vez que você faz `vercel deploy --prod`, a Vercel gera uma **URL única** (ex: `...-hrfh1brju.vercel.app`).

**URLs Disponíveis:**
1. **URL de Deploy Única** (específica de cada deploy): Muda a cada deploy.
2. **URL de Produção** (alias automático): `https://integracao-hubspot-serverless.vercel.app`

**Recomendação para Parceiros:**
Use a **URL de Produção** (alias), pois ela sempre aponta para o último deploy de produção.

---

### Contato para Suporte

Para dúvidas técnicas ou solicitações de integração:

- **Equipe Interna**: [Slack #dev-integrations] ou [email@empresa.com]
- **SchoolAdvisor**: Envie exemplos de payload para validação prévia.

---

**Última Atualização**: 10/12/2025  
**Versão da Documentação**: 1.2  
**Autor**: Equipe de Desenvolvimento - Integrações HubSpot
