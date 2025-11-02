"use client";

import Image from "next/image";
import { metaMask } from "wagmi/connectors";
import { useAccount, useConnect, useDisconnect, useSendCalls, useSwitchChain } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { getCallsStatus } from "@wagmi/core";
import { wagmiConfig as config } from "@/providers/AppProvider";
import { parseEther } from "viem";
import AssetChecker from "@/components/AssetChecker";
import { useChainId } from "wagmi";
import { mainnet, polygon, bsc, arbitrum, base } from "viem/chains";

// 支持的链配置
const SUPPORTED_CHAINS = [
  { id: mainnet.id, name: 'Ethereum', logo: '/ethereum-logo.svg' },
  { id: polygon.id, name: 'Polygon', logo: '/polygon-logo.svg' }, 
  { id: bsc.id, name: 'BSC', logo: '/bnb-logo.svg' },
  { id: arbitrum.id, name: 'Arbitrum', logo: '/arbitrum-logo.svg' },
  { id: base.id, name: 'Base', logo: '/base-logo.svg' },
];

// Chain ID to chain name mapping
const CHAIN_NAMES = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'Binance Smart Chain',
  42161: 'Arbitrum',
  8453: 'Base'
};

// Get native currency name based on chain ID
function getNativeCurrencyName(chainId: number | undefined): string {
  if (!chainId) return 'ETH';
  switch (chainId) {
    case 56: // BSC
      return 'BNB';
    case 137: // Polygon
      return 'POL';
    default:
      return 'ETH';
  }
}

// 根据链ID获取区块浏览器链接
function getExplorerUrl(chainId: number, txHash: string): string {
  const explorerUrls = {
    1: `https://etherscan.io/tx/${txHash}`, // Ethereum
    137: `https://polygonscan.com/tx/${txHash}`, // Polygon
    56: `https://bscscan.com/tx/${txHash}`, // BSC
    42161: `https://arbiscan.io/tx/${txHash}`, // Arbitrum
    8453: `https://basescan.org/tx/${txHash}`, // Base
  };
  return explorerUrls[chainId as keyof typeof explorerUrls] || `https://etherscan.io/tx/${txHash}`;
}

// Language type
type Language = 'zh' | 'en';

