export interface ServiceMail {
  cust_id: string;
  pk_no: number;
  last_rpy_uname: string;
  msg_content: string;
  msg_mail: string;
  msg_subject: string;
  msg_type: string;
  remark: string;
  star_flg: string;
  status_flg: string;
  msg_attach_pk: string;
  crt_time: Date;
}

export interface ServiceMailReply {
  id: string;
  rpy_pk_no: number;
  subject: string;
  content: string;
  fixed_content: string;
  is_send: string;
  send_time: Date;
  updated_time: Date;
  reviewer_cust_id: string;
  reviewer_email: string;
  crt_time: Date;
}

export enum InquiryTypeEnum {
  A = "加入會員/忘記密碼",
  B = "E-mail/註冊確認信",
  C = "新增/修改帳號",
  D = "購物/集購購物流程相關提問題",
  E = "訂單查詢及付款相關問題",
  F = "退貨/換貨/退款/發票相關問題",
  G = "商品寄送相關問題",
  H = "全家、OK、萊爾富超商取貨",
  I = "大榮貨運宅配到府",
  J = "商品查詢",
  K = "網頁/活動/冊格子相關問題",
  L = "E-Coupon/紅回饋金",
  M = "海外購物相關問題",
  N = "電子書問題",
  O = "ATM過期郵件通知",
  P = "超商取貨通知",
  Q = "客服信箱留言",
  R = "TAAZE商品集貨通知",
  S = "TAAZE回饋金通知",
  T = "二手書申請單據",
  U = "TAAZE宅配出貨通知",
  V = "TAAZE會員帳戶匯出現金通知",
  W = "TAAZE二手書資料異動通知",
  X = "會員取消",
  Y = "厂商合作",
}
