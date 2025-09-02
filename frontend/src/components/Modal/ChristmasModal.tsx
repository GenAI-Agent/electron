import React from 'react';
import { Plane, MapPin, Calendar, Star, Snowflake } from 'lucide-react';
import BaseModal from './BaseModal';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Amsterdam from '@/assets/Amsterdam.png';
import NYC from '@/assets/NYC.png';
import Auckland from '@/assets/Auckland.png';
import Tokyo from '@/assets/Tokyo.png';

interface ChristmasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChristmasModal: React.FC<ChristmasModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const flightData = [
    {
      destination: '阿姆斯特丹',
      country: '荷蘭',
      dec22Price: 'NT$45,800',
      dec23Price: 'NT$52,600',
      highlights: ['聖誕市集', '運河夜景', '博物館區'],
      image: Amsterdam.src
    },
    {
      destination: '紐約',
      country: '美國',
      dec22Price: 'NT$38,900',
      dec23Price: 'NT$42,800',
      highlights: ['聖誕樹', '時代廣場', '中央公園雪景'],
      image: NYC.src
    },
    {
      destination: '奧克蘭',
      country: '紐西蘭',
      dec22Price: 'NT$28,500',
      dec23Price: 'NT$31,200',
      highlights: ['夏日聖誕', '自然風光', '戶外活動'],
      image: Auckland.src
    },
    {
      destination: '東京',
      country: '日本',
      dec22Price: 'NT$18,900',
      dec23Price: 'NT$21,600',
      highlights: ['冬季燈飾', '溫泉體驗', '聖誕蛋糕'],
      image: Tokyo.src
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="4xl"
      className="p-0 overflow-hidden"
    >
      {/* 頂部聖誕節主題標題區 */}
      <div className="bg-gradient-to-r from-primary/90 to-secondary/10 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🎄 2025年聖誕節旅程
            </h2>
            <p className="text-white mt-1">華航精選四大聖誕節目的地</p>
          </div>
          <div className="text-right text-black/80">
            <div className="flex items-center gap-2  text-sm">
              <Snowflake className="w-4 h-4 fill-current" />
              聖誕特選
            </div>
            <div className=" text-sm mt-1">
              限時優惠價格
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 h-[60vh] overflow-y-auto">
        {/* 推薦國家卡片 */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            聖誕節推薦目的地
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flightData.map((destination, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-50 to-red-50 rounded-xl overflow-hidden border border-red-100">
                {/* 圖片區域 */}
                <div className="relative h-64 w-full">
                  <Image
                    src={destination.image}
                    alt={`${destination.destination} 聖誕街景`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* 內容區域 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{destination.destination}</h4>
                      <p className="text-sm text-slate-600">{destination.country}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {destination.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-red-100">
                    <span>12/22 或 12/23 出發</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 華航班機票價表 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Plane className="w-4 h-4 text-red-600" />
            華航班機票價一覽
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-2 font-semibold">目的地</th>
                  <th className="text-center p-2 font-semibold text-green-700">12月22日出發</th>
                  <th className="text-center p-2 font-semibold text-orange-700">12月23日出發</th>
                </tr>
              </thead>
              <tbody>
                {flightData.map((flight, index) => (
                  <tr key={index} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-2">
                      <div className="font-medium">{flight.destination}</div>
                      <div className="text-xs text-slate-500">{flight.country}</div>
                    </td>
                    <td className="p-2 text-center font-semibold text-green-600">
                      {flight.dec22Price}
                    </td>
                    <td className="p-2 text-center font-semibold text-orange-600">
                      {flight.dec23Price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 出發日期建議 */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-5 h-5 text-black/80 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-2">出發日期建議</h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="border border-border rounded p-3">
                  <div className="font-semibold text-foreground mb-1">🗓️ 12月22日出發</div>
                  <ul className="text-black/80 space-y-1 text-xs">
                    <li>• 較早抵達，充分體驗聖誕氛圍</li>
                    <li>• 避開平安夜人潮</li>
                    <li>• 價格相對優惠</li>
                  </ul>
                </div>
                <div className="border border-border rounded p-3">
                  <div className="font-semibold text-foreground mb-1">🎅 12月23日出發</div>
                  <ul className="text-black/80 space-y-1 text-xs">
                    <li>• 平安夜前夕抵達</li>
                    <li>• 最濃厚節慶氣氛</li>
                    <li>• 與當地人共度聖誕</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 重要提醒 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Star className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-2">聖誕節旅遊提醒</h4>
              <ul className="text-red-800 space-y-1 text-sm">
                <li>• 聖誕節期間為旅遊旺季，建議提前預訂住宿</li>
                <li>• 部分景點和商店在12月25日可能關閉</li>
                <li>• 價格僅供參考，實際票價以華航官網為準</li>
                <li>• 建議購買旅遊保險保障行程</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              onClose();
              router.push('/browser?url=https://www.china-airlines.com/tw/zh')
            }}
            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/80 transition-colors"
          >
            前往華航官網
          </button>
          <button
            onClick={() => {
              onClose();
              router.push('/browser?url=https://www.china-airlines.com/tw/zh/booking/book-flights/flight-search')
            }}
            className="flex-1 border border-slate-300 text-slate-700 py-2 px-4 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            比較機票價格
          </button>
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            分享行程
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ChristmasModal;