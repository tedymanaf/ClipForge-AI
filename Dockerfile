FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/node \
  VIRTUAL_ENV=/opt/venv \
  PATH=/opt/venv/bin:/home/node/.local/bin:$PATH \
  PORT=7860 \
  HOSTNAME=0.0.0.0 \
  NEXT_TELEMETRY_DISABLED=1 \
  CLIPFORGE_STORAGE_DIR=/tmp/clipforge \
  CLIPFORGE_FASTAPI_URL=http://127.0.0.1:8000

WORKDIR $HOME/app

COPY --chown=node:node package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY requirements.txt ./
RUN python3 -m venv $VIRTUAL_ENV \
  && $VIRTUAL_ENV/bin/pip install --no-cache-dir --upgrade pip \
  && $VIRTUAL_ENV/bin/pip install --no-cache-dir -r requirements.txt

COPY --chown=node:node . .

RUN npm run build \
  && mkdir -p /tmp/clipforge/uploads \
  && mkdir -p /tmp/uploads \
  && chown -R node:node /tmp/clipforge /tmp/uploads /home/node/app

USER node

ENV NODE_ENV=production

EXPOSE 7860

CMD ["sh", "-lc", "uvicorn clipforge_api:app --host 127.0.0.1 --port 8000 >/tmp/fastapi.log 2>&1 & exec npm run start -- -H 0.0.0.0 -p ${PORT:-7860}"]
