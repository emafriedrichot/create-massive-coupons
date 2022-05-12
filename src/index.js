const { default: axios } = require("axios");
const fs = require("fs");

const { chunk } = require("./utils/arrays");
const { genCouponCode } = require("./utils/strings");

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

  const missingParameters = requiredParams
    .filter((param) => !process.env[param])
    .join(", ");

  console.error(`Missing parameters: ${missingParameters}`);
  process.exit(1);
}

function genCouponCodes() {
  let couponCodes = [];
  if (fs.existsSync(process.env.COUPONS_TO_CREATE)) {
    const fileContent = fs.readFileSync(process.env.COUPONS_TO_CREATE, "utf-8");
    couponCodes = JSON.parse(fileContent);
  } else {
    const couponsToCreate = Number(process.env.COUPONS_TO_CREATE);
    for (let index = 0; index < couponsToCreate; index++) {
      const _genCouponCode = () => genCouponCode(7);
      let couponCode = _genCouponCode();
      while (couponCodes.includes(couponCode)) {
        couponCode = _genCouponCode();
      }
      couponCodes.push(couponCode);
    }
  }

  console.log("Coupons to create", couponCodes);

  const filePath = `${__dirname}/../generated-coupons.json`;
  const fileContent = JSON.stringify(couponCodes);
  fs.writeFileSync(filePath, fileContent);

  return couponCodes;
}

async function createCouponsInVtex(coupons) {
  const apiCoupons = [];
  for (const coupon of coupons) {
    apiCoupons.push({
      quantity: 1,
      couponConfiguration: {
        utmSource:
          process.env.UTM_SOURCE === "same-as-coupon-code"
            ? coupon
            : process.env.UTM_SOURCE,
        utmCampaign: process.env.UTM_CAMPAIGN,
        couponCode: coupon,
        maxItemsPerClient: 1000,
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
  const chunks = chunk(genCouponCodes(), 200);
  for (const chunk of chunks) {
    await createCouponsInVtex(chunk);
  }
}

(async () => init())();
