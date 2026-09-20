# conduzindo-para-o-futuro
​
// projeto em desenvolvimento através do Codespaces do GitHub
​
## Como instalar o sistema 
```bash
// verifique se a versão do Node.js está em 24.x
node --version

// utilize o nvm para alterar a versão do Node.js
nvm use 24

// -- passos para instalar dependências

// entre na pasta `/src`
cd src

// execute a instalação dos pacotes do projeto
npm install
```

## Como rodar o sistema
```bash
// -- passos para executar o projeto localmente

// entre na pasta `/src`
cd src

// execute o comando com `npm run ...`
npm run dev

// depois abra a aplicação no browser através da URL
http://localhost:3000/

// para visualizar os e-mails enviados pela aplicação, abra o browser através da URL
http://localhost:1080/
```

## Como rodar a bateria de testes do sistema
```bash
// -- passos para executar os testes localmente

// entre na pasta `/src`
cd src

// execute o comando com `npm run ...`
npm run test

// -- passos para executar os testes localmente em modo vigia

// entre na pasta `/src`
cd src

// execute o comando com `npm run ...`
npm run dev

// abra outro terminal e entre na pasta `/src`
cd src

// agora execute o comando com `npm run ...`
npm run test:watch
```
