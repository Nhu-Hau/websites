import crypto from "crypto";

export function signHmacSHA256(raw: string, secretKey: string) {
  return crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
}

/** build rawSignature cho /create (AIO v2) — theo thứ tự key của MoMo */
export function buildCreateSignature(params: {
  accessKey: string;
  amount: string;
  extraData: string;
  ipnUrl: string;
  orderId: string;
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  requestId: string;
  requestType: string; // 'captureWallet'
}) {
  const {
    accessKey, amount, extraData, ipnUrl,
    orderId, orderInfo, partnerCode, redirectUrl,
    requestId, requestType
  } = params;

  // thứ tự đúng theo doc
  const raw =
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}&requestType=${requestType}`;
  return raw;
}

/** build signature cho IPN/RETURN — theo doc v2 */
export function buildIpnSignature(params: Record<string,string>) {
  // với IPN/return của MoMo, rawSignature gồm các fields nhất định
  // phổ biến: accessKey, amount, extraData, message, orderId, orderInfo, orderType, partnerCode, payType, requestId, responseTime, resultCode, transId
  const keys = [
    "accessKey","amount","extraData","message","orderId","orderInfo",
    "orderType","partnerCode","payType","requestId","responseTime","resultCode","transId"
  ];
  const kv = keys
    .filter(k => params[k] !== undefined)
    .map(k => `${k}=${params[k]}`)
    .join("&");
  return kv;
}

/** Giá khoá học — bạn chỉnh theo slug (nếu không match, dùng default) */
export function getCoursePriceVnd(slug: string): number {
  const map: Record<string, number> = {
    "full-khoa-xoa-mu-ngu-phap-co-mai-phuong": 349000,
    "40-video-hoc-tieng-anh-co-ban-nhat-giup-ban-het-mat-goc": 249000,
    "600-tu-vung-toeic-chinh-phuc-moi-chu-de-trong-de-thi-toeic": 199000,
  };
  return map[slug] ?? 199000;
}