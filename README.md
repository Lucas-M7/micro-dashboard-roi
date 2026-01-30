# 🚀 ROI Tracker - Dashboard de Tráfego Pago (Projeto Pessoal de Estudo)

![Badge Concluído](http://img.shields.io/static/v1?label=STATUS&message=CONCLUÍDO&color=GREEN&style=for-the-badge)
![Badge .NET](https://img.shields.io/badge/.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Badge JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

> **Tendo controle total sobre o retorno do seu investimento (ROI) em campanhas de tráfego pago, centralizando dados do Meta Ads, Google Ads e mais.**

---

## 💻 Sobre o projeto

O **ROI Tracker** nasceu de uma dor pessoal. Gerenciando campanhas de tráfego pago, senti falta de uma ferramenta que me desse uma visão clara e **visual** de quanto eu estava gastando vs. quanto estava retornando, sem a complexidade excessiva de ferramentas empresariais.

Embora existam soluções no mercado, decidi construir minha própria plataforma do zero. O objetivo foi duplo: resolver meu problema de gestão financeira e, principalmente, **colocar em prática conceitos avançados de programação**, saindo da teoria dos cursos para a realidade do desenvolvimento Full Stack (primeiro projeto Full Stack).

---

## ⚙️ Funcionalidades

- [x] **Dashboard Geral:** Visão macro de gastos, faturamento e ROI total.
- [x] **Gestão de Campanhas:** CRUD completo para criar e gerenciar campanhas independentes da plataforma (Meta, Google, TikTok).
- [x] **Logs Diários:** Registro de desempenho diário para cálculo preciso de métricas.
- [x] **Cálculo Automático de ROI:** O sistema indica visualmente a saúde financeira da campanha.
- [x] **Containerização:** SQL Server e API já configurados no Docker.

---

## 🛠 Tecnologias

O projeto foi desenvolvido aplicando **Repository Pattern** para garantir um código desacoplado e testável.

**Back-end:**
- **C# / ASP.NET Core:** Para construção da API RESTful.
- **SQL Server:** Banco de dados relacional.
- **Repository Pattern:** Para abstração do acesso a dados.

**Front-end:**
- **HTML5 & Bootstrap 5:** Interface responsiva e moderna.
- **JavaScript (ES6+):** Manipulação do DOM e consumo de APIs.
- **Node.js:** Gerenciamento de dependências e tooling.

**Ferramentas:**
- **Postman:** Testes de rotas e endpoints.
- **Docker:** (Em implementação para orquestração de containers).

---

## 🧠 Desafios e Aprendizados

Este projeto foi um divisor de águas no meu aprendizado técnico:

1.  **O "Fantasma" do CORS:**
    Tive dificuldades iniciais na comunicação entre o Front e a API devido a bloqueios de segurança do navegador. Resolvi configurando as políticas de CORS no `Program.cs` do .NET, aprendendo na prática como liberar origens específicas de forma segura.

2.  **Arquitetura e Padrões:**
    Sair do código "espaguete" e implementar o **Repository Pattern** foi desafiador, mas essencial. Entendi como separar a lógica de negócios do acesso ao banco de dados torna o sistema muito mais manutenível.

3.  **Integração Real:**
    Fazer o "aperto de mão" entre o JavaScript puro e o Backend em C# me ensinou muito sobre verbos HTTP, Headers e tratamento de respostas assíncronas.

4. **Conteinerização do Docker no Linux**
   Como esse projeto foi finalizado durante uma migração do Windows para o Linux, tive algumas dificuldades para fazer o Docker rodar, como questões de segurança, conexão com Banco de Dados, mas fui tudo obstáculo vencido.

---

## 🚀 Como executar o projeto

```bash
1. Tenha o Docker instalado.
2. Clone o repositório.
3. Rode: `docker compose up -d --build`
4. Acesse o Frontend: `http://localhost:5173`
5. Acesse a Documentação da API: `http://localhost:5078/swagger` (opcional)
