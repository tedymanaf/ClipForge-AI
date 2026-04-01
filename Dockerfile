FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/node \
  PATH=/home/node/.local/bin:$PATH \
  PORT=7860 \
  HOSTNAME=0.0.0.0 \
  NEXT_TELEMETRY_DISABLED=1

WORKDIR $HOME/app

COPY --chown=node:node package.json package-lock.json ./

USER node

RUN npm ci

COPY --chown=node:node . .

RUN npm run build \
  && mkdir -p storage/uploads

ENV NODE_ENV=production

EXPOSE 7860

CMD ["sh", "-lc", "npm run start -- -H 0.0.0.0 -p ${PORT:-7860}"]
