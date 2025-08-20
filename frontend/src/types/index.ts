export interface TTTBChatHistory {
  _id: string;
  userId: string;
  sessionId: string;
  messages: Message[];
}
interface BaseMessage {
  role: "human" | "ai";
  content: string;
}

// 文本类型消息
export interface TextMessage extends BaseMessage {
  type: "text";
  prompts?: string[];
  sources?: BookUsageSummary[];
}

// 工具使用类型消息
export interface ToolUseMessage extends BaseMessage {
  type: "tool_use";
  tool_id: string;
  tool_name: string;
  tool_args: string | object;
}

// 工具结果类型消息
export interface ToolResultMessage extends BaseMessage {
  type: "tool_result";
  tool_name?: string; // 可选，用于显示结果标题
  tool_id: string;
  tool_result: string | object;
}
export interface ChooseAgentMessage extends BaseMessage {
  type: "choose_agent";
  agent: string;
  content: string;
}

// 合并为判别联合类型
export type Message =
  | TextMessage
  | ToolUseMessage
  | ToolResultMessage
  | ChooseAgentMessage;
export interface OldMessage {
  role: "human" | "ai";
  content: string;
  book_list?: BookData[];
  prompts?: string[];
  prompt?: string;
  sources?: BookUsageSummary[];
  tool_name?: string;
  tool_args?: string[];
}

export interface BookData {
  book_id: string;
  book_title: string;
  book_url: string;
  book_image?: string;
}
export interface Persona {
  _id: string;
  persona_name: string;
  system_prompt_en: string;
  intro: string;
  intro_en: string;
  waiting_message: string[];
  system_prompt: string;
}
export interface BaseBookType {
  prod_id: string;
  prod_title_main: string;
  publisher_name: string | null;
  org_prod_id: string;
  cat4xsx_cat_id?: string;
  cat4xsx_cat_nm?: string;
}
export interface BookType extends BaseBookType {
  org_prod_id: string; // 原始產品ID*
  prod_id: string; // 產品ID*
  main_isbn: string | null; // ISBN編號*
  main_author: string | null; // 主要作者*
  prod_cat_id: string; // 產品分類ID*
  prod_title_main: string; // 產品主標題*
  publisher_name: string; // 出版社名稱*
  prod_sale_price?: string; // 產品售價*
  main_list_price?: string; // 定價*
  add_cte?: string | null; // 附加內容
  add_title?: string | null; // 附加標題
  age_begin?: string | null; // 適讀年齡起始
  age_end?: string | null; // 適讀年齡結束
  author_pf?: string; // 作者簡介
  award_rec?: string; // 獲獎記錄
  bk_tags?: string[]; // 博客來分類標籤
  cat4xsx_cat_id?: string; // 分類ID
  cat4xsx_cat_nm?: string; // 分類名稱
  is_podcast_exist?: boolean; // 是否存在有聲書
  catalogue?: string; // 目錄內容
  copyright?: string; // 版權標記
  cover_str?: string | null; // 封面圖片字串
  crt_time?: string; // 創建時間
  eancode?: string; // EAN碼
  end_sell_time?: string | null; // 結束銷售時間
  forsale?: "Y" | "N"; // 是否可銷售 (Y/N)
  logcode?: string; // 物流編碼
  main_cat_id?: string; // 主要分類ID
  main_issue_date?: string | null; // 發行日期
  main_prod_serialno?: string; // 產品序號
  main_pub_id?: string; // 出版社ID
  main_publish_date?: string; // 出版日期
  main_special_price?: string; // 特價
  main_wholesale_price?: string; // 批發價
  media_rcm?: string | null; // 媒體推薦
  org_logcode?: string; // 原始物流編碼
  out_of_print?: "Y" | "N"; // 是否絕版 (Y/N)
  person_guide?: string | null; // 個人指南
  person_rcm?: string; // 個人推薦
  preface?: string | null; // 前言
  prod_pf?: string; // 產品介紹
  prod_pf_desc?: string | null; // 產品介紹描述
  prod_pf_pic?: string | null; // 產品介紹圖片
  prod_rank?: string | null; // 產品排名
  prod_status_flg?: string; // 產品狀態標記
  prod_title_next?: string | null; // 產品副標題
  prod_wholesale_price?: string; // 產品批發價
  rank?: string; // 等級
  retn_flg?: "Y" | "N"; // 退貨標記 (Y/N)
  sale_area?: string; // 銷售區域
  sp_rec?: string | null; // 特殊推薦
  start_sell_time?: string | null; // 開始銷售時間
  stk_flg?: string; // 庫存標記
  stk_sell?: string | null; // 庫存銷售
  sup_id?: string; // 供應商ID
  sup_mode?: string; // 供應模式
  sup_nm_main?: string | null; // 供應商名稱
  translator_pf?: string; // 譯者簡介
  unit_id?: string; // 單位ID
  viewdata?: string | null; // 試閱
  ai_price?: number;
  org_flg?: string;
  sale_disc?: number;
  sale_price?: number;
  status_flg?: string;
  wholesale_price?: number;
}
export interface BookUsageSummary extends BaseBookType {
  score: number;
  source_url: string;
}
export interface RetrieveBookMeta {
  bestseller_info: string[];
  bk_tags: string[];
  cat4xsx_cat_id: string;
  cat4xsx_cat_nm: string;
  crt_time: number;
  es_tags: string[];
  main_author: string;
  main_isbn: string;
  org_prod_id: string;
  prod_cat_id: string;
  prod_id: string;
  prod_sale_price: number;
  prod_title_main: string;
  publisher_id: string;
  publisher_name: string;
  vector_type?: string;
}
export interface PageType {
  id: string;
  catch_copy: string;
  description: string;
  link: string;
  meta_description: string;
  path_name: string;
  retrieval_1: string;
  retrieval_2: string;
  title: string;
  web_title: string;
  tag: string;
  status: number;
  main_author: string;
  book_list: Array<string>;
  crt_time: string; //"2025-03-02 08:48:27.028857"
  post_flg: "N" | "Y";
}
export type AgentType =
  | "search"
  | "service"
  | "secondhand"
  | "supervisor"
  | "consultation";
