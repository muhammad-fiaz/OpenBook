"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/financial";

interface StatsCardsProps {
  stats: {
    totalIncome: string;
    totalExpense: string;
    netProfit: string;
    totalPaid: string;
    outstandingReceivables: string;
    overdueReceivables: string;
    upcomingReceivables: string;
    averageDealSize: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      iconColor: "text-green-500",
    },
    {
      title: "Total Expense",
      value: formatCurrency(stats.totalExpense),
      icon: TrendingDown,
      iconColor: "text-red-500",
    },
    {
      title: "Net Profit",
      value: formatCurrency(stats.netProfit),
      icon: DollarSign,
      iconColor: Number(stats.netProfit) >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Total Paid",
      value: formatCurrency(stats.totalPaid),
      icon: CreditCard,
      iconColor: "text-blue-500",
    },
    {
      title: "Outstanding",
      value: formatCurrency(stats.outstandingReceivables),
      icon: DollarSign,
      iconColor: "text-amber-500",
    },
    {
      title: "Overdue",
      value: formatCurrency(stats.overdueReceivables),
      icon: AlertCircle,
      iconColor: "text-red-500",
    },
    {
      title: "Upcoming",
      value: formatCurrency(stats.upcomingReceivables),
      icon: Clock,
      iconColor: "text-blue-500",
    },
    {
      title: "Average Deal Size",
      value: formatCurrency(stats.averageDealSize),
      icon: TrendingUp,
      iconColor: "text-purple-500",
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <motion.div key={card.title} variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
