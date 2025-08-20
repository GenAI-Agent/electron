export interface UserType {
  cust_id: string;
  mail_main: string;
  nick_name?: string;
  cust_nm?: string;
  sex?: "M" | "F" | "O";
  child_flg?: boolean;
  com_city_id?: string;
  com_town_id?: string;
  birth_date?: string;
  last_login?: string;
  lineid?: string;
  created_at?: string;
}
export interface RegisterUserData {
  cust_id: string;
  mail_main: string;
  nick_name?: string;
  cust_nm?: string;
  sex?: "M" | "F";
  child_flg?: boolean;
  com_city_id?: string;
  com_town_id?: string;
}

export interface RegisterRequest {
  user_data: RegisterUserData;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: {
    cust_id: string;
  };
}
export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    cust_id: string;
  };
}

export interface StrategyInfo {
  name: string;
  description: string;
  expression: string;
  category: string;
  optimization_date: string;
}
export interface StrategyParameters {
  max_pos: number;
  long_ratio: number;
  min_trade_weight: number;
  equal_weight: boolean;
}
export interface StrategyPerformanceMetrics {
  total_return_pct: number;
  annual_return_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  sharpe_ratio_last2y: number;
  average_turnover_pct: number;
  daily_win_rate_pct: number;
  trade_win_rate_pct: number;
  avg_trade_return_pct: number;
  avg_winning_return_pct: number;
  avg_losing_return_pct: number;
}
export interface Strategy {
  strategy_info: StrategyInfo;
  parameters: StrategyParameters;
  performance_metrics: StrategyPerformanceMetrics;
}
