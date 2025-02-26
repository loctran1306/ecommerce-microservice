# Sử dụng Node.js LTS làm môi trường
FROM node:18

# Đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Mở port của API Gateway
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "run", "start"]
