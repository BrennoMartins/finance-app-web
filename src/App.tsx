import React from "react";
import AssetList from "./AssetList";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Meus Ativos Imobiliários</h1>
      <AssetList />
    </div>
  );
}