// Text mapping
const texts = {
  zh: {
    title: '钱包清道夫',
    subtitle: '基于MetaMask智能账户的批量交易功能，一键转移钱包内的资产（原生代币+ERC20代币）',
    connectWallet: '连接钱包',
    disconnect: '断开连接',
    executeBatchTransaction: '执行批量交易',
    transactions: '笔交易',
    exceededLimit: '（⚠️ 超出限制）',
    notGenerated: '(未生成)',
    noTransactionData: '📋 暂无交易数据',
    queryAssetsFirst: '请先查询资产并生成批量转账数据',
    willSend: '将发送',
    transactionsFromAssets: '笔交易 (从资产列表中生成，已过滤掉会回滚的交易)',
    totalTransactions: '共',
    onlyFirstTen: '笔，仅执行前 10 笔',
    sendBatchTransaction: '发送批量交易（只需花费1次Gas费）',
    sendingTransaction: '⌛ 正在发送交易...',
    transactionSubmitted: '交易已成功提交！',
    dataId: 'Data ID:',
    transactionCount: '交易数量:',
    original: '原',
    actuallySent: '笔，实际发送',
    checkingStatus: 'Checking Status...',
    checkStatus: '🔍 检查交易状态',
    statusCheckError: 'Status Check Error',
    transactionConfirmed: '✅ 交易已确认！🎉',
    viewOnExplorer: 'View on Explorer:',
    transactionError: 'Transaction Error',
    tutorial: 'Tutorial',
    github: 'GitHub',
    switchToEnglish: 'English',
    switchToChinese: '中文',
    connectedTo: '已连接到',
    queryAssetsAndGenerate: '⚠️ 请先查询资产并生成批量转账数据',
    total: '共',
    onlyFirstTenExecuted: '笔，仅执行前 10 笔',
    totalAmount: '✪ Total Amount:',
    transactionPending: '交易提交中...',
    switchChainFailed: '切换网络失败:',
    ensureNetworkAdded: '请确保目标网络已添加到 MetaMask。',
    eip7702Limit: 'EIP-7702 交易笔数限制',
    maxTenTransactions: '• 每次批量交易最多支持 10 笔',
    excessNotExecuted: '• 超出限制的交易不会被执行',
    suggestBatchProcessing: '• 建议分批处理大量资产',
    share: '分享',
    tweet: '推文',
    copy: '复制',
    nativeTransfer: 'Native Transfer',
    erc20Transfer: 'ERC20 Transfer',
    // Header/status and network info
    networkInfoTitle: '网络信息',
    networkChangedPrompt: '网络已切换',
    currentChainLabel: '当前链',
    unknownChain: '未知链',
    chainIdLabel: '链ID',
    addressLabel: '地址',
  },
  en: {
    title: 'Wallet Scavenger',
    subtitle: 'Powered by MetaMask Smart Account, transfer your assets (Native + ERC20) with one click',
    connectWallet: 'Connect Wallet',
    disconnect: 'Disconnect',
    executeBatchTransaction: 'Execute Batch Transaction',
    transactions: ' transactions',
    exceededLimit: ' (⚠️ Exceeded limit)',
    notGenerated: '(Not generated)',
    noTransactionData: '📋 No transaction data',
    queryAssetsFirst: 'Please query assets and generate batch transfer data first',
    willSend: 'Will send',
    transactionsFromAssets: ' transactions (generated from asset list, transactions that will be rolled back have been filtered.)',
    totalTransactions: 'Total',
    onlyFirstTen: ' transactions, only first 10 executed',
    sendBatchTransaction: 'Send Batch Transaction (Only 1 Gas Fee)',
    sendingTransaction: '⌛ Sending transaction...',
    transactionSubmitted: 'Transaction submitted successfully!',
    dataId: 'Data ID:',
    transactionCount: 'Transaction count:',
    original: 'Original',
    actuallySent: ' transactions, actually sent',
    checkingStatus: 'Checking Status...',
    checkStatus: '🔍 Check Transaction Status',
    statusCheckError: 'Status Check Error',
    transactionConfirmed: '✅ Transaction Confirmed! 🎉',
    viewOnExplorer: 'View on Explorer:',
    transactionError: 'Transaction Error',
    tutorial: 'Tutorial',
    github: 'GitHub',
    switchToEnglish: 'English',
    switchToChinese: '中文',
    connectedTo: 'Connected to',
    queryAssetsAndGenerate: '⚠️ Please query assets and generate batch transfer data first',
    total: 'Total',
    onlyFirstTenExecuted: ' transactions, only first 10 executed',
    totalAmount: '✪ Total Amount:',
    transactionPending: 'Transaction submitting...',
    switchChainFailed: 'Switch network failed:',
    ensureNetworkAdded: 'Please ensure the target network has been added to MetaMask.',
    eip7702Limit: 'EIP-7702 Transaction Limit',
    maxTenTransactions: '• Maximum 10 transactions per batch',
    excessNotExecuted: '• Transactions exceeding the limit will not be executed',
    suggestBatchProcessing: '• Suggest processing large assets in batches',
    share: 'Share',
    tweet: 'Tweet',
    copy: 'Copy',
    nativeTransfer: 'Native Transfer',
    erc20Transfer: 'ERC20 Transfer',
    // Header/status and network info
    networkInfoTitle: 'Network Info',
    networkChangedPrompt: 'Network switched',
    currentChainLabel: 'Current chain',
    unknownChain: 'Unknown chain',
    chainIdLabel: 'Chain ID',
    addressLabel: 'Address',
  }
};

