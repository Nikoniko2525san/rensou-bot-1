// app.js
const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

app.post('/webhook', middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then(() => res.end());
});

const userIntervals = {}; // ユーザーごとの送信ループ管理

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const message = event.message.text;

  if (message.startsWith('/s:')) {
    const content = message.split(':')[1];
    await client.pushMessage(userId, { type: 'text', text: '作成niko々' });

    if (userIntervals[userId]) clearInterval(userIntervals[userId]);

    userIntervals[userId] = setInterval(async () => {
      try {
        await client.pushMessage(userId, { type: 'text', text: content });
      } catch (err) {
        console.error(err);
      }
    }, 1000 / 30); // 1秒間に30回
  }

  if (message === '/f') {
    if (userIntervals[userId]) {
      clearInterval(userIntervals[userId]);
      delete userIntervals[userId];
      await client.pushMessage(userId, { type: 'text', text: '停止しました' });
    } else {
      await client.pushMessage(userId, { type: 'text', text: '送信中ではありません' });
    }
  }
}

app.listen(port, () => console.log(`LINE bot running on port ${port}`));
