import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart2, Loader2 } from "lucide-react";

interface AssetTypeReportItem {
  assetTypeId: number;
  assetTypeName: string;
  totalValue: number;
}

const API_REPORT_BY_TYPE_URL = "/api/reports/assets/by-type";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export default function Report() {
  const [rows, setRows] = useState<AssetTypeReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<number | null>(null);

  const totalValue = rows.reduce((acc, row) => acc + row.totalValue, 0);
  const pieRadius = 88;
  const pieStroke = 40;
  const pieSize = 240;
  const pieCircumference = 2 * Math.PI * pieRadius;

  const pieSegments = (() => {
    if (totalValue <= 0 || rows.length === 0) return [];

    let offset = 0;
    return rows.map((row, index) => {
      const ratio = row.totalValue / totalValue;
      const length = ratio * pieCircumference;
      const percent = ratio * 100;
      const mid = offset + length / 2;
      const angle = -90 + (mid / pieCircumference) * 360;
      const angleRad = (angle * Math.PI) / 180;
      const labelRadius = pieRadius + 36;
      const labelX = pieSize / 2 + Math.cos(angleRad) * labelRadius;
      const labelY = pieSize / 2 + Math.sin(angleRad) * labelRadius;
      const segment = {
        key: row.assetTypeId,
        label: row.assetTypeName,
        value: row.totalValue,
        color: PIE_COLORS[index % PIE_COLORS.length],
        length,
        offset,
        percent,
        labelX,
        labelY,
      };
      offset += length;
      return segment;
    });
  })();

  useEffect(() => {
    axios
      .get<AssetTypeReportItem[]>(API_REPORT_BY_TYPE_URL)
      .then((res) => {
        if (res.status === 204 || !Array.isArray(res.data)) {
          setRows([]);
          return;
        }
        setRows(res.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar relatório por tipo:", err);
        setError("Erro ao buscar relatório de ativos por tipo.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (
      selectedSegmentKey != null &&
      !rows.some((row) => row.assetTypeId === selectedSegmentKey)
    ) {
      setSelectedSegmentKey(null);
    }
  }, [rows, selectedSegmentKey]);

  useEffect(() => {
    if (loading || error || rows.length === 0 || totalValue <= 0) {
      setAnimateIn(false);
      return;
    }

    const timer = window.setTimeout(() => setAnimateIn(true), 80);
    return () => window.clearTimeout(timer);
  }, [loading, error, rows.length, totalValue]);

  if (loading) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileBarChart2 className="h-5 w-5 text-emerald-600" />
              Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando relatório...</span>
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
              <FileBarChart2 className="h-5 w-5 text-red-600" />
              Report
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
            <FileBarChart2 className="h-5 w-5 text-emerald-600" />
            Report
          </CardTitle>
          <p className="text-sm text-muted-foreground">Resumo de ativos por tipo</p>
        </CardHeader>
        <CardContent className="p-6">
          {rows.length === 0 || totalValue <= 0 ? (
            <div className="flex h-44 items-center justify-center text-muted-foreground">
              Nenhum dado encontrado.
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[560px] items-center justify-center">
                <div
                  className="relative transition-all duration-700 ease-out"
                  style={{
                    opacity: animateIn ? 1 : 0,
                    transform: animateIn ? "scale(1)" : "scale(0.92)",
                  }}
                >
                  <svg
                    width={560}
                    height={320}
                    viewBox={`0 0 ${pieSize} ${pieSize}`}
                    aria-label="Gráfico de pizza por tipo de ativo"
                    className="overflow-visible"
                    onClick={() => setSelectedSegmentKey(null)}
                  >
                    <circle
                      cx={pieSize / 2}
                      cy={pieSize / 2}
                      r={pieRadius}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeWidth={pieStroke}
                    />
                    {pieSegments.map((segment) => (
                      <circle
                        key={segment.key}
                        cx={pieSize / 2}
                        cy={pieSize / 2}
                        r={pieRadius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={pieStroke}
                        strokeDasharray={`${segment.length} ${pieCircumference}`}
                        strokeDashoffset={-segment.offset}
                        transform={`rotate(-90 ${pieSize / 2} ${pieSize / 2})`}
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          opacity:
                            selectedSegmentKey == null || selectedSegmentKey === segment.key
                              ? 1
                              : 0.2,
                          filter:
                            selectedSegmentKey == null || selectedSegmentKey === segment.key
                              ? "none"
                              : "blur(1.5px)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSegmentKey((prev) =>
                            prev === segment.key ? null : segment.key
                          );
                        }}
                      >
                        <title>
                          {`${segment.label}: ${formatCurrency(segment.value)} (${segment.percent.toFixed(2)}%)`}
                        </title>
                      </circle>
                    ))}

                    {pieSegments.map((segment) => (
                      <g
                        key={`${segment.key}-label`}
                        className="transition-all duration-300"
                        style={{
                          opacity:
                            selectedSegmentKey == null || selectedSegmentKey === segment.key
                              ? 1
                              : 0.35,
                          filter:
                            selectedSegmentKey == null || selectedSegmentKey === segment.key
                              ? "none"
                              : "blur(0.8px)",
                        }}
                      >
                        <text
                          x={segment.labelX}
                          y={segment.labelY - 6}
                          textAnchor={segment.labelX >= pieSize / 2 ? "start" : "end"}
                          className="fill-foreground text-[8px] font-medium"
                        >
                          {segment.label}
                        </text>
                        <text
                          x={segment.labelX}
                          y={segment.labelY + 8}
                          textAnchor={segment.labelX >= pieSize / 2 ? "start" : "end"}
                          className="fill-muted-foreground text-[7px]"
                        >
                          {segment.percent.toFixed(2)}%
                        </text>
                      </g>
                    ))}
                  </svg>

                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalValue)}</p>
                  </div>
                </div>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