// Helper function to format transaction description based on current language
function formatTransactionDescription(transaction: any, language: Language): string {
  if (!transaction.description) return '';
  
  // For native_transfer, parse and reformat the description
  if (transaction.type === 'native_transfer') {
    // Match patterns like: "Transfer {amount} {symbol} (reserved {gasCost} for gas)"
    // or "Transfer {amount} {symbol} (预留 {gasCost} 作为gas费)"
    // Use more flexible pattern to match numbers with any decimal places
    const enPattern = /Transfer\s+([\d.]+(?:e[+-]?\d+)?)\s+(\S+?)\s+\(reserved\s+([\d.]+(?:e[+-]?\d+)?)\s+for\s+gas\)/i;
    const zhPattern = /Transfer\s+([\d.]+(?:e[+-]?\d+)?)\s+(\S+?)\s+\(预留\s+([\d.]+(?:e[+-]?\d+)?)\s+作为gas费\)/i;
    
    const enMatch = transaction.description.match(enPattern);
    const zhMatch = transaction.description.match(zhPattern);
    
    if (enMatch || zhMatch) {
      const match = enMatch || zhMatch;
      const amount = match[1];
      const symbol = match[2];
      const gasCost = match[3];
      
      const texts = language === 'zh' ? {
        nativeTransferDescription: 'Transfer {amount} {symbol} (预留 {gasCost} 作为gas费)'
      } : {
        nativeTransferDescription: 'Transfer {amount} {symbol} (reserved {gasCost} for gas)'
      };
      
      return texts.nativeTransferDescription
        .replace('{amount}', amount)
        .replace('{symbol}', symbol)
        .replace('{gasCost}', gasCost);
    }
  }
  
  // For ERC20 transfers, just return as is (already handled)
  return transaction.description;
}

