import { BookType, PageType, RetrieveBookMeta } from ".";

export interface RetrieveReq {
  tag: "testing_taaze" | "testing_bk";
  metadata_filter: object;
  query: string;
  google_results: BookType[];
  results: RetrieveBook[];
  db_results: BookType[];
}
export interface RetrieveBook {
  from: "es" | "pinecone";
  id: string;
  metadata: RetrieveBookMeta;
  score: number;
}
export interface BooksSearchResult {
  id: string;
  score: number;
  metadata: BookType;
}
export interface PageSearchResult extends PageType {
  score: number;
}
export interface BookUsageSummaryResponse {
  prod_id: string;
  title: string;
  publisher: string;
  score: number;
  source_url: string;
}
