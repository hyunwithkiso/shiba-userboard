// Mock data for FiveM Shiba Server Exchange System
export interface ExchangeItem {
  id: string;
  name: string;
  category: string;
  price: number;
  timeLeft: string;
  cash: boolean;
  description: string;
  monthlyTradeVolume: number; // 최근 한달 거래량 추가
}

export type Granularity = 'hour' | 'day' | 'month';

export interface PricePoint {
  time: string;
  price: number;
}

export interface Listing {
  id: string;
  seller: string;
  price: number;
  quantity: number;
  expiresIn: string;
}

export interface Trade {
  id?: string;
  time: string;
  price: number;
  quantity: number;
  type: 'buy' | 'sell' | '즉시구매';
  buyer: string;
  seller: string;
}

// Statistics interfaces
export interface DailyTradeVolume {
  date: string;
  volume: number;
  value: number;
  trades: number;
}

export interface CategoryStats {
  category: string;
  volume: number;
  value: number;
  percentage: number;
  color: string;
}

export interface PopularItem {
  id: string;
  name: string;
  category: string;
  trades: number;
  volume: number;
  avgPrice: number;
  priceChange: number;
}

export interface TraderActivity {
  userId: string;
  nickname: string;
  trades: number;
  volume: number;
  value: number;
  rating: number;
}

export interface WeeklyTrend {
  week: string;
  totalTrades: number;
  totalVolume: number;
  totalValue: number;
  activeTraders: number;
}

// FiveM Shiba Server items data
export const mockItems: ExchangeItem[] = [
  // 무기 카테고리
  {
    id: "1",
    name: "권총 (Pistol)",
    category: "무기",
    price: 850000,
    timeLeft: "2시간 30분",
    cash: false,
    description: "기본 권총, 자기방어용으로 적합",
    monthlyTradeVolume: 245
  },
  {
    id: "2",
    name: "AK-47 소총",
    category: "무기",
    price: 2500000,
    timeLeft: "5시간 15분",
    cash: true,
    description: "강력한 자동소총, 높은 화력",
    monthlyTradeVolume: 89
  },
  {
    id: "3",
    name: "샷건 (Pump Shotgun)",
    category: "무기",
    price: 1200000,
    timeLeft: "1일 3시간",
    cash: false,
    description: "근거리 전투용 샷건",
    monthlyTradeVolume: 156
  },
  
  // 차량 카테고리
  {
    id: "4",
    name: "BMW M3 (튜닝카)",
    category: "차량",
    price: 45000000,
    timeLeft: "3일 12시간",
    cash: true,
    description: "고성능 스포츠카, 최고속도 280km/h",
    monthlyTradeVolume: 23
  },
  {
    id: "5",
    name: "하얼리 데이비슨 (오토바이)",
    category: "차량",
    price: 18000000,
    timeLeft: "1일 8시간",
    cash: false,
    description: "클래식 크루저 바이크",
    monthlyTradeVolume: 67
  },
  {
    id: "6",
    name: "람보르기니 우라칸",
    category: "차량",
    price: 120000000,
    timeLeft: "5일 2시간",
    cash: true,
    description: "최고급 슈퍼카, 컬렉터 아이템",
    monthlyTradeVolume: 8
  },
  
  // 소비품 카테고리
  {
    id: "7",
    name: "의료키트",
    category: "소비품",
    price: 25000,
    timeLeft: "30분",
    cash: false,
    description: "체력을 완전히 회복시켜주는 의료용품",
    monthlyTradeVolume: 892
  },
  {
    id: "8",
    name: "에너지 드링크",
    category: "소비품",
    price: 8000,
    timeLeft: "45분",
    cash: false,
    description: "스태미나를 빠르게 회복",
    monthlyTradeVolume: 1456
  },
  {
    id: "9",
    name: "방탄조끼",
    category: "소비품",
    price: 180000,
    timeLeft: "2시간",
    cash: false,
    description: "총격으로부터 보호해주는 방탄복",
    monthlyTradeVolume: 334
  },
  
  // 부동산 카테고리
  {
    id: "10",
    name: "고급 아파트 (펜트하우스)",
    category: "부동산",
    price: 500000000,
    timeLeft: "7일",
    cash: true,
    description: "시내 중심가 최고급 펜트하우스",
    monthlyTradeVolume: 3
  },
  {
    id: "11",
    name: "창고 (대형)",
    category: "부동산",
    price: 80000000,
    timeLeft: "4일 6시간",
    cash: true,
    description: "사업용 대형 창고, 물류 거점",
    monthlyTradeVolume: 12
  },
  
  // 의류 카테고리
  {
    id: "12",
    name: "명품 정장 세트",
    category: "의류",
    price: 1500000,
    timeLeft: "1일 12시간",
    cash: false,
    description: "고급 브랜드 정장, 비즈니스 미팅용",
    monthlyTradeVolume: 78
  },
  {
    id: "13",
    name: "레더 재킷",
    category: "의류",
    price: 450000,
    timeLeft: "18시간",
    cash: false,
    description: "진짜 가죽으로 만든 바이커 재킷",
    monthlyTradeVolume: 123
  },
  
  // 전자제품 카테고리
  {
    id: "14",
    name: "아이폰 15 Pro Max",
    category: "전자제품",
    price: 1800000,
    timeLeft: "6시간",
    cash: false,
    description: "최신 스마트폰, 고해상도 카메라",
    monthlyTradeVolume: 189
  },
  {
    id: "15",
    name: "노트북 (게이밍)",
    category: "전자제품",
    price: 3200000,
    timeLeft: "2일 4시간",
    cash: true,
    description: "고성능 게이밍 노트북, RTX 4080",
    monthlyTradeVolume: 45
  },
  
  // 마약/불법품 카테고리
  {
    id: "16",
    name: "마리화나 (1g)",
    category: "불법품",
    price: 50000,
    timeLeft: "1시간",
    cash: false,
    description: "고품질 마리화나, 위험한 거래",
    monthlyTradeVolume: 567
  },
  {
    id: "17",
    name: "코카인 (1g)",
    category: "불법품",
    price: 120000,
    timeLeft: "2시간 15분",
    cash: true,
    description: "순도 높은 코카인, 매우 위험",
    monthlyTradeVolume: 234
  }
];

