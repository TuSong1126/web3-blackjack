"use client";
import { useEffect, useState } from "react";

interface Card {
  suit: string;
  rank: string;
}

export default function Page() {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const initGame = async () => {
      const response = await fetch("/api", { method: "GET" });
      const data = await response.json();

      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setMessage(data.message);
    };

    initGame();
  }, []);

  // 要牌
  const handleHit = async () => {
    const response = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({ action: "hit" }),
    });
    const data = await response.json();

    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
  };

  // 停牌
  const handleStand = async () => {
    const response = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({ action: "stand" }),
    });
    const data = await response.json();

    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
  };

  // 重置游戏
  const handleReset = async () => {
    const response = await fetch("/api", { method: "GET" });
    const data = await response.json();

    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
  };

  return (
    <div className="flex flex-col items-center h-screen bg-gray-400">
      <h1 className="my-4 text-4xl bold">Welcome the black jack game!</h1>
      <h2
        className={`my-4 text-2xl bold
        ${message.includes("玩家赢") ? "bg-green-500" : "bg-yellow-500"}`}
      >
        {message}
      </h2>

      <div>
        dealer hand:
        <div className="flex flex-row gap-2">
          {dealerHand.length === 0 ? (
            <></>
          ) : (
            dealerHand.map((card, index) => (
              <div
                className="h-42 w-28 border-black border-1 flex flex-col justify-between rounded-sm bg-white"
                key={index}
              >
                <h2 className="self-start text-2xl pt-3 pl-3">{card.rank}</h2>
                <h2 className="self-center text-3xl">{card.suit}</h2>
                <h2 className="self-end text-2xl pb-3 pr-3">{card.rank}</h2>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        Player hand hand:
        <div className="flex flex-row gap-2">
          {playerHand.length === 0 ? (
            <></>
          ) : (
            playerHand.map((card, index) => (
              <div
                className="h-42 w-28 border-black border-1 flex flex-col justify-between rounded-sm bg-white"
                key={index}
              >
                <h2 className="self-start text-2xl pt-3 pl-3">{card.rank}</h2>
                <h2 className="self-center text-3xl">{card.suit}</h2>
                <h2 className="self-end text-2xl pb-3 pr-3">{card.rank}</h2>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-row gap-2 mt-4">
        {message !== "" ? (
          <button onClick={handleReset} className="p-1 bg-amber-300 rounded-lg">
            reset
          </button>
        ) : (
          <>
            <button onClick={handleHit} className="p-1 bg-amber-300 rounded-lg">
              hit
            </button>
            <button
              onClick={handleStand}
              className="p-1 bg-amber-300 rounded-lg"
            >
              stand
            </button>
          </>
        )}
      </div>
    </div>
  );
}
