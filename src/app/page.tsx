"use client";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";

interface Card {
  suit: string;
  rank: string;
}

export default function Page() {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [message, setMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const { address, isConnected } = useAccount();
  const [signed, setSigned] = useState<boolean>(false);
  const { signMessageAsync } = useSignMessage();

  const initGame = async () => {
    const response = await fetch("/api", { method: "GET" });
    const data = await response.json();

    // 如果出错，则打印错误信息
    if (data.error) {
      console.error(data.error);
      return;
    }

    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  };

  // 要牌
  const handleHit = async () => {
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ action: "hit", playerAddress: address }),
    });
    const data = await response.json();

    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  };

  // 停牌
  const handleStand = async () => {
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ action: "stand", playerAddress: address }),
    });
    const data = await response.json();

    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  };

  // 重置游戏
  const handleReset = async () => {
    const response = await fetch("/api", { method: "GET" });
    const data = await response.json();

    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  };

  // 发起签名
  const handleSign = async () => {
    try {
      if (!isConnected) {
        console.error("Wallet not connected");
        return;
      }

      const message = `Welcome to the black jack game at ${new Date().toString()}`;
      console.log("Attempting to sign message:", message);

      const signature = await signMessageAsync({ message });
      console.log("Signature received:", signature);

      const response = await fetch("/api", {
        method: "POST",
        body: JSON.stringify({
          action: "auth",
          playerAddress: address,
          signature,
          message,
        }),
      });

      if (response.status === 200) {
        const { token } = await response.json();
        localStorage.setItem("token", token);
        setSigned(true);
        initGame();
      }
    } catch (error) {
      console.error("Error during signing:", error);
    }
  };

  if (!signed) {
    return (
      <div className="flex flex-col items-center h-screen bg-gray-400 h-full justify-center gap-16">
        <ConnectButton />
        {isConnected && (
          <button
            className="bg-amber-300 rounded-lg p-2 cursor-pointer "
            onClick={handleSign}
          >
            Sign with you wallet
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-screen bg-gray-400">
      <h1 className="my-4 text-4xl bold">Welcome the black jack game!</h1>
      <h2
        className={`my-4 text-2xl bold
        ${message.includes("玩家赢") ? "bg-green-500" : "bg-yellow-500"}`}
      >
        {message}
      </h2>
      <h2 className="my-4 text-2xl bold">Score: {score}</h2>
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
