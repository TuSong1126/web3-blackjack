"use client";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import { Card, calculateHandValue, globalStyles, sleep } from "./config";

export default function Page() {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [message, setMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const { address, isConnected } = useAccount();
  const [signed, setSigned] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { signMessageAsync } = useSignMessage();
  const [walletButtonLoaded, setWalletButtonLoaded] = useState<boolean>(false);

  // 添加全局样式
  useEffect(() => {
    // 添加样式到head
    const styleEl = document.createElement("style");
    styleEl.innerHTML = globalStyles;
    document.head.appendChild(styleEl);

    // 清理函数
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // 监听钱包组件加载状态
  useEffect(() => {
    // 假设钱包组件加载需要一定时间，我们设置一个标志
    // 在组件挂载后短暂延迟来模拟组件加载完成
    const timer = setTimeout(() => {
      setWalletButtonLoaded(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const initGame = async () => {
    // 先清空牌组，显示等待游戏开始状态
    setPlayerHand([]);
    setDealerHand([]);

    // 请求游戏数据
    const response = await fetch(`/api?playerAddress=${address}`, {
      method: "GET",
    });
    const data = await response.json();

    // 如果出错，则打印错误信息
    if (data.error) {
      console.error(data.error);
      return;
    }

    // 延迟500ms，让用户看到等待状态
    await sleep(500);

    // 更新游戏状态
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
    // 先清空牌组，显示等待游戏开始状态
    setPlayerHand([]);
    setDealerHand([]);
    setMessage("");

    // 请求游戏数据
    const response = await fetch(`/api?playerAddress=${address}`, {
      method: "GET",
    });
    const data = await response.json();

    // 延迟500ms，让用户看到等待状态
    await sleep(500);

    // 更新游戏状态
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

      const message = `Welcome to Crypto BlackJack! Sign to play at ${new Date().toString()}`;
      console.log("Attempting to sign message:", message);

      const signature = await signMessageAsync({ message });
      console.log("Signature received:", signature);

      // 开始页面loading
      setIsLoading(true);

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

        // 使用sleep函数等待2秒
        await sleep(2000);
        setSigned(true);
        initGame();
        // 页面loading结束
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during signing:", error);
      setIsLoading(false); // 发生错误时也结束loading
    }
  };

  // 退出游戏
  const handleLogout = () => {
    // 清除本地存储的token
    localStorage.removeItem("token");
    // 重置签名状态
    setSigned(false);
    // 清空游戏数据
    setPlayerHand([]);
    setDealerHand([]);
    setMessage("");
    setScore(0);
  };

  // 计算手牌点数
  const playerHandValue = calculateHandValue(playerHand);
  const dealerHandValue = calculateHandValue(dealerHand);

  // 渲染卡牌
  const renderCard = (card: Card, index: number) => (
    <div
      className="h-36 w-24 rounded-xl flex flex-col justify-between p-3 bg-white shadow-lg transform hover:scale-105 transition-all duration-300 group"
      key={index}
      style={{
        backgroundImage: "linear-gradient(135deg, #ffffff 5%, #f8f8f8 70%)",
        boxShadow:
          "0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)",
        animation: `fadeIn 0.3s ease-out forwards ${index * 0.1}s`,
        opacity: 0,
      }}
    >
      <div className="absolute inset-0 rounded-xl border-2 border-white/50 pointer-events-none"></div>
      <div
        className={`absolute bottom-0 left-0 right-0 h-1/3 rounded-b-xl bg-gradient-to-t ${
          card.suit === "♥" || card.suit === "♦"
            ? "from-red-500/10 to-transparent"
            : "from-gray-800/10 to-transparent"
        } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>
      <h2
        className={`self-start text-xl font-bold ${
          card.suit === "♥" || card.suit === "♦"
            ? "text-red-500 drop-shadow-sm"
            : "text-gray-800 drop-shadow-sm"
        }`}
      >
        {card.rank}
      </h2>
      <h2
        className={`self-center text-3xl transform group-hover:scale-125 transition-transform duration-300 ${
          card.suit === "♥" || card.suit === "♦"
            ? "text-red-500 drop-shadow-md"
            : "text-gray-800 drop-shadow-md"
        }`}
      >
        {card.suit}
      </h2>
      <h2
        className={`self-end text-xl font-bold ${
          card.suit === "♥" || card.suit === "♦"
            ? "text-red-500 drop-shadow-sm"
            : "text-gray-800 drop-shadow-sm"
        }`}
      >
        {card.rank}
      </h2>
    </div>
  );

  if (!signed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">
            Crypto BlackJack
          </h1>
          <p className="text-gray-300 text-lg max-w-md mx-auto">
            链上21点游戏体验，连接钱包开始游戏
          </p>
        </div>

        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 flex flex-col items-center gap-6 w-full max-w-lg">
          <div className="flex justify-center items-center h-20 w-20 rounded-full bg-gradient-to-br from-purple-800 to-indigo-900 mb-4 border-2 border-amber-400 shadow-lg shadow-amber-400/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              <path d="M12 6l-5 5.5 5 5.5 5-5.5z" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <path d="M7 21v-4M17 21v-4" />
            </svg>
          </div>

          {/* 钱包连接按钮占位加载效果 */}
          {!walletButtonLoaded ? (
            <div className="h-[44px] w-full max-w-[240px] rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse flex items-center justify-center gap-2 px-3">
              <div className="w-5 h-5 border-t-2 border-amber-400 rounded-full animate-spin"></div>
              <span className="text-amber-400 text-sm font-medium">
                钱包连接中...
              </span>
            </div>
          ) : (
            <ConnectButton />
          )}

          {/* 只有当钱包按钮加载完成且已连接时才显示签名按钮 */}
          {walletButtonLoaded && isConnected && (
            <button
              onClick={handleSign}
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg font-bold text-gray-900 shadow-lg hover:shadow-amber-500/20 hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 mt-4 flex items-center justify-center gap-2 ${
                isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-gray-900 rounded-full animate-spin mr-2"></div>
                  处理中...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  签名授权开始游戏
                </>
              )}
            </button>
          )}

          {/* 未连接钱包时显示提示 */}
          {walletButtonLoaded && !isConnected && (
            <div className="mt-4 py-2 px-4 rounded-lg border border-amber-800/30 bg-amber-900/20 text-amber-400 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V7z"
                    clipRule="evenodd"
                  />
                </svg>
                请先连接钱包以开始游戏
              </div>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 text-amber-400 text-sm flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              正在连接游戏服务...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-8 text-gray-400 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          安全游戏，钱包签名仅用于授权
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-blue-900 to-black p-3">
      {/* 顶部标题栏 */}
      <div
        className="w-full max-w-6xl mx-auto flex justify-between items-center py-3 px-6 rounded-xl mb-8
        bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-md
        border border-gray-700/50 shadow-lg transform transition-all duration-300 
        hover:shadow-purple-900/20 hover:border-gray-600/70"
        style={{
          boxShadow:
            "0 10px 30px -15px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          animation: "fadeIn 0.6s ease-out",
        }}
      >
        <div className="flex flex-col">
          <h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600
            filter drop-shadow-sm hover:drop-shadow-md transition-all duration-300 transform hover:scale-105 origin-left"
          >
            Crypto BlackJack
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="px-4 py-2 rounded-lg bg-gray-800 text-amber-400 flex items-center gap-2 animate-pulse">
              <svg
                className="animate-spin h-4 w-4 text-amber-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              正在加载...
            </div>
          )}

          {message && !isLoading && (
            <div
              className={`px-4 py-2 font-medium transform transition-all duration-300 
              animate-fadeIn ${
                message.includes("玩家赢")
                  ? "text-green-400"
                  : message.includes("庄家赢")
                    ? "text-red-400"
                    : "text-blue-400"
              }`}
              style={{ animation: message ? "pulseOnce 0.5s ease-out" : "" }}
            >
              {message}
            </div>
          )}

          {/* 增强分数显示 */}
          <div
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/90 to-yellow-600/90 text-white
            border border-amber-500/50 shadow-lg shadow-amber-600/20 transform transition-all duration-300 
            hover:shadow-amber-500/30 hover:scale-105 group"
          >
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-amber-200 transform transition-transform duration-500 group-hover:rotate-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-xl text-white transition-all duration-300">
                  {score}
                </span>
              </div>
            </div>
          </div>

          {/* 降低退出按钮的视觉效果 */}
          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 rounded-lg bg-gray-800/70 hover:bg-gray-700/70
            text-gray-400 hover:text-gray-300 border border-gray-700/30 transform transition-all duration-300
            text-sm flex items-center gap-1.5 ml-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            退出
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden">
        {/* 游戏区域 */}
        <div className="w-full max-w-5xl mx-auto backdrop-blur-sm rounded-xl mb-2 overflow-hidden relative">
          {/* 游戏区域背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-indigo-900/20 to-purple-900/30 -z-10"></div>
          <div className="relative bg-gradient-to-br from-gray-900/70 to-gray-800/80 p-6 rounded-xl border border-gray-700/50 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* 装饰元素 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/4"></div>

            {/* 庄家区域 */}
            <div className="mb-3 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex justify-center items-center h-8 w-8 rounded-full bg-gradient-to-br from-red-800 to-red-600 shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-red-100">
                      庄家
                    </h2>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-red-600 to-transparent rounded-full"></div>
                  </div>
                </div>
                {dealerHand.length > 0 && (
                  <span className="text-sm text-white py-0.5 px-3 bg-red-800/70 rounded-full shadow-md animate-fadeIn">
                    {dealerHandValue}点
                  </span>
                )}
              </div>

              <div className="flex flex-row gap-3 overflow-x-auto pb-3 pl-2">
                {dealerHand.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-36 w-full">
                    <div className="w-10 h-10 border-t-2 border-amber-500 rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-400 text-center">等待游戏开始...</p>
                  </div>
                ) : (
                  dealerHand.map((card, index) => renderCard(card, index))
                )}
              </div>
            </div>

            {/* 分隔线 */}
            <div className="relative my-2 pb-1">
              <div className="absolute inset-0 h-px w-full bg-gradient-to-r from-transparent via-gray-600/30 to-transparent"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-800/90 border border-gray-700/50 flex items-center justify-center shadow-inner z-10">
                <span className="text-amber-500 font-bold text-sm">VS</span>
              </div>
            </div>

            {/* 玩家区域 */}
            <div className="relative z-10 mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex justify-center items-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-800 to-blue-600 shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100">
                        玩家
                      </h2>
                      <span className="text-xs text-gray-500 ml-2 truncate max-w-xs py-1 px-2 bg-gray-800/50 rounded-full border border-gray-700/30">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-blue-600 to-transparent rounded-full"></div>
                  </div>
                </div>
                {playerHand.length > 0 && (
                  <span className="text-sm text-white py-0.5 px-3 bg-blue-800/70 rounded-full shadow-md animate-fadeIn">
                    {playerHandValue}点
                  </span>
                )}
              </div>

              <div className="flex flex-row gap-3 overflow-x-auto pb-3 pl-2">
                {playerHand.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-36 w-full">
                    <div className="w-10 h-10 border-t-2 border-amber-500 rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-400 text-center">等待游戏开始...</p>
                  </div>
                ) : (
                  playerHand.map((card, index) => renderCard(card, index))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 按钮区域 - 重新设计更紧凑的底部栏 */}
        <div className="w-full max-w-5xl mx-auto mb-2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-gray-800/60 blur-md rounded-2xl transform -skew-y-1"></div>
          <div className="relative z-10 flex justify-center items-center gap-5 py-4 px-6 rounded-xl">
            {message !== "" ? (
              <button
                onClick={handleReset}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg font-bold text-lg text-gray-900 
                  shadow-[0_8px_15px_-2px_rgba(245,158,11,0.3)] transform transition-all duration-300 
                  hover:shadow-[0_10px_20px_-1px_rgba(245,158,11,0.5)] hover:translate-y-[-2px] hover:from-amber-400 hover:to-yellow-400 
                  active:translate-y-[1px] border border-amber-400/20 flex items-center gap-2.5 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                重新开始
              </button>
            ) : (
              <>
                <button
                  onClick={handleHit}
                  className="px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold text-lg text-white 
                    shadow-[0_8px_15px_-2px_rgba(16,185,129,0.3)] transform transition-all duration-300 
                    hover:shadow-[0_10px_20px_-1px_rgba(16,185,129,0.5)] hover:translate-y-[-2px] hover:from-green-400 hover:to-emerald-500 
                    active:translate-y-[1px] border border-green-500/20 flex items-center gap-2.5 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11v6M9 14h6"
                    />
                  </svg>
                  要牌
                </button>
                <button
                  onClick={handleStand}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-bold text-lg text-white 
                    shadow-[0_8px_15px_-2px_rgba(79,70,229,0.3)] transform transition-all duration-300 
                    hover:shadow-[0_10px_20px_-1px_rgba(79,70,229,0.5)] hover:translate-y-[-2px] hover:from-blue-400 hover:to-indigo-500 
                    active:translate-y-[1px] border border-blue-500/20 flex items-center gap-2.5 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 3h4v18h-4z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 9a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9z"
                    />
                  </svg>
                  停牌
                </button>
              </>
            )}
          </div>

          {/* 底部链接区集成到按钮区域内部 */}
          <div className="w-full text-center text-gray-400 text-xs flex items-center justify-center gap-1 mt-1.5">
            <span>Powered by</span>
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 text-amber-400"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 font-semibold">
              区块链技术
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