export interface AgentTabType {
  id: AgentType;
  label: string;
  icon: (choose: boolean, isActive: boolean) => React.ReactNode;
  placeholders: string[];
  active: boolean;
}
export interface UserSecondHandRequest {
  cust_id: string;
  org_prod_id: string;
  prod_id: string;
  type: string;
  value: number;
  create_time: string;
  status: number;
}
export interface ProductType {
  prod_id: string;
  title: string;
  content: string;
  price: number;
  url: string;
}
export interface ProductAmazonType {
  url: string;
  id: string;
  title: string;
  company: string;
}

interface StoryContent {
  page: number;
  audio_path: string;
  image_desc: string;
  image_path: string;
  story_section: string;
  audio_file_name: string;
  emotional_script: string;
  transcript: string;
}

export interface StoryBook {
  id: number;
  title: string;
  content: {
    story: StoryContent[];
    title: string;
    outline: string;
    en_title: string;
    full_audio_path: string;
    cover_image_path: string;
  };
  create_time: string;
}

export interface NewsType {
  title: string;
  url: string;
  description: string;
  content: string;
}

export interface AIForumPost {
  id: string;
  title: string;
  content: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface SharedData {
  view_id: string;
  title: string;
  seo_title: string;
  seo_description: string;
  content: string;
  public: boolean;
  status: number;
  created_by: string;
  crt_time: string;
  tags: string[];
}
export interface PricingReport {
  prod_id: string;
  org_prod_id: string;
  prod_title_main: string;
  eslite_prices: { price: number; url: string }[];
  shopee_prices: { price: number; url: string }[];
  momo_prices: { price: number; url: string }[];
  books_prices: { price: number; url: string }[];
  pchome_prices: { price: number; url: string }[];
  rakuten_prices: { price: number; url: string }[];
  goldstone_prices: { price: number; url: string }[];
  star_prices: { price: number; url: string }[];
  sanmin_prices: { price: number; url: string }[];
  tien_prices: { price: number; url: string }[];
  iread_prices: { price: number; url: string }[];
  market_min_price: number;
  org_margin: number;
  margin: number;
  created_at: string;
  cost: number; // 成本
  special_tag: number; // 0:暢銷榜, 1:讀冊買斷, 2:79折
  sale_price: number; // 讀冊售價
  sale_disc: number; // 銷售折扣
  pur_disc: number; // 採購折扣
  list_price: number; // 定價
  supplier_nm: string; // 供應商名稱
  publisher_nm: string; // 出版社名稱
  pm_name: string; // 產品經理名稱
}
