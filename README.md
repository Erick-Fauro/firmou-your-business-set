# Firmou: Your Business, Set

Crie a primeira versão da aplicação web responsiva "Firmou".

CONTEXTO DO PRODUTO

Firmou é uma plataforma brasileira de agendamento e serviços locais.

Nesta primeira versão, estamos construindo apenas o módulo de agenda para pequenos estabelecimentos e profissionais, começando por barbearias.

No futuro a plataforma poderá atender outros segmentos, portanto NÃO crie nomenclaturas ou estruturas específicas de barbearia no código. Utilize termos genéricos como business, professional, service e appointment.

IMPORTANTE:

Não crie marketplace, pagamentos, avaliações, chat, IA, aluguel de equipamentos ou outras funcionalidades futuras.

Neste momento quero construir SOMENTE:

1. identidade visual base;

2. cadastro;

3. login;

4. onboarding inicial do estabelecimento;

5. estrutura inicial do dashboard após o onboarding.

IDENTIDADE VISUAL

Marca: firmou

Conceito:

"agenda marcada, horário firmado"

A identidade deve ser minimalista, moderna, acolhedora e brasileira, evitando aparência genérica de SaaS corporativo.

Utilize como direção visual:

- fundo principal: off-white / branco quente;

- texto principal: quase preto;

- cinza escuro como cor secundária;

- laranja/dourado quente como cor de destaque;

- marrom escuro para elementos de alto contraste;

- bordas suaves;

- bastante espaço em branco;

- componentes simples;

- cantos moderadamente arredondados.

A marca deve aparecer preferencialmente em lowercase:

firmou ✓

Evite:

- gradientes exagerados;

- roxo/azul típico de SaaS;

- excesso de cards;

- glassmorphism;

- ilustrações genéricas de IA;

- excesso de ícones;

- visual excessivamente corporativo.

A interface deve transmitir simplicidade e confiança.

AUTENTICAÇÃO

Utilize Supabase Authentication.

Criar:

/login

/signup

Cadastro deve solicitar apenas:

- nome;

- email;

- senha.

Login:

- email;

- senha.

Também disponibilizar:

"Esqueci minha senha"

Não implementar login Google neste momento.

Após cadastro/login:

Se o usuário ainda não possuir um business associado ao seu auth.uid(), direcionar para:

/onboarding

Se já possuir business, direcionar para:

/dashboard

ONBOARDING

Criar onboarding simples e progressivo.

Título:

"Vamos preparar seu espaço no Firmou."

Subtexto:

"Leva menos de dois minutos."

ETAPA 1 — NEGÓCIO

Solicitar:

- nome do estabelecimento

- telefone/WhatsApp

- descrição opcional

ETAPA 2 — LOCALIZAÇÃO

Solicitar:

- endereço

- cidade

- estado

ETAPA 3 — LINK

Gerar automaticamente um slug a partir do nome.

Exemplo:

Barbearia do João

gera:

barbearia-do-joao

Mostrar visualmente:

firmou.com.br/barbearia-do-joao

Permitir editar o slug antes de concluir.

Ao finalizar o onboarding, inserir na tabela:

public.businesses

Mapeamento:

owner_id = auth.uid()

name

slug

phone

description

address

city

state

Não criar novas tabelas.

O banco já possui a tabela businesses e as políticas RLS.

DASHBOARD

Depois do onboarding, direcionar para:

/dashboard

Nesta primeira versão o dashboard ainda não precisa ter funcionalidades reais.

Criar somente a estrutura visual inicial.

Sidebar:

- Início

- Agenda

- Serviços

- Profissionais

- Configurações

Na parte inferior:

- nome do estabelecimento

- usuário

- sair

Dashboard inicial:

"Boa tarde, [nome]"

Subtexto:

"Aqui está o que está acontecendo hoje."

Criar uma área simples preparada futuramente para:

- agendamentos de hoje;

- próximos clientes;

- horários disponíveis.

Como ainda não estamos implementando appointments nesta etapa, NÃO inventar dados reais ou criar registros fictícios no banco.

Pode utilizar placeholders visuais claramente identificados como estado vazio.

Exemplo:

"Nenhum agendamento para hoje."

Adicionar CTA:

"Configurar meus serviços"

Esse botão pode apontar temporariamente para /services, mas a funcionalidade de serviços NÃO deve ser implementada nesta etapa.

RESPONSIVIDADE

A aplicação deve funcionar bem em desktop e mobile.

No desktop:

sidebar lateral.

No mobile:

navegação compacta adequada para tela pequena.

ARQUITETURA

- utilizar React + TypeScript;

- componentes reutilizáveis;

- evitar componentes gigantes;

- separar páginas, componentes e integrações;

- utilizar Supabase para autenticação e banco;

- nunca expor service_role key no frontend;

- respeitar as políticas RLS existentes;

- utilizar sessão autenticada do Supabase;

- tratar loading e erros de autenticação;

- proteger /dashboard e /onboarding para usuários autenticados;

- usuários não autenticados tentando acessar essas páginas devem ir para /login.

IMPORTANTE SOBRE O BANCO

O schema já existe no Supabase.

Não recrie tabelas e não altere o schema existente.

Nesta etapa utilize somente:

auth.users

e

public.businesses

Não crie professionals, services, appointments ou outras tabelas, pois elas já fazem parte da arquitetura do projeto e serão utilizadas posteriormente.

OBJETIVO DESTA ENTREGA

Quero conseguir testar exatamente este fluxo:

Usuário acessa Firmou

→ cria conta

→ autenticação acontece no Supabase

→ usuário entra no onboarding

→ cadastra seu estabelecimento

→ registro é criado em public.businesses com owner_id = auth.uid()

→ usuário é direcionado ao dashboard

→ logout funciona

→ novo login reconhece que ele já possui um business e abre diretamente o dashboard.

Não avance além desse escopo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a3f10149-ddd2-41a4-a2d7-2a879ad6d32b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
