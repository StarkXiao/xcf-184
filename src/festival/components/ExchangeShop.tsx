import React from 'react';
import type { ExchangeItem } from '../types';

interface ExchangeShopProps {
  exchanges: ExchangeItem[];
  festivalCurrency: number;
  canPurchaseExchange: (exchangeId: string) => boolean;
  onPurchase: (exchangeId: string) => void;
  getPurchaseCount: (exchangeId: string) => number;
}

export const ExchangeShop: React.FC<ExchangeShopProps> = ({
  exchanges,
  festivalCurrency,
  canPurchaseExchange,
  onPurchase,
  getPurchaseCount,
}) => {
  return (
    <div className="festival-exchange-shop">
      <div className="festival-exchange-currency">
        <span>🌸 你的樱花花瓣：</span>
        <strong>{festivalCurrency}</strong>
      </div>
      <div className="festival-exchange-grid">
        {exchanges.map((exchange) => {
          const canBuy = canPurchaseExchange(exchange.id);
          const purchased = getPurchaseCount(exchange.id);
          const limitText = exchange.limitPerPlayer
            ? `限购${exchange.limitPerPlayer}件 (已购${purchased})`
            : exchange.dailyLimit
            ? `每日限${exchange.dailyLimit}件`
            : '';

          return (
            <div
              key={exchange.id}
              className={`festival-exchange-card ${
                canBuy ? '' : 'disabled'
              }`}
            >
              <div className="festival-exchange-icon">
                {exchange.reward.icon || '🎁'}
              </div>
              <div className="festival-exchange-name">
                {exchange.reward.name}
              </div>
              <div className="festival-exchange-amount">
                x{exchange.reward.amount}
              </div>
              {limitText && (
                <div className="festival-exchange-limit">{limitText}</div>
              )}
              <div className="festival-exchange-cost">
                🌸 {exchange.cost}
              </div>
              <button
                className="festival-exchange-buy-btn"
                disabled={!canBuy}
                onClick={() => canBuy && onPurchase(exchange.id)}
              >
                {canBuy ? '兑换' : '无法兑换'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
