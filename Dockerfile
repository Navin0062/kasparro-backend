# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code (including prisma folder)
COPY . .

# GENERATE PRISMA CLIENT FOR LINUX (This is the missing step!)
RUN npx prisma generate

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]