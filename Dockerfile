# Playwright base image includes Chromium. The app still launches a browser
# only for each PNG export, then closes it — binaries on disk ≠ always-on Chrome.
FROM mcr.microsoft.com/playwright:v1.54.2-noble

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
