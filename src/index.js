const { default: axios } = require("axios");
const { chunk } = require("./utils/arrays");
const { genCouponCode } = require("./utils/strings");
const fs = require("fs");

const requiredParams = [
  "COUPONS_TO_CREATE",
  "UTM_SOURCE",
  "UTM_CAMPAIGN",
  "VTEX_CREATE_COUPONS_API_URL",
  "VTEX_APP_KEY",
  "VTEX_APP_TOKEN",
];

const paramsAreValid = requiredParams.every((param) => process.env[param]);

if (paramsAreValid === false) {
  console.error(`All params are required: ${requiredParams.join(", ")}`);
  console.error(
    `Missing parameters: ${requiredParams
      .filter((param) => !process.env[param])
      .join(", ")}`
  );
  process.exit(1);
}

function genCouponCodes() {
  let couponCodes = [];
  if (fs.existsSync(process.env.COUPONS_TO_CREATE)) {
    couponCodes = JSON.parse(fs.readFileSync(process.env.COUPONS_TO_CREATE, 'utf-8'));
  } else {
    const couponsToCreate = Number(process.env.COUPONS_TO_CREATE);
    for (let index = 0; index < couponsToCreate; index++) {
      let couponCode = genCouponCode(7);
      while (couponCodes.includes(couponCode)) {
        couponCode = genCouponCode(7);
      }
      couponCodes.push(couponCode);
    }
  }

  console.log("Coupons to create", couponCodes);

  fs.writeFileSync(
    `${__dirname}/../generated-coupons.json`,
    JSON.stringify(couponCodes)
  );
  return couponCodes;
}

async function createCouponsInVtex(coupons) {
  const apiCoupons = [];
  for (const coupon of coupons) {
    apiCoupons.push({
      quantity: 1,
      couponConfiguration: {
        utmSource: process.env.UTM_SOURCE === 'same-as-coupon-code' ? coupon : process.env.UTM_SOURCE,
        utmCampaign: process.env.UTM_CAMPAIGN,
        couponCode: coupon,
        maxItemsPerClient: 1,
        expirationIntervalPerUse: "00:00:00",
      },
    });
  }
  try {
    const response = await axios.post(
      process.env.VTEX_CREATE_COUPONS_API_URL,
      apiCoupons,
      {
        headers: {
          "X-VTEX-API-AppKey": process.env.VTEX_APP_KEY,
          "X-VTEX-API-AppToken": process.env.VTEX_APP_TOKEN,
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
}

async function init() {
  const chunks = chunk(genCouponCodes(), 1000);
  for (const chunk of chunks) {
    await createCouponsInVtex(chunk);
  }
}

(async () => init())();
