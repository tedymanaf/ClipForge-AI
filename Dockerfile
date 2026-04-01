FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PORT=7860
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

RUN mkdir -p storage/uploads

ENV NODE_ENV=production

EXPOSE 7860

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "7860"]
