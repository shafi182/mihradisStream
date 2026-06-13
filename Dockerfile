# Gunakan Alpine image yang super ringan
FROM node:18-alpine

# Buat direktori kerja
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependensi (hanya axios, express, dsb)
RUN npm install --production

# Salin seluruh kode (termasuk folder public)
COPY . .

# Ekspos port
EXPOSE 3000

# Jalankan server
CMD ["npm", "start"]
