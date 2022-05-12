const fs = require('fs');
const axios = require('axios');
const { chunk } = require('./utils/arrays');

function couponsToDelete() {
  const fileContent = fs.readFileSync(process.env.COUPONS_TO_DELETE, 'utf-8');
  return JSON.parse(fileContent);
}

async function archiveOnVtex(coupon) {
  const response = await axios.post(
    `${process.env.VTEX_ARCHIVE_COUPONS_API_URL}/${coupon}`,
    {},
    {
      headers: {
        "X-VTEX-API-AppKey": process.env.VTEX_APP_KEY,
        "X-VTEX-API-AppToken": process.env.VTEX_APP_TOKEN,
      },
    }
  );
  console.log(response.data);
}

const init = (async () => {
  const chunks = chunk(couponsToDelete(), 100);
  const couponsWithErrors = [];
  for (const chunk of chunks) {
    const promises = [];
    for (const coupon of chunk) {
      promises.push(
        archiveOnVtex(coupon.couponCode)
          .then(() => console.log(`Archivado coupon ${coupon}`))
          .catch((error) => {
            couponsWithErrors.push(coupon);
            console.log(`Coupon with error ${JSON.stringify(coupon)}`);
          })
      );
    }
    await Promise.all(promises);
  }
});

init();