# 交易配置说明

## 概述

这个目录包含了批量交易的配置管理，使用简单的 JSON 文件存储配置数据，将交易数据从主组件中分离出来，提高了代码的可维护性和可配置性。

## 文件结构

- `transactions.json` - JSON 格式的交易配置文件

## JSON 配置结构

```json
[
  {
    "type": "native_transfer",
    "to": "0x...",           // 接收地址
    "value": "0.001",        // ETH 金额（字符串格式）
    "description": "Transfer 0.001 ETH to address"
  },
  {
    "type": "erc20_transfer",
    "to": "0x...",           // 合约地址
    "value": "0",            // 通常为 0
    "data": "0x...",         // 编码后的函数调用数据
    "description": "Transfer ERC20 tokens"
  },
  {
    "type": "erc20_approve",
    "to": "0x...",           // 合约地址
    "value": "0",            // 通常为 0
    "data": "0x...",         // 编码后的 approve 函数调用
    "description": "Approve ERC20 spending"
  },
  {
    "type": "custom_data",
    "to": "0x...",           // 目标地址
    "value": "0",            // ETH 金额
    "data": "0x...",         // 自定义十六进制数据
    "description": "Send custom hex data"
  }
]
```

### 字段说明

- `type`: 交易类型标识符
- `to`: 目标地址（EOA 或合约地址）
- `value`: 发送的 ETH 金额（字符串格式）
- `data`: 可选的十六进制数据（用于合约调用）
- `description`: **可选的**交易描述（用于 UI 显示，不影响交易执行）

### 必需字段 vs 可选字段

**必需字段**：
- `type`: 交易类型
- `to`: 目标地址
- `value`: ETH 金额

**可选字段**：
- `data`: 合约调用数据（ERC20 交易需要）
- `description`: 交易描述（仅用于 UI 显示）

### 支持的交易类型

1. **native_transfer**: 原生 ETH 转账
2. **erc20_transfer**: ERC20 代币转账
3. **erc20_approve**: ERC20 代币授权
4. **custom_data**: 发送自定义数据

## 使用方法

### 修改交易配置

1. 编辑 `transactions.json` 文件
2. 修改 `to` 地址和 `value` 金额
3. 保存文件，配置会自动生效

### 添加新交易

在 `transactions.json` 数组中添加新的交易对象：

```json
{
  "to": "0x...",           // 接收地址
  "value": "0.001"          // ETH 金额
}
```

### 删除交易

从 `transactions.json` 数组中删除不需要的交易对象。

### 简化配置示例

如果您不需要描述信息，可以使用更简洁的配置：

```json
[
  {
    "type": "native_transfer",
    "to": "0xd328426a8e0bcdbbef89e96a91911eff68734e84",
    "value": "0.001"
  },
  {
    "type": "erc20_transfer",
    "to": "0xA0b86a33E6441b8C4C8C0E1234567890AbCdEf12",
    "value": "0",
    "data": "0xa9059cbb000000000000000000000000144eca70d0effe4f13a0d9eba7a23c77885a44f30000000000000000000000000000000000000000000000000000000000000064"
  }
]
```

## 最佳实践

1. **地址验证**: 确保所有地址都是有效的以太坊地址
2. **金额检查**: 确保金额为正数且格式正确
3. **测试**: 在测试网络上先验证配置

## 安全注意事项

- 确保接收地址是可信的
- 在生产环境中使用前充分测试
- 定期检查配置的有效性
