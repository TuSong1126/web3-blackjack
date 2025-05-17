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
