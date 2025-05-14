interface Card {
  suit: string;
  rank: string;
}
interface GameState {
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  message: string;
  score: number;
}

const suits = ["♠️", "♥️", "♦️", "♣️"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const initialDeck = suits
  .map((suit) => ranks.map((rank) => ({ suit: suit, rank: rank })))
  .flat();

const gameState: GameState = {
  playerHand: [],
  dealerHand: [],
  deck: initialDeck,
  message: "",
  score: 0,
};

// 从牌堆中随机获取count张牌，并返回随机获取的牌和剩余的牌
const getRandomCards = (deck: Card[], count: number) => {
  const randomIndexSet = new Set<number>();

  while (randomIndexSet.size < count) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    randomIndexSet.add(randomIndex);
  }

  const randomCards = deck.filter((_, index) => randomIndexSet.has(index));
  const remainingDeck = deck.filter((_, index) => !randomIndexSet.has(index));

  return [randomCards, remainingDeck];
};

export async function GET(request: Request) {
  // 重置游戏状态
  gameState.playerHand = [];
  gameState.dealerHand = [];
  gameState.deck = initialDeck;
  gameState.message = "";

  // 当游戏开始时，玩家和庄家分别获得2张随机牌
  const [playerCards, remainingDeck] = getRandomCards(gameState.deck, 2);
  const [dealerCards, newDeck] = getRandomCards(remainingDeck, 2);
  gameState.playerHand = playerCards;
  gameState.dealerHand = dealerCards;
  gameState.deck = newDeck;
  gameState.message = "";

  return new Response(
    JSON.stringify({
      playerHand: gameState.playerHand,
      dealerHand: [gameState.dealerHand[0], { suit: "?", rank: "?" }],
      //   deck: gameState.deck, // 后端控制牌堆，不应该直接返回给前端
      message: gameState.message,
      score: gameState.score,
    }),
    { status: 200 }
  );
}

export async function POST(request: Request) {
  const { action } = await request.json();

  // 要牌
  if (action === "hit") {
    const [cards, newDeck] = getRandomCards(gameState.deck, 1);
    gameState.playerHand.push(...cards);
    gameState.deck = newDeck;

    const playerValue = calculateHandValue(gameState.playerHand);
    if (playerValue > 21) {
      gameState.message = "玩家输，庄家赢";
      gameState.score -= 100;
    } else if (playerValue === 21) {
      gameState.message = "玩家赢，庄家输";
      gameState.score += 100;
    }
  }

  // 停牌
  else if (action === "stand") {
    const dealerValue = calculateHandValue(gameState.dealerHand);
    while (calculateHandValue(gameState.dealerHand) < 17) {
      const [cards, newDeck] = getRandomCards(gameState.deck, 1);
      gameState.dealerHand.push(...cards);
      gameState.deck = newDeck;
    }
    const playerValue = calculateHandValue(gameState.playerHand);

    if (dealerValue > 21) {
      gameState.message = "玩家赢，庄家输";
      gameState.score += 100;
    } else if (dealerValue === 21) {
      gameState.message = "玩家输，庄家赢";
      gameState.score -= 100;
    } else {
      if (playerValue > dealerValue) {
        gameState.message = "玩家赢，庄家输";
        gameState.score += 100;
      } else if (playerValue < dealerValue) {
        gameState.message = "玩家输，庄家赢";
        gameState.score -= 100;
      } else {
        gameState.message = "平局";
      }
    }
  } else {
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
    });
  }

  return new Response(
    JSON.stringify({
      playerHand: gameState.playerHand,
      dealerHand:
        gameState.message === "" // 游戏未结束
          ? [gameState.dealerHand[0], { suit: "?", rank: "?" }]
          : gameState.dealerHand,
      message: gameState.message,
      score: gameState.score,
    }),
    { status: 200 }
  );
}

// 计算手牌值
function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let acesCount = 0;
  hand.forEach((card) => {
    if (card.rank === "A") {
      acesCount++;
      value += 11;
    } else if (card.rank === "J" || card.rank === "Q" || card.rank === "K") {
      value += 10;
    } else {
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
