const express = require('express');
const line = require('@line/bot-sdk');

const app = express();
app.use(express.json());

// LINE設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

let sendingFlag = false;
let sendingText = '';
let intervalId = null;

// 受信Webhookエンドポイント
app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const msg = event.message.text;
      const userId = event.source.userId;

      if (msg.startsWith('/s=')) {
        sendingText = msg.split('=')[1];
        if (sendingFlag) {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'すでに送信中です。',
          });
          return;
        }

        sendingFlag = true;
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: `「${sendingText}」を1秒間に30回送信開始します。/fで停止します。`,
        });

        intervalId = setInterval(async () => {
          if (!sendingFlag) return;
          for (let i = 0; i < 30; i++) {
            try {
              await client.pushMessage(userId, {
                type: 'text',
                text: sendingText,
              });
            } catch (e) {
              console.error('送信エラー:', e);
            }
          }
        }, 1000);
      }

      else if (msg === '/f') {
        sendingFlag = false;
        if (intervalId) clearInterval(intervalId);
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: '送信を停止しました。',
        });
      }
    }
  }
  res.sendStatus(200);
});

// テスト用
app.get('/', (req, res) => {
  res.send('LINE Bot is running');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
