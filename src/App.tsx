import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import AssetList from "./AssetList";
import Wallet from "./Wallet";
import Contributions from "./Contributions";

const NAVBAR_HEIGHT = 64; // px (h-16)

export default function App() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
      <Navbar />
      {/* Spacer fixo: reserva o espaço da navbar fixa para o conteúdo não sobrepor */}
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: NAVBAR_HEIGHT, minHeight: NAVBAR_HEIGHT }}
      />
      <main className="relative z-0 container mx-auto flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<></>} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/recommendations" element={<AssetList />} />
          <Route path="/contributions" element={<Contributions />} />
          <Route path="/quotation" element={<p>ola quotation</p>} />
          <Route path="/about" element={<></>} />
        </Routes>
      </main>
    </div>
  );
}
