# Base image com versão mais recente do Node.js
FROM node:16

# Definindo diretório de trabalho no container
WORKDIR /src

# Copiando todos os arquivos da pasta src para o contêiner
COPY . /src

# Instalando as dependências do Node.js
RUN npm install

# Expondo a porta usada pelo servidor (exemplo: 3000)
EXPOSE 3000

# Comando para iniciar o app (assumindo que connect.js está dentro de src/)
CMD ["node", "./src/connect.js"]
