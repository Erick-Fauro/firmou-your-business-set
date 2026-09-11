# Banco de dados — Firmou

Este documento descreve o schema utilizado pelo MVP do Firmou.

## Fonte de verdade

O banco oficial do projeto é o Supabase externo controlado pelo projeto Firmou.

O backend Supabase interno associado ao Lovable NÃO deve ser utilizado como
fonte de verdade para validar tabelas, schema ou dados.

Ao implementar funcionalidades no frontend, utilizar o cliente Supabase
existente em:

src/integrations/supabase/client.ts

Não criar ou alterar tabelas, migrations, RLS ou configuração Supabase pelo
Lovable sem solicitação explícita.

---

# Relacionamentos principais

businesses
├── services
├── professionals
│   └── professional_services ─── services
├── business_hours
├── customers
└── appointments
    ├── professional
    ├── service
    └── customer

---

# businesses

Representa um estabelecimento cadastrado no Firmou.

| Campo | Tipo |
|---|---|
| id | uuid |
| owner_id | uuid |
| name | text |
| slug | text |
| phone | text |
| description | text |
| address | text |
| city | text |
| state | text |
| created_at | timestamptz |
| updated_at | timestamptz |

## Relações

- `owner_id` identifica o usuário proprietário do estabelecimento.
- As demais entidades do sistema utilizam `business_id` para pertencer a um estabelecimento.

---

# services

Serviços oferecidos pelo estabelecimento.

| Campo | Tipo |
|---|---|
| id | uuid |
| business_id | uuid |
| name | text |
| description | text |
| price | numeric |
| duration_minutes | int4 |
| active | bool |
| created_at | timestamptz |
| updated_at | timestamptz |

## Relações

- `business_id` → `businesses.id`

Um serviço pertence a apenas um estabelecimento.

Exemplo:

- Corte
- Barba
- Corte e Barba

---

# professionals

Profissionais que realizam atendimentos no estabelecimento.

| Campo | Tipo |
|---|---|
| id | uuid |
| business_id | uuid |
| name | text |
| phone | text |
| active | bool |
| created_at | timestamptz |
| updated_at | timestamptz |

## Relações

- `business_id` → `businesses.id`

Um profissional pertence a apenas um estabelecimento.

A relação entre profissionais e serviços NÃO deve ser armazenada diretamente
nesta tabela.

---

# professional_services

Tabela de relacionamento entre profissionais e serviços.

| Campo | Tipo |
|---|---|
| professional_id | uuid |
| service_id | uuid |
| created_at | timestamptz |

## Relações

- `professional_id` → `professionals.id`
- `service_id` → `services.id`

A combinação:

`professional_id + service_id`

é única e representa o vínculo entre um profissional e um serviço.

Exemplo:

João
- Corte
- Corte e Barba

Pedro
- Barba

---

# business_hours

Horário geral de funcionamento do estabelecimento.

| Campo | Tipo |
|---|---|
| id | uuid |
| business_id | uuid |
| day_of_week | integer |
| open_time | time |
| close_time | time |
| is_closed | bool |
| created_at | timestamptz |

## Relações

- `business_id` → `businesses.id`

Cada registro representa a configuração de um dia da semana.

Exemplo:

Segunda-feira
09:00 → 18:00

Domingo
Fechado

---

# customers

Clientes associados a um estabelecimento.

| Campo | Tipo |
|---|---|
| id | uuid |
| business_id | uuid |
| name | text |
| phone | text |
| created_at | timestamptz |
| updated_at | timestamptz |

## Relações

- `business_id` → `businesses.id`

No MVP, o cliente poderá ser criado durante o processo de agendamento.

---

# appointments

Agendamentos realizados no estabelecimento.

| Campo | Tipo |
|---|---|
| id | uuid |
| business_id | uuid |
| professional_id | uuid |
| service_id | uuid |
| customer_id | uuid |
| start_time | timestamptz |
| end_time | timestamptz |
| status | text |
| notes | text |
| created_at | timestamptz |
| updated_at | timestamptz |

## Relações

- `business_id` → `businesses.id`
- `professional_id` → `professionals.id`
- `service_id` → `services.id`
- `customer_id` → `customers.id`

Um agendamento representa:

Cliente
+
Serviço
+
Profissional
+
Horário

---

# Segurança / RLS

As tabelas utilizam Row Level Security.

A regra geral do painel administrativo é:

O usuário autenticado só pode acessar dados pertencentes ao estabelecimento
cujo:

businesses.owner_id = auth.uid()

## professionals

A policy existente valida o vínculo:

professionals.business_id
→ businesses.id
→ businesses.owner_id = auth.uid()

A policy permite gerenciamento do próprio estabelecimento.

## professional_services

A policy existente valida:

professional_services.professional_id
→ professionals.id
→ professionals.business_id
→ businesses.id
→ businesses.owner_id = auth.uid()

Portanto, o proprietário só pode gerenciar vínculos de seus próprios
profissionais.

### Melhoria futura de segurança

A policy de `professional_services` deve futuramente validar também se
`service_id` pertence ao mesmo estabelecimento do profissional.

O frontend já deve sempre filtrar os serviços pelo `business_id` atual.

---

# Regras para desenvolvimento

1. Nunca solicitar `business_id` manualmente ao usuário.
2. Obter o estabelecimento através de:

   businesses.owner_id = auth.uid()

3. Utilizar `businesses.id` como `business_id`.
4. Nunca armazenar IDs de outro estabelecimento.
5. Profissionais e serviços possuem relacionamento N:N através de
   `professional_services`.
6. Não armazenar serviços como texto dentro de `professionals`.
7. Não criar tabelas novas se elas já estiverem documentadas aqui.
8. Não permitir que o Lovable altere Supabase, migrations, RLS ou `.env`
   automaticamente.
9. O schema descrito neste arquivo é a referência para geração de frontend.