export function getItemById(id: string): ExchangeItem | undefined {
  return mockItems.find(item => item.id === id);
}

export function getPriceSeries(itemId: string, period: '1h' | '1d' | '1w' | '1m'): PricePoint[] {
  const basePrice = mockItems.find(item => item.id === itemId)?.price || 1000000;
  const points: PricePoint[] = [];
  
  let intervals: number;
  let timeFormat: string;
  
  switch (period) {
    case '1h':
      intervals = 12;
      timeFormat = 'HH:mm';
      break;
    case '1d':
      intervals = 24;
      timeFormat = 'HH:mm';
      break;
    case '1w':
      intervals = 7;
      timeFormat = 'MM/dd';
      break;
    case '1m':
      intervals = 30;
      timeFormat = 'MM/dd';
      break;
  }
  
  for (let i = intervals; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 0.2;
    const price = Math.round(basePrice * (1 + variation));
    const date = new Date();
    
    switch (period) {
      case '1h':
        date.setMinutes(date.getMinutes() - i * 5);
        break;
      case '1d':
        date.setHours(date.getHours() - i);
        break;
      case '1w':
        date.setDate(date.getDate() - i);
        break;
      case '1m':
        date.setDate(date.getDate() - i);
        break;
    }
    
    points.push({
      time: date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        ...(period === '1w' || period === '1m' ? { month: '2-digit', day: '2-digit' } : {})
      }),
      price
    });
  }
  
  return points;
}

export function getRecentListings(itemId: string): Listing[] {
  const sellers = ['김시바', '박로스', '이갱스터', '최딜러', '정보스'];
  const basePrice = mockItems.find(item => item.id === itemId)?.price || 1000000;
  
  return Array.from({ length: 5 }, (_, i) => ({
    id: `listing-${itemId}-${i}`,
    seller: sellers[i],
    price: Math.round(basePrice * (0.9 + Math.random() * 0.2)),
    quantity: Math.floor(Math.random() * 10) + 1,
    expiresIn: `${Math.floor(Math.random() * 24)}시간 ${Math.floor(Math.random() * 60)}분`
  }));
}

