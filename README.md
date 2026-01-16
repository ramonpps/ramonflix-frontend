# RamonFlix - Frontend Client

Este repositório contém a interface de usuário (Client-Side) do projeto RamonFlix, uma plataforma de streaming de vídeo desenvolvida com **React.js**. O projeto foi criado com fins educacionais para demonstrar a implementação de uma arquitetura de streaming descentralizada (P2P) integrada a uma interface moderna e responsiva.

O frontend atua como o consumidor final de uma arquitetura de microsserviços, conectando-se a uma API REST (Ruby on Rails) para dados de catálogo e a um serviço de streaming (Node.js) para transmissão de vídeo.

## Sobre o Projeto

O RamonFlix simula a experiência de usuário de grandes plataformas de streaming, focando em performance e interatividade. Diferente de plataformas tradicionais que hospedam arquivos de vídeo estáticos, este projeto implementa um protocolo de streaming baseado em Magnet Links e WebTorrent, permitindo a distribuição de conteúdo sem a necessidade de grandes servidores de armazenamento centralizado.

> **Nota Técnica:** Para fins de portfólio e conformidade legal, o sistema opera em "Modo de Demonstração". Ao solicitar a reprodução de qualquer título, o sistema carrega conteúdo licenciado sob Creative Commons (Open Source) para validar a tecnologia de transmissão.

## Tecnologias Utilizadas

* **Core:** React.js 18
* **Build Tool:** Vite (para alta performance de desenvolvimento e build)
* **Roteamento:** React Router Dom v6
* **Requisições HTTP:** Axios
* **Player de Vídeo:** HTML5 Video API nativa integrada ao stream engine
* **Estilização:** CSS Modules / Styled Components
* **Gerenciamento de Estado:** React Hooks e Context API

## Funcionalidades

1.  **Catálogo Dinâmico:** Consumo de API para exibição de filmes e séries, incluindo capas, sinopses, elenco e avaliações.
2.  **Streaming P2P:** Integração com microsserviço de transcoding que converte streams BitTorrent em vídeo compatível com navegadores.
3.  **Sistema de Busca:** Pesquisa em tempo real de títulos.
4.  **Interface Responsiva:** Layout adaptável para dispositivos desktop e mobile.
5.  **Modo Demo Seguro:** Interface informativa que detalha a origem do sinal e status da conexão P2P sem expor conteúdo protegido por direitos autorais.

## Pré-requisitos

Para rodar este projeto localmente, você precisará ter instalado:
* Node.js (versão 18 ou superior)
* NPM ou Yarn

## Instalação e Execução

1.  Clone o repositório:
    ```bash
    git clone [https://github.com/SEU_USUARIO/ramonflix-frontend.git](https://github.com/SEU_USUARIO/ramonflix-frontend.git)
    cd ramonflix-frontend
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Configure as variáveis de ambiente:
    Crie um arquivo `.env` na raiz do projeto e defina as URLs dos serviços de backend (local ou produção):

    ```env
    VITE_API_URL=http://localhost:3000
    VITE_STREAM_URL=http://localhost:8080
    ```

4.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

A aplicação estará disponível em `http://localhost:5173`.

## Estrutura de Pastas

* `/src/components`: Componentes reutilizáveis (Navbar, Cards, Player).
* `/src/pages`: Páginas principais da aplicação (Home, Watch, Search).
* `/src/services`: Configurações do Axios e serviços de API.
* `/src/context`: Gerenciamento de estado global (se aplicável).

## Arquitetura do Sistema

Este frontend é apenas uma parte do ecossistema RamonFlix:

1.  **Frontend (Este repositório):** Interface do usuário.
2.  **Backend API (Ruby on Rails):** Gerencia lógica de negócios, metadados e segurança.
3.  **Stream Engine (Node.js):** Microsserviço responsável pelo processamento do protocolo WebTorrent e entrega do stream de vídeo.

---
Desenvolvido por Ramon Pedro Pereira Santos
