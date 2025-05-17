// 定义卡牌接口
export interface Card {
  suit: string;
  rank: string;
}

// 计算手牌值
export function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let acesCount = 0;

  hand.forEach((card) => {
    if (card.rank === "A") {
      acesCount++;
      value += 11;
    } else if (card.rank === "J" || card.rank === "Q" || card.rank === "K") {
      value += 10;
    } else if (card.rank !== "?") {
      // 忽略背面牌
      value += parseInt(card.rank);
    }
  });

  // 如果手牌价值大于21且有A，则将A的价值改为1(11->1)
  while (value > 21 && acesCount > 0) {
    value -= 10;
    acesCount--;
  }

  return value;
}

// 添加全局CSS动画定义
export const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulseOnce {
    0% { transform: scale(0.95); opacity: 0.7; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.4s ease-out;
  }
`;

// 定义sleep函数
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, ms);
  });
};
