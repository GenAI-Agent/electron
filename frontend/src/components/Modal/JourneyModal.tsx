import React from 'react';
import { Plane, MapPin, Users, Wifi, Coffee, Luggage, Star, CheckCircle } from 'lucide-react';
import BaseModal from './BaseModal';
import { useRouter } from 'next/router';

interface JourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JourneyModal: React.FC<JourneyModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const mockJourneyData = {
    // 用戶資訊
    traveler: {
      name: 'Somer',
      memberLevel: 'Gold',
      bookingRef: 'CI24A1B2C3'
    },
    // 航班資訊
    flight: {
      airline: '中華航空',
      flightNumber: 'CI 101',
      aircraft: 'Boeing 777-300ER',
      departure: {
        airport: '台北桃園國際機場',
        code: 'TPE',
        terminal: '第一航廈',
        gate: 'A12',
        time: '2025-09-15 08:30',
        date: '2025年9月15日'
      },
      arrival: {
        airport: '東京成田國際機場',
        code: 'NRT',
        terminal: '第一航廈',
        gate: 'B7',
        time: '2025-09-15 12:45',
        date: '2025年9月15日'
      },
      duration: '3小時15分鐘',
      class: '商務艙',
      seat: '2A'
    },
    // 目的地資訊
    destination: {
      city: '東京',
      weather: '晴天 15°C',
      timeZone: 'UTC+9',
      currency: 'JPY',
      tips: '記得攜帶護照，日本免簽證90天'
    },
    // 服務資訊
    services: {
      checkedBaggage: '32kg x 2',
      carryOn: '7kg',
      meal: '日式料理',
      entertainment: '個人娛樂系統',
      wifi: '免費 Wi-Fi'
    },
    // 價格資訊
    pricing: {
      basePrice: 'NT$ 45,800',
      taxes: 'NT$ 3,200',
      total: 'NT$ 49,000'
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="4xl"
      className="p-0 overflow-hidden"
    >
      {/* 頂部個人化標題區 */}
      <div className="bg-gradient-to-r from-primary/80 to-primary text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">您的日本之旅</h2>
            <p className="text-primary-100 mt-1">為 {mockJourneyData.traveler.name} 量身規劃</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-primary-100 text-sm">
              <Star className="w-4 h-4 fill-current" />
              {mockJourneyData.traveler.memberLevel} 會員
            </div>
            <div className="text-primary-100 text-sm mt-1">
              預訂編號：{mockJourneyData.traveler.bookingRef}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
        {/* 航班摘要卡片 */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">{mockJourneyData.flight.airline}</div>
                <div className="text-sm text-slate-600">{mockJourneyData.flight.flightNumber} • {mockJourneyData.flight.aircraft}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-primary">{mockJourneyData.flight.class}</div>
              <div className="text-sm text-slate-600">座位 {mockJourneyData.flight.seat}</div>
            </div>
          </div>

          {/* 航班時間軸 */}
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-slate-800">{mockJourneyData.flight.departure.time}</div>
                <div className="text-sm text-slate-600">{mockJourneyData.flight.departure.code}</div>
                <div className="text-xs text-slate-500">{mockJourneyData.flight.departure.airport}</div>
                <div className="text-xs text-slate-500">{mockJourneyData.flight.departure.terminal} • 登機門 {mockJourneyData.flight.departure.gate}</div>
              </div>

              <div className="flex-1 flex items-center justify-center px-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-px bg-slate-300 flex-1"></div>
                  <div className="text-xs font-medium bg-white px-2 py-1 rounded-full border border-slate-200">
                    {mockJourneyData.flight.duration}
                  </div>
                  <div className="h-px bg-slate-300 flex-1"></div>
                </div>
              </div>

              <div className="flex-1 text-right">
                <div className="font-semibold text-slate-800">{mockJourneyData.flight.arrival.time}</div>
                <div className="text-sm text-slate-600">{mockJourneyData.flight.arrival.code}</div>
                <div className="text-xs text-slate-500">{mockJourneyData.flight.arrival.airport}</div>
                <div className="text-xs text-slate-500">{mockJourneyData.flight.arrival.terminal} • 登機門 {mockJourneyData.flight.arrival.gate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 目的地資訊 */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              目的地資訊
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">城市</span>
                <span className="font-medium">{mockJourneyData.destination.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">天氣</span>
                <span className="font-medium">{mockJourneyData.destination.weather}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">時區</span>
                <span className="font-medium">{mockJourneyData.destination.timeZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">貨幣</span>
                <span className="font-medium">{mockJourneyData.destination.currency}</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-primary-50 rounded text-xs text-primary-700">
              💡 {mockJourneyData.destination.tips}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-primary" />
              機上服務
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Luggage className="w-3 h-3 text-slate-400" />
                <span>託運行李：{mockJourneyData.services.checkedBaggage}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-slate-400" />
                <span>手提行李：{mockJourneyData.services.carryOn}</span>
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="w-3 h-3 text-slate-400" />
                <span>餐點：{mockJourneyData.services.meal}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-slate-400" />
                <span>{mockJourneyData.services.wifi}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 費用明細 */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-semibold text-slate-800 mb-3">費用明細</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">機票基本費用</span>
              <span>{mockJourneyData.pricing.basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">稅金及附加費</span>
              <span>{mockJourneyData.pricing.taxes}</span>
            </div>
            <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-semibold">
              <span>總金額</span>
              <span className="text-primary">{mockJourneyData.pricing.total}</span>
            </div>
          </div>
        </div>

        {/* 確認狀態 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">預訂已確認</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            您的航班預訂已確認，請在起飛前 2 小時抵達機場辦理登機手續。
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button onClick={() => { onClose(); router.push('/browser?url=https://calec.china-airlines.com/echeckin_tn/eCheckin_tw.aspx') }} className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors">
            線上報到
          </button>
          <button onClick={() => { onClose(); router.push('/browser?url=https://bookingportal.china-airlines.com/eRetailInterface/booking-inquiry.aspx') }} className="flex-1 border border-slate-300 text-slate-700 py-2 px-4 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            修改預訂
          </button>
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            分享行程
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default JourneyModal;