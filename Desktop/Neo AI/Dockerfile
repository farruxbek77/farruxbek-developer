FROM node:20-slim

# Python va kerakli kutubxonalarni o'rnatish (rembg uchun)
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Python rembg o'rnatish
RUN pip3 install "rembg[cpu]" pillow --break-system-packages

# Ishchi papka
WORKDIR /app

# package.json ni nusxalash va npm o'rnatish
COPY package*.json ./
RUN npm ci --omit=dev

# Prisma generate
COPY prisma ./prisma/
RUN npx prisma generate

# Qolgan fayllarni nusxalash
COPY . .

# TypeScript build
RUN npm run build

# Python yo'li
ENV PYTHON_PATH=/usr/bin/python3

EXPOSE 3000

CMD ["npm", "start"]
