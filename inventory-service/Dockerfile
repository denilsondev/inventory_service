FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Definir variável de ambiente
ENV DATABASE_URL="file:./prisma/dev.db"

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "run", "start:prod"] 