export function getTradeHistory(itemId: string): Trade[] {
  const traders = ['구매자김', '구매자박', '구매자이', '판매자최', '판매자정'];
  const basePrice = mockItems.find(item => item.id === itemId)?.price || 1000000;
  
  return Array.from({ length: 10 }, (_, i) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 30);
    
    return {
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      price: Math.round(basePrice * (0.9 + Math.random() * 0.2)),
      quantity: Math.floor(Math.random() * 5) + 1,
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      buyer: traders[Math.floor(Math.random() * traders.length)],
      seller: traders[Math.floor(Math.random() * traders.length)]
    };
  });
}

// Statistics mock data functions
export function getDailyTradeVolume(days: number = 7): DailyTradeVolume[] {
  const data: DailyTradeVolume[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      volume: Math.floor(Math.random() * 1000) + 500,
      value: Math.floor(Math.random() * 5000000000) + 1000000000, // 원 단위로 증가
      trades: Math.floor(Math.random() * 200) + 100
    });
  }
  
  return data;
}

export function getCategoryStats(): CategoryStats[] {
  const categories = [
    { name: '무기', color: '#ff4444' },
    { name: '차량', color: '#4444ff' },
    { name: '소비품', color: '#44ff44' },
    { name: '부동산', color: '#ffaa00' },
    { name: '의류', color: '#ff44ff' },
    { name: '전자제품', color: '#00ffff' },
    { name: '불법품', color: '#666666' }
  ];
  
  const totalVolume = 10000;
  let remaining = totalVolume;
  
  return categories.map((category, index) => {
    const isLast = index === categories.length - 1;
    const volume = isLast ? remaining : Math.floor(Math.random() * (remaining / 2)) + 100;
    remaining -= volume;
    
    return {
      category: category.name,
      volume,
      value: volume * (Math.floor(Math.random() * 5000000) + 1000000), // 원 단위
      percentage: Math.round((volume / totalVolume) * 100),
      color: category.color
    };
  });
}

export function getPopularItems(limit: number = 10): PopularItem[] {
  return mockItems.slice(0, limit).map((item, index) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    trades: Math.floor(Math.random() * 100) + 50 - index * 5,
    volume: Math.floor(Math.random() * 500) + 200 - index * 10,
    avgPrice: item.price + Math.floor(Math.random() * 2000000) - 1000000, // 원 단위
    priceChange: (Math.random() - 0.5) * 20
  })).sort((a, b) => b.trades - a.trades);
}

export function getTraderActivity(limit: number = 10): TraderActivity[] {
  const nicknames = [
    '시바킹', '로스앤젤레스', '갱스터보스', '딜러마스터', '언더그라운드',
    '스트리트파이터', '카지노킹', '머니메이커', '블랙마켓', '시티헌터'
  ];
  
  return Array.from({ length: limit }, (_, i) => ({
    userId: `user_${i + 1}`,
    nickname: nicknames[i] || `플레이어${i + 1}`,
    trades: Math.floor(Math.random() * 200) + 100 - i * 10,
    volume: Math.floor(Math.random() * 1000) + 500 - i * 20,
    value: Math.floor(Math.random() * 1000000000) + 500000000 - i * 50000000, // 원 단위
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10
  })).sort((a, b) => b.trades - a.trades);
}

export function getWeeklyTrends(weeks: number = 8): WeeklyTrend[] {
  const data: WeeklyTrend[] = [];
  
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    data.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      totalTrades: Math.floor(Math.random() * 1000) + 800 + i * 50,
      totalVolume: Math.floor(Math.random() * 5000) + 3000 + i * 200,
      totalValue: Math.floor(Math.random() * 10000000000) + 5000000000 + i * 500000000, // 원 단위
      activeTraders: Math.floor(Math.random() * 200) + 150 + i * 10
    });
  }
  
  return data;
}

// Summary statistics
export function getTradeSummary() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayTrades = Math.floor(Math.random() * 500) + 300;
  const yesterdayTrades = Math.floor(Math.random() * 500) + 300;
  
  return {
    todayTrades,
    yesterdayTrades,
    tradesChange: ((todayTrades - yesterdayTrades) / yesterdayTrades * 100),
    totalVolume: Math.floor(Math.random() * 10000) + 5000,
    totalValue: Math.floor(Math.random() * 20000000000) + 10000000000, // 원 단위
    activeTraders: Math.floor(Math.random() * 300) + 200,
    avgTradeValue: Math.floor(Math.random() * 10000000) + 5000000 // 원 단위
  };
}
