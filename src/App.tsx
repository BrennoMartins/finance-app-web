import React from "react";
import AssetList from "./AssetList";
import Navbar from "./Navbar";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <AssetList />
      </main>
    </div>
  );
}