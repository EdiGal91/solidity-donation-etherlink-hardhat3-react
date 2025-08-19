import React from "react";
import { APP_CONFIG } from "../config/constants";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <p>
        View contract on{" "}
        <a
          href={APP_CONFIG.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Etherlink Explorer
        </a>
      </p>
    </footer>
  );
};
