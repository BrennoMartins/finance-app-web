import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
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

  if (loading) return <div className="text-center mt-10">Carregando...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;

  return (
    <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => (
        <Card key={asset["id-asset"]}>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">{asset["name-asset"]}</h2>
            <p>
              <strong>Cotação:</strong> R$ {asset["quotation-asset"].toFixed(2)}
            </p>
            <p>
              <strong>Quantidade:</strong> {asset["quantity-asset"]}
            </p>
            <p>
              <strong>Valor Médio:</strong> R$ {asset["value-average-price-asset"].toFixed(2)}
            </p>
            <p>
              <strong>Valor Total:</strong> R$ {asset["value-asset"].toFixed(2)}
            </p>
            <p>
              <strong>Lucro:</strong> R$ {asset["profit-asset"].toFixed(2)}
            </p>
            <p>
              <strong>Recomendação:</strong> {asset["percent-recommendation"]}%
            </p>
            <Badge className="mt-2 inline-block">Índice: {asset["index-asset"]}%</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
