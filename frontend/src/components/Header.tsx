import React from "react";
import { WalletConnection } from "./WalletConnection";

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <h1>Donation Platform</h1>
      <p className="app-description">
        A decentralized donation platform where anyone can donate and only the
        owner can withdraw funds
      </p>
      <WalletConnection />
    </header>
  );
};
