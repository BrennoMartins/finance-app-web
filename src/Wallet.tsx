import React, { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet as WalletIcon, Loader2 } from "lucide-react";

/** Resposta da API GET /asset */
interface AssetFromApi {
  id: number;
  asset: string;
  quantity: number;
  averagePrice: number;
  quotation: number;
  difference: number;
  index: number;
  value: number;
  assetCategory: {
    id: number;
    category: string;
  };
}

export interface WalletAsset {
  ativo: string;
  banco: string;
  tipo: string;
  subTipo: string;
  quantidade: number;
  precoMedio: number;
  cotacao: number;
  diferenca: number;
  indice: number;
  valor: number;
  aporteMes: number;
  valorMesAnt: number;
  percentLucroMes: number;
  lucroRs: number;
  vencimento: string;
  percent: number;
}

const COLUMNS: { key: keyof WalletAsset; label: string }[] = [
  { key: "ativo", label: "Ativo" },
  { key: "banco", label: "Banco" },
  { key: "tipo", label: "Tipo" },
  { key: "subTipo", label: "SubTipo" },
  { key: "quantidade", label: "Quantidade" },
  { key: "precoMedio", label: "Preço Médio" },
  { key: "cotacao", label: "Cotação" },
  { key: "diferenca", label: "Diferença" },
  { key: "indice", label: "Indice" },
  { key: "valor", label: "Valor" },
  { key: "aporteMes", label: "Aporte Mês" },
  { key: "valorMesAnt", label: "Valor Mês Ant." },
  { key: "percentLucroMes", label: "% Lucro Mês" },
  { key: "lucroRs", label: "Lucro R$" },
  { key: "vencimento", label: "Vencimento" },
  { key: "percent", label: "%" },
];

/** Em dev o Vite faz proxy de /api para localhost:8080 (evita CORS). Em prod use variável de ambiente. */
const API_URL = "/api/asset";

function mapApiToWalletAsset(item: AssetFromApi): WalletAsset {
  const lucroRs = item.value - item.quantity * item.averagePrice;
  return {
    ativo: item.asset,
    banco: "",
    tipo: item.assetCategory?.category ?? "",
    subTipo: "",
    quantidade: item.quantity,
    precoMedio: item.averagePrice,
    cotacao: item.quotation,
    diferenca: item.difference,
    indice: item.index,
    valor: item.value,
    aporteMes: 0,
    valorMesAnt: 0,
    percentLucroMes: 0,
    lucroRs,
    vencimento: "",
    percent: item.index,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getCellClassName(key: keyof WalletAsset, value: unknown): string {
  const isPositive =
    typeof value === "number" && value >= 0;
  const isNegative =
    typeof value === "number" && value < 0;
  if (
    (key === "lucroRs" || key === "diferenca" || key === "indice") &&
    (isPositive || isNegative)
  ) {
    return isPositive ? "text-emerald-600 font-medium" : "text-red-600 font-medium";
  }
  return "";
}

export default function Wallet() {
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<AssetFromApi[]>(API_URL)
      .then((res) => setAssets(res.data.map(mapApiToWalletAsset)))
      .catch((err) => {
        console.error("Erro ao buscar carteira:", err);
        setError(
          "Erro ao buscar ativos da carteira. Verifique o servidor e o endpoint."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <WalletIcon className="h-5 w-5 text-emerald-600" />
              Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando ativos...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <WalletIcon className="h-5 w-5 text-red-600" />
              Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <WalletIcon className="h-5 w-5 text-emerald-600" />
            Carteira
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {assets.length} ativo{assets.length !== 1 ? "s" : ""} na carteira
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {COLUMNS.map(({ key, label }) => (
                    <TableHead
                      key={key}
                      className="whitespace-nowrap bg-muted/50 font-semibold text-foreground"
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMNS.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nenhum ativo na carteira.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((row, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        "transition-colors",
                        index % 2 === 1 && "bg-muted/20"
                      )}
                    >
                      {COLUMNS.map(({ key }) => {
                        const value = row[key];
                        const isNumber = typeof value === "number";
                        const isCurrency =
                          key === "precoMedio" ||
                          key === "cotacao" ||
                          key === "valor" ||
                          key === "aporteMes" ||
                          key === "valorMesAnt" ||
                          key === "lucroRs" ||
                          key === "diferenca";
                        const isPercent =
                          key === "indice" ||
                          key === "percentLucroMes" ||
                          key === "percent";

                        return (
                          <TableCell
                            key={key}
                            className={cn(
                              "whitespace-nowrap",
                              getCellClassName(key, value)
                            )}
                          >
                            {isNumber && isCurrency && formatCurrency(value)}
                            {isNumber && isPercent && formatPercent(value)}
                            {isNumber && !isCurrency && !isPercent && value}
                            {typeof value === "string" && (value || "—")}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