export default function Home() {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendCalls, error, isPending, isSuccess, data, reset } = useSendCalls();
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [transactionCounts, setTransactionCounts] = useState<{ original: number; sent: number } | null>(null);
  const [customTransactions, setCustomTransactions] = useState<any[]>([]);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [precheckResult, setPrecheckResult] = useState<{ total: number; valid: number; failed: number } | null>(null);
  const [networkChanged, setNetworkChanged] = useState(false);
  const [previousChainId, setPreviousChainId] = useState<number | null>(null);
  const chainDropdownRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<Language>('en');
  const t = texts[language];
  // 底部分享功能
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = '原子批量交易工具';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      console.log('分享被取消或失败:', err);
    }
  };

  const handleTweet = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = '原子批量交易工具';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (typeof window !== 'undefined') {
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSendTransaction = async () => {
    if (!isConnected) return;

    // Reset previous states
    setTransactionHash(null);
    setStatusError(null);
    setTransactionCounts(null);
    reset();

  // 只使用自定义交易；若为空则直接返回（按钮已禁用，无需提示）
  if (customTransactions.length === 0) {
    return;
  }
    
    let transactionsToUse = customTransactions;
    
    // EIP-7702 最多支持10笔交易，自动截取前10笔
    const MAX_BATCH_SIZE = 10;
    const truncatedTransactions = transactionsToUse.slice(0, MAX_BATCH_SIZE);
    
    const calls = truncatedTransactions.map(call => ({
      to: call.to as `0x${string}`,
      value: parseEther(call.value),
      ...(call.data && { data: call.data as `0x${string}` })
    }));
    
    console.log("⌛ Sending batch transaction with calls:", calls);
    console.log(`原交易数量: ${transactionsToUse.length}，实际发送: ${truncatedTransactions.length}`);

    // 保存交易数量信息用于显示
    setTransactionCounts({
      original: transactionsToUse.length,
      sent: truncatedTransactions.length
    });

    if (!chainId) {
      console.error("发送批量交易失败：缺少链 ID");
      setStatusError("当前网络信息缺失，请重新连接钱包后再试。");
      return;
    }

    sendCalls({
      chainId,
      calls,
    });
  };

  const handleGetCallsStatus = async () => {
    if (!data?.id) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      const status = await getCallsStatus(config, { id: data.id });
      console.log("Transaction status:", status);

      if (
        status.status === "success" &&
        status.receipts?.[0]?.transactionHash
      ) {
        setTransactionHash(status.receipts[0].transactionHash);
      } else if (status.status === "failure") {
        setStatusError("Transaction failed");
      }
    } catch (err) {
      console.error("Error getting call status:", err);
      setStatusError(
        err instanceof Error ? err.message : "Failed to get transaction status"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const handleGenerateTransactions = (transactions: any[], precheckResult?: { total: number; valid: number; failed: number }) => {
    setCustomTransactions(transactions);
    setPrecheckResult(precheckResult || null);
    // 只生成交易配置，不自动下载
    console.log('Generated transactions:', transactions);
    if (precheckResult) {
      console.log('Pre-check result:', precheckResult);
    }
  };

  // Listen to chain changes
  useEffect(() => {
    if (chainId && previousChainId && chainId !== previousChainId) {
      // Chain has changed
      console.log('Network switched', { from: previousChainId, to: chainId });
      setTransactionHash(null);
      setStatusError(null);
      setStatusLoading(false);
      setNetworkChanged(true);
      // Hide network switch message after 3 seconds
      setTimeout(() => setNetworkChanged(false), 3000);
      // Clear all transaction data when network changes
      setCustomTransactions([]);
      setTransactionCounts(null);
      setPrecheckResult(null);
      // Reset wagmi transaction state
      reset();
    }
    setPreviousChainId(chainId);
  }, [chainId, previousChainId, reset]);

  const handleSwitchChain = async (targetChainId: number) => {
    // 如果已经在目标链上，直接关闭下拉菜单
    if (chainId === targetChainId) {
      setIsChainDropdownOpen(false);
      return;
    }

    try {
      setIsChainDropdownOpen(false);
      await switchChain({ chainId: targetChainId });
    } catch (error: any) {
      console.error('切换链失败:', error);
      // 显示错误信息
      setStatusError(`${t.switchChainFailed} ${error?.message || '未知错误'}。${t.ensureNetworkAdded}`);
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target as Node)) {
        setIsChainDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="font-sans min-h-screen">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <a
                href="https://docs.metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="MetaMask Documentation"
              >
                <Image
                  src="/mm.svg"
                  alt="MetaMask logo"
                  width={40}
                  height={40}
                  priority
                />
              </a>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.subtitle}
                </span>
              </div>
            </div>
            
            {/* 右侧按钮组 */}
            <div className="flex items-center gap-3">
              {/* 语言切换按钮 */}
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Image
                  src="/language.svg"
                  alt="Language"
                  width={25}
                  height={25}
                  className="w-5 h-5"
                />
                <span>{language === 'zh' ? t.switchToEnglish : t.switchToChinese}</span>
              </button>

              {/* 教程与 GitHub 链接（来自 MM-EIP7702批量交易 导航栏） */}
              <a
                href="https://docs.metamask.io/tutorials/upgrade-eoa-to-smart-account/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="View Tutorial"
              >
                <Image
                  src="/tutorial.svg"
                  alt="Tutorial"
                  width={25}
                  height={25}
                  className="w-5 h-5"
                />
                <span>{t.tutorial}</span>
              </a>

              <a
                href="https://github.com/MetaMask/7702-livestream-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="View on GitHub"
              >
                <Image
                  src="/github.svg"
                  alt="GitHub"
                  width={25}
                  height={25}
                  className="w-5 h-5"
                />
                <span>{t.github}</span>
              </a>
              {/* 链选择下拉菜单 */}
              {isConnected && (
                <div className="relative" ref={chainDropdownRef}>
                  {/* 下拉菜单触发器 */}
                  <button
                    onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                  >
                    {chainId && (
                      <>
                        {(() => {
                          const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
                          if (currentChain?.logo) {
                            return (
                              <Image
                                src={currentChain.logo}
                                alt="Chain Logo"
                                width={16}
                                height={16}
                                className="w-4 h-4"
                              />
                            );
                          } else {
                            // 为没有logo的链显示默认图标
                            return (
                              <span className="text-sm">
                                ⛓️
                              </span>
                            );
                          }
                        })()}
                        <span>{SUPPORTED_CHAINS.find(chain => chain.id === chainId)?.name}</span>
                      </>
                    )}
                    <svg
                      className={`w-4 h-4 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 下拉菜单选项 */}
                  {isChainDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                      {SUPPORTED_CHAINS.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => handleSwitchChain(chain.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                            chainId === chain.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {chain.logo ? (
                            <Image
                              src={chain.logo}
                              alt={`${chain.name} Logo`}
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                          ) : (
                            <span className="text-sm">
                              ⛓️
                            </span>
                          )}
                          <span>{chain.name}</span>
                          {chainId === chain.id && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* 钱包连接按钮 */}
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors w-fit whitespace-nowrap ${
                  isConnected
                    ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-300"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300"
                }`}
                onClick={() => {
                  if (isConnected) {
                    disconnect();
                    setTransactionHash(null);
                    setStatusError(null);
                    setPrecheckResult(null);
                    reset();
                  } else {
                    connect({ connector: metaMask() });
                  }
                }}
              >
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Image
                      src="/MetaMask-icon-fox.svg"
                      alt="MetaMask"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span>{t.disconnect}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Image
                      src="/MetaMask-icon-fox.svg"
                      alt="MetaMask"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span>{t.connectWallet}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="pt-20 pb-20 px-8 sm:px-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* 钱包状态显示 */}
        {isConnected && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">🔗 {t.connectedTo} {address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          </div>
        )}

        {/* Network information section */}
        {isConnected && chainId && (
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full">
            <h2 className="text-xl font-semibold mb-4">🌐 {t.networkInfoTitle}</h2>
            
            {/* 网络切换提示 */}
            {networkChanged && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{t.networkChangedPrompt}</span>
                </div>
              </div>
            )}

            {/* 链信息显示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <div className="font-medium flex items-center gap-2">
                  <Image src="/blockchain2.svg" alt="Chain" width={16} height={16} />
                  {t.currentChainLabel}: {CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] || `${t.unknownChain} (${chainId})`}
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/id.svg" alt="Chain ID" width={16} height={16} />
                  {t.chainIdLabel}: {chainId}
                </div>
                {address && (
                  <div className="flex items-center gap-2">
                    <Image src="/address.svg" alt="Address" width={16} height={16} />
                    {t.addressLabel}: {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Asset Checker Section */}
        <AssetChecker onGenerateTransactions={handleGenerateTransactions} language={language} />

        {/* Batch transaction section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Image src="/run.svg" alt="Execute" width={24} height={24} className="w-6 h-6" />
              {t.executeBatchTransaction}
            </h2>
            {(() => {
              const transactionsToUse = customTransactions;
              const MAX_BATCH_SIZE = 10;
              const isOverLimit = transactionsToUse.length > MAX_BATCH_SIZE;
              return (
                <div className="relative group">
                  <div className={`text-[10px] font-medium px-3 py-1 rounded inline-flex items-center gap-2 ${
                    isOverLimit 
                      ? 'bg-red-100 text-red-700 border border-red-300' 
                      : transactionsToUse.length > 0
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-300'
                  }`}>
                    <span>{transactionsToUse.length}{t.transactions}</span>
                    {isOverLimit && <span>{t.exceededLimit}</span>}
                    {transactionsToUse.length === 0 && <span>{t.notGenerated}</span>}
                    <svg 
                      className="w-4 h-4 cursor-help opacity-60 hover:opacity-100 transition-opacity" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {/* 隐藏的批注说明 */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="font-semibold mb-1">{t.eip7702Limit}</div>
                    <div className="text-gray-300 space-y-1">
                      <p>{t.maxTenTransactions}</p>
                      <p>{t.excessNotExecuted}</p>
                      <p>{t.suggestBatchProcessing}</p>
                    </div>
                    {/* 小三角箭头 */}
                    <div className="absolute -top-2 right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-800"></div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Transaction details */}
          {(() => {
            const transactionsToUse = customTransactions;
            
            if (transactionsToUse.length === 0) {
              return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg py-4 px-8 mb-4">
                  <div className="text-xs text-gray-600 text-center">
                    <p className="mb-2">{t.noTransactionData}</p>
                    <p className="text-[10px]">{t.queryAssetsAndGenerate}</p>
                  </div>
                </div>
              );
            }
            
            const MAX_BATCH_SIZE = 10;
            const displayedTransactions = transactionsToUse.slice(0, MAX_BATCH_SIZE);
            const wasTruncated = transactionsToUse.length > MAX_BATCH_SIZE;
            
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg py-4 px-8 mb-4">
                {/* 预检结果显示 */}
                {precheckResult && (
                  <div className={`mb-3 px-3 py-2 rounded-lg border text-[12px] ${
                    precheckResult.failed === 0
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : precheckResult.valid > 0
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    {precheckResult.failed === 0 ? (
                      <span className="text-green-700 dark:text-green-700 font-medium">✅ {language === 'zh' ? '预检完成' : 'Pre-check Complete'}: {precheckResult.total}/{precheckResult.total} {language === 'zh' ? '笔通过' : 'passed'}</span>
                    ) : precheckResult.valid > 0 ? (
                      <span className="text-green-700 dark:text-green-700 font-medium">ℹ️ {language === 'zh' ? '预检结果' : 'Pre-check Result'}: {precheckResult.valid}/{precheckResult.total} {language === 'zh' ? '笔通过' : 'passed'}, {precheckResult.failed} {language === 'zh' ? '笔回滚' : 'rolled back'}</span>
                    ) : (
                      <span className="text-red-700 dark:text-red-400 font-medium">❌ {language === 'zh' ? '预检失败' : 'Pre-check Failed'}: {precheckResult.failed}/{precheckResult.total} {language === 'zh' ? '笔失败' : 'failed'}</span>
                    )}
                  </div>
                )}
                <h3 className="text-xs font-medium text-blue-800 mb-2">
                  {t.willSend} <span className="text-purple-800 dark:text-purple-800">{displayedTransactions.length} </span>{t.transactionsFromAssets}
                  {wasTruncated && <span className="text-orange-600 text-[10px] ml-2">⚠️ {t.total} {transactionsToUse.length}{t.onlyFirstTenExecuted}</span>}
                </h3>
                <ul className="text-xs text-blue-700 space-y-1 mb-3">
                  {displayedTransactions.map((transaction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {transaction.type === 'native_transfer' && (
                            <>
                              <Image src="/ethereum3.svg" alt="Native Transfer" width={16} height={16} className="w-4 h-4" />
                              {t.nativeTransfer}
                            </>
                          )}
                          {transaction.type === 'erc20_transfer' && (
                            <>
                              <Image src="/coins.svg" alt="ERC20 Transfer" width={16} height={16} className="w-4 h-4" />
                              {t.erc20Transfer}
                            </>
                          )}
                        </div>
                        {transaction.description && (
                          <div className="text-[10px] text-blue-600">
                            {formatTransactionDescription(transaction, language)}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-500 mt-1">
                          {transaction.type !== 'native_transfer' && (
                            <>To: {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</>
                          )}
                          {transaction.value !== "0" && ` Value: ${transaction.value} ${getNativeCurrencyName(chainId)}`}
                          {transaction.data && ` | Data: ${transaction.data.slice(0, 10)}...`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="text-xs font-medium text-purple-800 border-t border-purple-400 pt-2">
                {t.totalAmount} {displayedTransactions.reduce((total, tx) => total + parseFloat(tx.value), 0)} {getNativeCurrencyName(chainId)}
                </div>
              </div>
            );
          })()}

          {/* Send batch transaction button */}
          <button
            className={`w-full rounded-lg border border-solid px-6 py-3 font-medium transition-colors mb-4 ${
              !isConnected || isPending || customTransactions.length === 0
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-green-700 hover:bg-green-800 text-yellow-300 border-green-800 cursor-pointer"
            }`}
            onClick={handleSendTransaction}
            disabled={!isConnected || isPending || customTransactions.length === 0}
          >
            <div className="flex items-center gap-2 justify-center">
              <Image src="/send.svg" alt="Send" width={16} height={16} className="w-4 h-4" />
              {isPending ? t.sendingTransaction : t.sendBatchTransaction}
            </div>
          </button>

          {/* Transaction state */}
          {isPending && (
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{t.transactionPending}</span>
            </div>
          )}

          {isSuccess && data && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">
                  {t.transactionSubmitted}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                <p>
                  {t.dataId}{" "}
                  <code className="bg-gray-100 px-1 rounded">{data.id}</code>
                </p>
                {transactionCounts && (
                  <p className="mt-2">
                    {t.transactionCount} {t.original} {transactionCounts.original}{t.actuallySent} <span className="text-purple-800 dark:text-purple-400 font-medium">{transactionCounts.sent}</span>{t.transactions}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-700 font-medium">{t.transactionError}</div>
              <div className="text-xs text-red-600 mt-1">{error.message}</div>
            </div>
          )}

          {/* Check transaction status button */}
          {data && (
            <button
              className={`w-full rounded-lg border border-solid px-6 py-3 font-medium transition-colors ${
                statusLoading
                  ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800 text-yellow-300 border-green-800 cursor-pointer"
              }`}
              onClick={handleGetCallsStatus}
              disabled={statusLoading || !data.id}
            >
              {statusLoading
                ? t.checkingStatus
                : t.checkStatus}
            </button>
          )}

          {/* Status error */}
          {statusError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="text-red-700 font-medium">{t.statusCheckError}</div>
              <div className="text-xs text-red-600 mt-1">{statusError}</div>
            </div>
          )}

          {/* Transaction hash */}
          {transactionHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <div className="text-green-700 font-medium mb-2">
                {t.transactionConfirmed}
              </div>
              <div className="text-xs">
                <a
                  href={getExplorerUrl(chainId, transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {t.viewOnExplorer} {transactionHash}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 删除了 Next.js 默认底部按钮（Deploy now / Read our docs） */}
        </div>
      </main>
      {/* 底部导航栏（来自 MM-EIP7702批量交易） */}
      <div className="bg-gray-800 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {/* 左侧：MetaMask Logo 与版权小字 */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <a
                  href="https://docs.metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center hover:opacity-80 transition-opacity"
                  title="MetaMask Documentation"
                >
                  <Image
                    src="/metamask-logo-dark.svg"
                    alt="MetaMask"
                    width={240}
                    height={80}
                    className="h-16 w-auto"
                  />
                </a>
                <div className="mt-2 text-xs text-gray-300">© 2025 MetaMask • A Consensys Formation</div>
              </div>

              {/* Quickstart、Tutorials、Help 按钮 */}
              <div className="flex items-center gap-8">
                <a
                  href="https://docs.metamask.io/quickstart/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-400 font-semibold text-base transition-colors"
                  title="Quickstart"
                >
                  Quickstart
                </a>
                <a
                  href="https://docs.metamask.io/tutorials/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-400 font-semibold text-base transition-colors"
                  title="Tutorials"
                >
                  Tutorials
                </a>
                <a
                  href="https://builder.metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-400 font-semibold text-base transition-colors"
                  title="Help"
                >
                  Help ↗
                </a>
              </div>
            </div>

            {/* 右侧：分享按钮 */}
            <div className="flex gap-2 items-center">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
                {t.share}
              </button>
              <button
                onClick={handleTweet}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                {t.tweet}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t.copy}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 已移除默认 Learn/Examples/Go to nextjs.org 页脚 */}
    </div>
  );
}