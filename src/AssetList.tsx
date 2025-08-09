import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Asset {
  "id-asset": number;
  "name-asset": string;
  "quotation-asset": number;
  "quantity-asset": number;
  "value-average-price-asset": number;
  "value-asset": number;
  "profit-asset": number;
  "percent-recommendation": number;
  "index-asset": number;
}

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<Asset[]>("http://localhost:3000/asset/real-estate")
      .then((res) => setAssets(res.data))
      .catch((err) => {
        console.error("Erro ao buscar ativos:", err);
        setError("Erro ao buscar ativos. Verifique o servidor e o endpoint.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Carregando...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => {
        const lucroPositivo = asset["profit-asset"] >= 0;
        const recomendacaoAlta = asset["percent-recommendation"] >= 50;

        return (
          <Card
            key={asset["id-asset"]}
            className="shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200"
          >
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">
                {asset["name-asset"]}
              </CardTitle>
              <Badge
                className={`${
                  recomendacaoAlta ? "bg-green-600" : "bg-yellow-500"
                } text-white`}
              >
                Recomendação: {asset["percent-recommendation"]}%
              </Badge>
            </CardHeader>

            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Cotação:</strong> R${" "}
                {asset["quotation-asset"].toFixed(2)}
              </p>
              <p>
                <strong>Quantidade:</strong> {asset["quantity-asset"]}
              </p>
              <p>
                <strong>Valor Médio:</strong> R${" "}
                {asset["value-average-price-asset"].toFixed(2)}
              </p>
              <p>
                <strong>Valor Total:</strong> R${" "}
                {asset["value-asset"].toFixed(2)}
              </p>
              <p className={lucroPositivo ? "text-green-600" : "text-red-600"}>
                <strong>Lucro:</strong> R${" "}
                {asset["profit-asset"].toFixed(2)}
              </p>
              <Badge variant="secondary">
                Índice: {asset["index-asset"]}%
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
