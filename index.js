
require('dotenv').config()
const { VK, Keyboard } = require('vk-io');
const { renderMirrorImage, renderFrameImage } = require('./imageRender');
var request = require('request').defaults({ encoding: null });

if (!process.env.GROUP_ID || !process.env.BOT_TOKEN || !process.env.ADMIN_TOKEN) {
  console.error('set .env file please');
  process.exit();
} else {
  console.log('%c Have Fun', 'font-size: 16px; color: purple; font-weight: bold')
}

const groupId = process.env.GROUP_ID

const bot = new VK({
  token: process.env.BOT_TOKEN,
  pollingGroupId: groupId,
})

const admin = new VK({
  token: process.env.ADMIN_TOKEN
})

const storage = new Map();

const { updates } = bot;

updates.startPolling();

// Skip outbox message and handle errors
updates.use(async (context, next) => {
  if (!context.is(['message', 'photo']) || context.isOutbox) {
    return;
  }

  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
  }
});


updates.use((ctx, next) => {
  if (ctx.is(['photo'])) {

    const lastImage = ctx.attachments[0].sizes.length - 1;
    const { url } = ctx.attachments[0].sizes[lastImage];

    storage.set(ctx.senderId, url)

    ctx.reply({
      message: `
      комманды для фото
      /flop
      /frame
		`,
      keyboard: Keyboard.keyboard([
        Keyboard.textButton({
          label: 'Отзеркалить',
          payload: {
            command: '/flop'
          }
        }),
        Keyboard.textButton({
          label: 'Рамка',
          payload: {
            command: '/frame'
          }
        })
      ])
    })

    return;
  } else if (ctx.is(['message'])) {
    return next();
  }

  ctx.reply('Не понимаю');


})

updates.use((ctx, next) => {
  if (ctx.messagePayload) {
    ctx.text = ctx.messagePayload.command;
  };

  next();
})


updates.hear(/\/flop/, async (ctx) => {
  if (!storage.get(ctx.senderId)) {
    return ctx.reply('Фото не найдено')
  }

  const sourceBuffer = await loadImage(storage.get(ctx.senderId));

  const renderBuffer = await renderMirrorImage(sourceBuffer)

  const postUrl = await makePost(renderBuffer);

  ctx.reply(`Отзеркаленная картинка выложена: ${postUrl}`);
})

updates.hear(/\/frame/, async (ctx) => {
  if (!storage.get(ctx.senderId)) {
    return ctx.reply('Фото не найдено')
  }


  const sourceBuffer = await loadImage(storage.get(ctx.senderId));

  const renderBuffer = await renderFrameImage(sourceBuffer)


  const postUrl = await makePost(renderBuffer);
  ctx.reply(`Картинка с рамками выложена: ${postUrl}`);

})

/**
 * 
 * @param {String} url url to photo
 * @return {String} url to post `vk.com/club${groupId}?w=wall-${postId}`
 */
const loadImage = async (url) => new Promise((resolve, reject) => {
  request.get(url, async (err, res, body) => {
    if (err) return reject(err);

    return resolve(body)
  });
})

async function makePost(buffer) {


  const { upload } = admin;

  const image = await upload.wallPhoto({
    source: buffer,

  })


  const { post_id } = await admin.api.wall.post({
    owner_id: `-${groupId}`,
    from_group: 1,
    attachments: `photo${image.ownerId}_${image.id}`
  })


  return `vk.com/public${groupId}?w=wall-${groupId}_${post_id}`

}
